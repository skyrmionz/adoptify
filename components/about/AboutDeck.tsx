"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlideIntro } from "./slides/SlideIntro";
import { SlideChallenges } from "./slides/SlideChallenges";
import { SlideStructure } from "./slides/SlideStructure";
import { SlideBuild } from "./slides/SlideBuild";
import { SlideValue } from "./slides/SlideValue";
import { SlideHowAdoptify } from "./slides/SlideHowAdoptify";
import { SlideOutro } from "./slides/SlideOutro";

const SLIDES: { key: string; render: () => React.ReactNode }[] = [
  { key: "intro", render: () => <SlideIntro /> },
  { key: "challenges", render: () => <SlideChallenges /> },
  { key: "structure", render: () => <SlideStructure /> },
  { key: "build", render: () => <SlideBuild /> },
  { key: "value", render: () => <SlideValue /> },
  { key: "how", render: () => <SlideHowAdoptify /> },
  { key: "outro", render: () => <SlideOutro /> },
];

export function AboutDeck() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const goTo = useCallback((next: number) => {
    setIndex((cur) => {
      const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
      setDirection(clamped >= cur ? 1 : -1);
      return clamped;
    });
  }, []);
  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't hijack typing inputs.
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const slide = SLIDES[index];
  const atStart = index === 0;
  const atEnd = index === SLIDES.length - 1;

  const variants = {
    enter: (d: 1 | -1) => ({ opacity: 0, x: d === 1 ? 24 : -24 }),
    center: { opacity: 1, x: 0 },
    exit: (d: 1 | -1) => ({ opacity: 0, x: d === 1 ? -24 : 24 }),
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Stage */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={slide.key}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="w-full"
          >
            {slide.render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer controls */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)]/85 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={prev}
            disabled={atStart}
            className={cn(
              "h-10 px-4 rounded-md border text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap transition",
              atStart
                ? "opacity-30 cursor-not-allowed border-[var(--color-border)] text-[var(--color-text-subtle)]"
                : "bg-[var(--color-surface-2)] border-[var(--color-border)] hover:border-[var(--color-border-strong)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            )}
          >
            <ArrowLeft size={14} /> Previous
          </button>

          <div className="flex items-center gap-2">
            {SLIDES.map((s, i) => {
              const active = i === index;
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={cn(
                    "transition-all rounded-full",
                    active
                      ? "h-2.5 w-6 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-glow)]"
                      : "h-2.5 w-2.5 bg-[var(--color-surface-3)] hover:bg-[var(--color-border-strong)]",
                  )}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={next}
            disabled={atEnd}
            className={cn(
              "h-10 px-4 rounded-md text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap transition",
              atEnd
                ? "opacity-30 cursor-not-allowed bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-subtle)]"
                : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white",
            )}
          >
            Next <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
