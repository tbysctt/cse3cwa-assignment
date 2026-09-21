export const THEME_COOKIE = "theme";

export type Theme = "light" | "dark" | "system";

export const THEMES: {
  value: Theme;
  label: string;
  description: string;
}[] = [
  {
    value: "light",
    label: "Light",
    description: "Always use the light colour theme.",
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use the dark colour theme.",
  },
  {
    value: "system",
    label: "System",
    description: "Follow your operating system light/dark preference.",
  },
];

const VALID_THEMES: Theme[] = THEMES.map((theme) => theme.value);

export function parseTheme(value: string | undefined): Theme {
  return VALID_THEMES.includes(value as Theme) ? (value as Theme) : "system";
}

export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
