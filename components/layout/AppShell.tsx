"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import type { User, Organization } from "@prisma/client";

type UserWithOrg = User & { org: Pick<Organization, "id" | "name" | "slug" | "logoUrl" | "currency" | "timezone"> & { settings: unknown } };

interface AppShellProps {
  user: UserWithOrg;
  children: React.ReactNode;
  unreadCount?: number;
}

export default function AppShell({ user, children, unreadCount = 0 }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        user={user}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden lg:pl-64">
        <TopBar
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          unreadCount={unreadCount}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in-scale">
          {children}
        </main>
      </div>
    </div>
  );
}
