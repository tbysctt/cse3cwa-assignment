export const primaryNavLinks = [
  { href: "/", label: "Home" },
  { href: "/wordle", label: "Wordle" },
  { href: "/word-search", label: "Word Search" },
  { href: "/word-bank", label: "Word bank" },
] as const;

export const secondaryNavLinks = [
  { href: "/about", label: "About" },
  { href: "/settings", label: "Settings" },
] as const;

export const allNavLinks = [...primaryNavLinks, ...secondaryNavLinks] as const;

export function isActiveLink(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function linkClass(active: boolean): string {
  return [
    "rounded-[var(--control-radius)] px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-accent text-accent-contrast"
      : "text-foreground hover:bg-surface-muted",
  ].join(" ");
}
