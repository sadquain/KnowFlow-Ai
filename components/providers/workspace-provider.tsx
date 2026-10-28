"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  workspaceId: string | null;
  isLoading: boolean;
  setCurrentWorkspaceId: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  currentWorkspace: null,
  workspaceId: null,
  isLoading: true,
  setCurrentWorkspaceId: () => {},
  refreshWorkspaces: async () => {},
});

const STORAGE_KEY = "knowflow_active_workspace_id";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const data = await res.json();
        const list: Workspace[] = data.workspaces || [];
        setWorkspaces(list);

        if (list.length > 0) {
          const savedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
          const match = savedId ? list.find((w) => w.id === savedId) : null;
          const active = match || list[0];
          setCurrentWorkspaceIdState(active.id);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, active.id);
          }
        }
      }
    } catch (err) {
      console.error("[WorkspaceProvider] Failed to fetch workspaces:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/workspaces");
        if (res.ok && !ignore) {
          const data = await res.json();
          const list: Workspace[] = data.workspaces || [];
          setWorkspaces(list);

          if (list.length > 0) {
            const savedId =
              typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
            const match = savedId ? list.find((w) => w.id === savedId) : null;
            const active = match || list[0];
            setCurrentWorkspaceIdState(active.id);
            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEY, active.id);
            }
          }
        }
      } catch (err) {
        console.error("[WorkspaceProvider] Failed to fetch workspaces:", err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const setCurrentWorkspaceId = useCallback((id: string) => {
    setCurrentWorkspaceIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const currentWorkspace = useMemo(() => {
    return workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0] || null;
  }, [workspaces, currentWorkspaceId]);

  const contextValue = useMemo<WorkspaceContextType>(
    () => ({
      workspaces,
      currentWorkspace,
      workspaceId: currentWorkspace?.id || null,
      isLoading,
      setCurrentWorkspaceId,
      refreshWorkspaces: fetchWorkspaces,
    }),
    [workspaces, currentWorkspace, isLoading, setCurrentWorkspaceId, fetchWorkspaces]
  );

  return <WorkspaceContext.Provider value={contextValue}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
