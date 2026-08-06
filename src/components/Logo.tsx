import { cn } from "@/lib/utils";

// Brand mark: an almost-closed ring with a small gap (rounded caps) and a
// bead sitting at the top, echoing the "ring you attach labels to" idea in
// the name. Fixed brand blue — the mark itself doesn't need to adapt
// between light/dark, only the wordmark next to it does.
export const LogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
    <path
      d="M 40.17 13.30 A 38 38 0 1 1 28.20 18.87"
      fill="none"
      stroke="#2323D9"
      strokeWidth="11"
      strokeLinecap="round"
    />
    <circle cx="50" cy="14" r="9" fill="#2323D9" />
  </svg>
);

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showWordmark?: boolean;
}

// Full lockup: mark + "labelring" wordmark. textClassName defaults to
// text-foreground, which already flips between the light and dark palettes
// defined in index.css, so the wordmark stays legible in either theme.
const Logo = ({ className, iconClassName, textClassName, showWordmark = true }: LogoProps) => (
  <span className={cn("inline-flex items-center gap-2", className)}>
    <LogoMark className={cn("h-5 w-5 shrink-0", iconClassName)} />
    {showWordmark && (
      <span className={cn("font-bold tracking-tight lowercase text-foreground", textClassName)}>
        labelring
      </span>
    )}
  </span>
);

export default Logo;
