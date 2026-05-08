"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Compass,
  Sparkles,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { sections } from "@/content";

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
  const onMissions = !!path && (path === "/missions" || path.startsWith("/missions/"));
  const [missionsOpen, setMissionsOpen] = useState<boolean>(onMissions);

  return (
    <aside className="w-[240px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]/60 backdrop-blur-sm h-screen sticky top-0 flex flex-col">
      <div className="p-5 flex items-center gap-3">
        <Image
          src="/logos/adoptify.png"
          alt="adoptify"
          width={36}
          height={36}
          className="h-9 w-9 object-contain drop-shadow-[0_0_24px_rgba(0,161,224,0.35)]"
          priority
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight lowercase">adoptify</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
        {ITEMS.map((item) => {
          const active = path === item.href || (item.href !== "/" && path?.startsWith(item.href + "/"));
          const Icon = item.icon;
          const isMissions = item.href === "/missions";

          if (isMissions) {
            return (
              <div key={item.href}>
                <div className="relative flex items-center">
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex flex-1 items-center gap-3 px-3 h-10 rounded-md text-sm transition-all whitespace-nowrap pr-9",
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
                  <button
                    type="button"
                    aria-label={missionsOpen ? "Collapse Missions" : "Expand Missions"}
                    onClick={() => setMissionsOpen((v) => !v)}
                    className="absolute right-1 top-1.5 bottom-1.5 px-2 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-3)] flex items-center"
                  >
                    <ChevronDown
                      size={14}
                      className={cn("transition-transform duration-200", missionsOpen ? "rotate-0" : "-rotate-90")}
                    />
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {missionsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-1 mb-1 ml-7 pl-2 border-l border-[var(--color-border)] flex flex-col gap-0.5">
                        {sections.map((s) => {
                          const sectionHref = `/missions/${s.slug}`;
                          const sectionActive = path === sectionHref || path?.startsWith(sectionHref + "/");
                          return (
                            <li key={s.id}>
                              <Link
                                href={sectionHref}
                                className={cn(
                                  "block px-3 h-8 rounded-md text-xs leading-8 transition-colors whitespace-nowrap truncate",
                                  sectionActive
                                    ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                                )}
                              >
                                {s.title}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-all whitespace-nowrap",
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
