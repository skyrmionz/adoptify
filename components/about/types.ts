// Tiny shared types for slide content. Keeping this lightweight on purpose —
// each slide owns its own copy and layout in its own component file.

export type Card = {
  title: string;
  body: string;
  /** Optional inline link/chip surfaced below the body, used on slide 6. */
  chip?: { label: string; href: string };
};

export type SlideShellProps = {
  eyebrow: string;
  headline: string;
  body?: string;
  children?: React.ReactNode;
};
