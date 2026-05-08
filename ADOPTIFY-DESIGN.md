# Adoptify — Design Guide

## Brand identity

Adoptify is the Agentforce adoption companion. The product feels premium, dark, and Agentforce-native — somewhere between a fintech dashboard (Linear, Stripe) and a high-end developer console. Calm surfaces, sharp typography, deliberate motion, electric Salesforce-blue accents.

Tone:
- Confident, never noisy
- Data-dense without being cluttered
- Always communicates progress and what to do next

---

## Color palette

| Token              | Value                              | Usage |
|--------------------|------------------------------------|-------|
| `--bg`             | `#0B1220`                          | Page background, near-black navy |
| `--surface`        | `#131A2B`                          | Cards, sidebar, panels |
| `--surface-2`      | `#1A2440`                          | Hovered cards, raised tiles |
| `--surface-3`      | `#22305A`                          | Pressed / focused tiles |
| `--border`         | `#1F2A44`                          | Card and input borders |
| `--border-strong`  | `#2A3A60`                          | Hovered/focused borders |
| `--accent`         | `#00A1E0`                          | Salesforce blue — primary CTA, active nav |
| `--accent-hover`   | `#0088BD`                          | Hover for primary CTAs |
| `--glow`           | `#1FE0FF`                          | Cyan glow accent — focus rings, highlights |
| `--glow-soft`      | `rgba(31, 224, 255, 0.18)`         | Box-shadow on selected/focused |
| `--text`           | `#F4F7FB`                          | Primary text |
| `--text-muted`     | `#97A3B6`                          | Subtitles, descriptions |
| `--text-subtle`    | `#5C6A85`                          | Metadata, placeholders |
| `--success`        | `#22C55E`                          | Pass / completed |
| `--warning`        | `#F5B83D`                          | Yellow finding |
| `--danger`         | `#EF4444`                          | Red finding / destructive |

---

## Typography

- **Display / headings:** Avant Garde for Salesforce (loaded as `--font-avant-garde` from `app/fonts`)
- **Body / UI:** system stack (`ui-sans-serif, system-ui, sans-serif`) — paired well with Avant Garde
- **Mono:** `ui-monospace, "SFMono-Regular", Menlo` for code blocks

| Element            | Size                | Weight   | Notes |
|--------------------|---------------------|----------|-------|
| Page title         | `text-2xl md:text-3xl` | 600 | Tracking-tight |
| Section header     | `text-xs`              | 600 | Uppercase, `tracking-[0.2em]`, muted |
| Card label         | `text-base`            | 600 | |
| Body               | `text-sm`              | 400 | Color: text-muted by default |
| Metric (KPI)       | `text-3xl md:text-4xl` | 600 | Tracking-tight, white |
| Inline code        | `text-xs`              | 500 | Mono, muted bg |

---

## Layout

- **Shell:** 240px fixed sidebar on the left, content scrolls in a max-width container.
- **Page padding:** `px-8 py-10` desktop, `px-4 py-6` mobile.
- **Max content width:** `max-w-6xl` for dashboards, `max-w-3xl` for missions, `max-w-2xl` for forms.
- **Grid spacing:** 16px base. Card gap `gap-4` (16px), section gap `gap-10` (40px).

---

## Components

### Sidebar (`components/shell/Sidebar.tsx`)
- Width 240px, full-height, surface bg, 1px right border `--border`
- Logo lockup at top: "Adoptify" wordmark + Salesforce logo (small, opacity 60%)
- Five nav items: Missions, Agent, Progress, Analytics, Settings
- Inactive: `text-text-muted`, no border
- Active: cyan 2px left-border, `text-text` white, subtle `bg-surface-2`
- Hover (inactive): `bg-surface-2`, `text-text`

### Cards
- `bg-surface border border-border rounded-xl p-5`
- Hover: `border-border-strong bg-surface-2 transition`
- Selected/active: `border-accent shadow-[0_0_0_1px_var(--accent),0_0_24px_var(--glow-soft)]`

### Buttons
- **Primary:** `bg-accent text-white rounded-md px-4 h-10 text-sm font-semibold tracking-wide`
  - Hover: `bg-accent-hover`
  - Disabled: `opacity-40 cursor-not-allowed`
- **Secondary:** `bg-surface-2 border border-border text-text px-4 h-10 rounded-md`
  - Hover: `border-border-strong bg-surface-3`
- **Ghost:** `text-text-muted hover:text-text` no bg

### Inputs
- `bg-surface-2 border border-border rounded-md text-text px-3 h-10`
- Focus: `border-accent ring-2 ring-glow-soft`
- Placeholder: `text-text-subtle`

### Badge / status pill
- `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium`
- Variants: success (green dot), warning (yellow dot), danger (red dot), neutral

### KPI tile (Analytics)
- Card with: micro-label (uppercase, tracking-wide, muted), big metric, delta chip (+/- with arrow), 24h sparkline at the bottom
- Width: 1/4 of grid on desktop, 2/4 tablet, 1/1 mobile

### Chat bubble
- Assistant: surface card, full width, label "Agent" with cyan dot
- User: aligned right, accent-tinted surface, max-w-prose
- Tool-call card: collapsed by default, shows tool name + summary; expand reveals args/result JSON

---

## Motion

- Page transitions: opacity + 8px slide, 0.3s ease-out
- Step transitions in missions: AnimatePresence, 0.4s cubic `[0.32, 0.72, 0, 1]`, ±32px y-translate
- Hover scale on cards: `transition-all duration-150` — no scale, only border + bg shift (calmer)
- Pulse on streaming-agent indicator: opacity `[0.4, 1, 0.4]` 1.4s loop

---

## Iconography

- Lucide icons, 16/18/20px, stroke 1.5
- Active nav icon: `text-accent`
- Status icons inline with badges

---

## Empty states

- Use a small lockup centered: 32px lucide icon (muted) + heading + description + CTA
- Never show "no data" without telling the user what to do next
