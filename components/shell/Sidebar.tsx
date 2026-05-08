"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Sparkles, TrendingUp, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> };

const ITEMS: Item[] = [
  { href: "/missions", label: "Missions", icon: Compass },
  { href: "/agent", label: "Agent", icon: Sparkles },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-[240px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-sm h-screen sticky top-0 flex flex-col">
      <div className="p-5 flex items-center gap-3">
        <Image
          src="/logos/adoptify.png"
          alt="Adoptify"
          width={36}
          height={36}
          className="h-9 w-9 object-contain drop-shadow-[0_0_24px_rgba(0,161,224,0.35)]"
          priority
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight lowercase">adoptify</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Agentforce</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
        {ITEMS.map((item) => {
          const active = path === item.href || path?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-all",
                active
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full transition-colors",
                  active ? "bg-[var(--color-glow)]" : "bg-transparent",
                )}
              />
              <Icon size={16} className={active ? "text-[var(--color-glow)]" : ""} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 text-[11px] text-[var(--color-text-subtle)] border-t border-[var(--color-border)]">
        <div className="opacity-70">v0.1 · early access</div>
      </div>
    </aside>
  );
}
