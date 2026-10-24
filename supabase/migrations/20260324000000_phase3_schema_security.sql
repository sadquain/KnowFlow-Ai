-- ==============================================================================
-- KnowFlow AI — Phase 3 Database Migrations & Security Hardening
-- Migration: 20260324000000_phase3_schema_security.sql
-- ==============================================================================

-- 1. Helper function: Comprehensive workspace membership check
-- Checks both explicit workspace_members entries AND direct workspace ownership
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = ws_id
              AND wm.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = ws_id
              AND w.owner_id = auth.uid()
        )
    );
$$;

-- 2. Auth Profile Trigger: Automatically sync auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users in auth.users that might be missing from public.profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url, created_at, updated_at)
SELECT
    id,
    email,
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'avatar_url',
    now(),
    now()
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Embedding Model Metadata Columns (768-dim models: gemini-embedding-001 / nomic-embed-text)
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'gemini-embedding-001';

ALTER TABLE public.document_chunks
ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'gemini-embedding-001';

-- 4. Rate Limits Table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    request_count INT NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(workspace_id, user_id, endpoint, window_start);

-- 5. Hardened Vector Match Function: SECURITY INVOKER + Workspace Membership Check
-- Replaces previous SECURITY DEFINER function
DROP FUNCTION IF EXISTS public.match_document_chunks(vector, float, int, uuid, uuid[]);

CREATE OR REPLACE FUNCTION public.match_document_chunks(
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    p_workspace_id uuid,
    p_document_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    document_title text,
    chunk_index int,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    -- Explicitly verify that the caller is a member or owner of the target workspace
    IF NOT public.is_workspace_member(p_workspace_id) THEN
        RAISE EXCEPTION 'Access denied: Caller % is not authorized to query workspace %', auth.uid(), p_workspace_id;
    END IF;

    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        d.title AS document_title,
        dc.chunk_index,
        dc.content,
        dc.metadata,
        (1 - (dc.embedding <=> query_embedding))::float AS similarity
    FROM public.document_chunks dc
    JOIN public.documents d ON d.id = dc.document_id
    WHERE dc.workspace_id = p_workspace_id
      AND d.status = 'ready'
      AND (p_document_ids IS NULL OR dc.document_id = ANY(p_document_ids))
      AND (1 - (dc.embedding <=> query_embedding)) >= match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 6. Comprehensive Row Level Security (RLS) Policies on All Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Workspaces Policies (Drop old if exists to ensure idempotency)
DROP POLICY IF EXISTS "Owners can delete workspaces" ON public.workspaces;
CREATE POLICY "Owners can delete workspaces" ON public.workspaces
    FOR DELETE USING (auth.uid() = owner_id);

-- Workspace Members Policies (Ensure full CRUD for owners and admins)
DROP POLICY IF EXISTS "Owners and admins can insert members" ON public.workspace_members;
CREATE POLICY "Owners and admins can insert members" ON public.workspace_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Owners and admins can update members" ON public.workspace_members;
CREATE POLICY "Owners and admins can update members" ON public.workspace_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner', 'admin')
        )
    );

DROP POLICY IF EXISTS "Owners and admins can delete members" ON public.workspace_members;
CREATE POLICY "Owners and admins can delete members" ON public.workspace_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.workspaces w
            WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner', 'admin')
        )
    );

-- Document Chunks Policies
DROP POLICY IF EXISTS "Members can insert chunks" ON public.document_chunks;
CREATE POLICY "Members can insert chunks" ON public.document_chunks
    FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update chunks" ON public.document_chunks;
CREATE POLICY "Members can update chunks" ON public.document_chunks
    FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete chunks" ON public.document_chunks;
CREATE POLICY "Members can delete chunks" ON public.document_chunks
    FOR DELETE USING (public.is_workspace_member(workspace_id));

-- Conversations Policies
DROP POLICY IF EXISTS "Members can update conversations" ON public.conversations;
CREATE POLICY "Members can update conversations" ON public.conversations
    FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete conversations" ON public.conversations;
CREATE POLICY "Members can delete conversations" ON public.conversations
    FOR DELETE USING (public.is_workspace_member(workspace_id));

-- Messages Policies
DROP POLICY IF EXISTS "Members can update messages" ON public.messages;
CREATE POLICY "Members can update messages" ON public.messages
    FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can delete messages" ON public.messages;
CREATE POLICY "Members can delete messages" ON public.messages
    FOR DELETE USING (public.is_workspace_member(workspace_id));

-- Message Sources Policies
DROP POLICY IF EXISTS "Members can insert message sources" ON public.message_sources;
CREATE POLICY "Members can insert message sources" ON public.message_sources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_sources.message_id
              AND public.is_workspace_member(m.workspace_id)
        )
    );

DROP POLICY IF EXISTS "Members can delete message sources" ON public.message_sources;
CREATE POLICY "Members can delete message sources" ON public.message_sources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.messages m
            WHERE m.id = message_sources.message_id
              AND public.is_workspace_member(m.workspace_id)
        )
    );

-- AI Usage Policies
DROP POLICY IF EXISTS "Members can insert ai usage" ON public.ai_usage;
CREATE POLICY "Members can insert ai usage" ON public.ai_usage
    FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

-- Rate Limits Policies
DROP POLICY IF EXISTS "Members can view rate limits" ON public.rate_limits;
CREATE POLICY "Members can view rate limits" ON public.rate_limits
    FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can insert rate limits" ON public.rate_limits;
CREATE POLICY "Members can insert rate limits" ON public.rate_limits
    FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Members can update rate limits" ON public.rate_limits;
CREATE POLICY "Members can update rate limits" ON public.rate_limits
    FOR UPDATE USING (public.is_workspace_member(workspace_id));

-- 7. Storage Bucket & Path Isolation Policies
-- Ensure documents storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'documents',
    'documents',
    false,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']
)
ON CONFLICT (id) DO UPDATE
SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];

-- Storage Object Security Policies: Authenticated users can only read/upload/delete within their own workspaces
DROP POLICY IF EXISTS "Allow members to read document storage objects" ON storage.objects;
CREATE POLICY "Allow members to read document storage objects"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents'
    AND public.is_workspace_member(
        CASE 
            WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' 
            THEN (storage.foldername(name))[1]::uuid 
            ELSE NULL 
        END
    )
);

DROP POLICY IF EXISTS "Allow members to upload document storage objects" ON storage.objects;
CREATE POLICY "Allow members to upload document storage objects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents'
    AND public.is_workspace_member(
        CASE 
            WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' 
            THEN (storage.foldername(name))[1]::uuid 
            ELSE NULL 
        END
    )
);

DROP POLICY IF EXISTS "Allow members to delete document storage objects" ON storage.objects;
CREATE POLICY "Allow members to delete document storage objects"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents'
    AND public.is_workspace_member(
        CASE 
            WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' 
            THEN (storage.foldername(name))[1]::uuid 
            ELSE NULL 
        END
    )
);
