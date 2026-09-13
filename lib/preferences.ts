export * from "./theme";

export const TEXT_SIZE_COOKIE = "text_size";
export const DENSITY_COOKIE = "density";

export type TextSize = "normal" | "large" | "extra-large";
export type Density = "comfortable" | "compact";

export const TEXT_SIZES: { value: TextSize; label: string; description: string }[] = [
  {
    value: "normal",
    label: "Normal",
    description: "Standard readable font scale (100% root sizing).",
  },
  {
    value: "large",
    label: "Large",
    description: "Increased font scale (112.5% root sizing) for enhanced readability.",
  },
  {
    value: "extra-large",
    label: "Extra large",
    description: "Maximum readability font scale (125% root sizing).",
  },
];

export const DENSITIES: { value: Density; label: string; description: string }[] = [
  {
    value: "comfortable",
    label: "Comfortable",
    description: "Spacious layout with generous touch targets and padding.",
  },
  {
    value: "compact",
    label: "Compact",
    description: "Denser layout showing more content simultaneously on screen.",
  },
];

const VALID_TEXT_SIZES: TextSize[] = ["normal", "large", "extra-large"];
const VALID_DENSITIES: Density[] = ["comfortable", "compact"];

export function parseTextSize(value: string | undefined): TextSize {
  return VALID_TEXT_SIZES.includes(value as TextSize)
    ? (value as TextSize)
    : "normal";
}

export function parseDensity(value: string | undefined): Density {
  return VALID_DENSITIES.includes(value as Density)
    ? (value as Density)
    : "comfortable";
}

export type Preferences = {
  theme: import("./theme").Theme;
  textSize: TextSize;
  density: Density;
};
