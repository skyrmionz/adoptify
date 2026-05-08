"use client";

import { useState } from "react";
import { ChevronDown, LogOut, Building2 } from "lucide-react";

export function TopBar({ user, orgName }: { user: { email: string; name: string | null }; orgName?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)]/40 backdrop-blur-md sticky top-0 z-10 flex items-center px-6">
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <Building2 size={14} />
        <span>{orgName ? orgName : "No org connected"}</span>
        {!orgName && (
          <a href="/settings" className="ml-2 text-[var(--color-accent)] hover:underline">
            Connect
          </a>
        )}
      </div>

      <div className="ml-auto relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 h-9 px-3 rounded-md hover:bg-[var(--color-surface-2)] text-sm"
        >
          <div className="h-7 w-7 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-xs font-semibold">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:inline text-[var(--color-text)]">{user.name ?? user.email}</span>
          <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 surface-card p-1 z-20">
            <div className="px-3 py-2 border-b border-[var(--color-border)]">
              <div className="text-xs text-[var(--color-text-muted)]">Signed in as</div>
              <div className="text-sm truncate">{user.email}</div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 h-9 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] rounded-md"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
