"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/navigation/sidebar";
import { Header } from "@/components/navigation/header";

interface AppShellProps {
  children: React.ReactNode;
  workspaceId?: string;
}

export function AppShell({ children, workspaceId = "default-ws" }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        currentWorkspaceId={workspaceId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-screen flex-col md:pl-64">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main id="main-content" className="flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
