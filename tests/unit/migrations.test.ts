import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Phase 3 Database Migrations & Security Schema Suite", () => {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const initMigrationPath = path.join(migrationsDir, "20250101000000_knowflow_init.sql");
  const phase3MigrationPath = path.join(migrationsDir, "20260324000000_phase3_schema_security.sql");

  it("should keep initial migration intact without editing applied history", () => {
    expect(fs.existsSync(initMigrationPath)).toBe(true);
    const initSql = fs.readFileSync(initMigrationPath, "utf-8");
    expect(initSql).toContain("KnowFlow AI — Complete Database Schema & Migrations");
  });

  it("should have created a new dedicated migration file for Phase 3", () => {
    expect(fs.existsSync(phase3MigrationPath)).toBe(true);
    const sql = fs.readFileSync(phase3MigrationPath, "utf-8");
    expect(sql.length).toBeGreaterThan(500);
  });

  it("should define on_auth_user_created trigger on auth.users copying user profiles", () => {
    const sql = fs.readFileSync(phase3MigrationPath, "utf-8");
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.handle_new_user()");
    expect(sql).toContain("on_auth_user_created");
    expect(sql).toContain("AFTER INSERT ON auth.users");
    expect(sql).toContain("NEW.raw_user_meta_data->>'full_name'");
  });

  it("should configure match_document_chunks with SECURITY INVOKER and caller workspace check", () => {
    const sql = fs.readFileSync(phase3MigrationPath, "utf-8");
    expect(sql).toContain("SECURITY INVOKER");
    expect(sql).toContain("public.is_workspace_member(p_workspace_id)");
    expect(sql).not.toContain(
      "SECURITY DEFINER\nAS $$\nBEGIN\n    RETURN QUERY\n    SELECT\n        dc.id,\n        dc.document_id,\n        d.title AS document_title"
    );
  });

  it("should define rate_limits table and RLS on all critical tables", () => {
    const sql = fs.readFileSync(phase3MigrationPath, "utf-8");
    const requiredRlsTables = [
      "public.profiles",
      "public.workspaces",
      "public.workspace_members",
      "public.documents",
      "public.document_chunks",
      "public.conversations",
      "public.messages",
      "public.message_sources",
      "public.ai_usage",
      "public.rate_limits",
    ];

    for (const table of requiredRlsTables) {
      expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
    }

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.rate_limits");
  });

  it("should add embedding_model column and verify vector(768) compatibility", () => {
    const sql = fs.readFileSync(phase3MigrationPath, "utf-8");
    expect(sql).toContain("ALTER TABLE public.documents\nADD COLUMN IF NOT EXISTS embedding_model");
    expect(sql).toContain(
      "ALTER TABLE public.document_chunks\nADD COLUMN IF NOT EXISTS embedding_model"
    );
    expect(sql).toContain("vector(768)");
  });

  it("should enforce storage bucket policies tied to workspace membership", () => {
    const sql = fs.readFileSync(phase3MigrationPath, "utf-8");
    expect(sql).toContain("storage.buckets");
    expect(sql).toContain("storage.objects");
    expect(sql).toContain("Allow members to read document storage objects");
    expect(sql).toContain("Allow members to upload document storage objects");
    expect(sql).toContain("Allow members to delete document storage objects");
  });
});
