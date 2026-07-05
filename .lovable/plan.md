## Plan: Replace public sidebar with floating pill nav + mobile bottom tabs

Convert the public app shell from a fixed left sidebar to a **floating pill nav** on desktop and a **bottom tab bar** on mobile. Workspace routes keep their existing sidebar (unchanged).

### Files

**Edit `src/components/AppLayout.tsx`** — replace sidebar shell with:
- Desktop: centered floating pill `<nav>` fixed at `top-4`, rounded-full, `bg-card/80 backdrop-blur border shadow-lg`, containing logo + nav links + a primary CTA ("Book a call" → scrolls to early-access or links to `/generate`). Main content gets `pt-24` and standard container padding — no more `pl-60`.
- Mobile: no top header. Fixed bottom tab bar with 4 icons (Home, Scan, Generate, Workspace), `bg-card/95 backdrop-blur border-t`, safe-area padding, active state with primary color + small label. Main content gets `pb-20`.
- Remove the `Sheet` / hamburger drawer entirely.

**Delete `src/components/AppSidebar.tsx`** — no longer used (workspace has its own `WorkspaceSidebar`).

**Create `src/components/PillNav.tsx`** — desktop floating pill component (logo dot + links + CTA), uses `NavLink` for active state.

**Create `src/components/BottomTabBar.tsx`** — mobile bottom tabs, 4 items, active pill highlight.

### Design tokens (reuse existing)
- `bg-card`, `border`, `text-sidebar-primary` for brand, `bg-accent`/`text-accent-foreground` for active states. No new colors, no purple.

### Out of scope
- Workspace layout untouched (its sidebar is appropriate for 10+ grouped items).
- Landing page content untouched.
- No backend changes.

### Verification
- Playwright screenshots at 1280px and 390px widths confirming nav doesn't overlap hero content and all links reachable.
