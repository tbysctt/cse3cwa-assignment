"use client";

import {
  setDensity,
  setTextSize,
  setTheme,
} from "@/app/actions/preferences";
import {
  DENSITIES,
  TEXT_SIZES,
  type Density,
  type TextSize,
  type Theme,
} from "@/lib/preferences";
import { useTransition } from "react";

function OptionButton({
  label,
  selected,
  onSelect,
  disabled,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={[
        "ui-button capitalize",
        selected ? "ui-button-primary" : "ui-button-secondary",
      ].join(" ")}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
    >
      {label}
    </button>
  );
}

export function PreferenceControls({
  theme,
  textSize,
  density,
}: {
  theme: Theme;
  textSize: TextSize;
  density: Density;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-8">
      {/* Colour Theme */}
      <fieldset disabled={pending} className="space-y-3">
        <legend className="text-base font-semibold text-foreground">
          Colour theme
        </legend>
        <p className="text-sm text-absent">
          Stored in a cookie and applied across the whole site. &ldquo;System&rdquo;
          follows your operating system preference.
        </p>
        <div className="flex flex-wrap gap-3">
          {(["light", "dark", "system"] as const).map((value) => (
            <OptionButton
              key={value}
              label={value}
              selected={theme === value}
              onSelect={() => {
                startTransition(() => {
                  void setTheme(value);
                });
              }}
            />
          ))}
        </div>
      </fieldset>

      {/* Text Size / Accessibility */}
      <fieldset disabled={pending} className="space-y-3 border-t border-border pt-6">
        <legend className="text-base font-semibold text-foreground">
          Text size &amp; readability
        </legend>
        <p className="text-sm text-absent">
          Persistent font scaling stored in a cookie. Scales all typography,
          phoneme tiles, and interactive elements proportionally.
        </p>
        <div className="flex flex-wrap gap-3">
          {TEXT_SIZES.map(({ value, label }) => (
            <OptionButton
              key={value}
              label={label}
              selected={textSize === value}
              onSelect={() => {
                startTransition(() => {
                  void setTextSize(value);
                });
              }}
            />
          ))}
        </div>
        <p className="text-xs text-absent">
          {TEXT_SIZES.find((item) => item.value === textSize)?.description}
        </p>
      </fieldset>

      {/* Interface Density */}
      <fieldset disabled={pending} className="space-y-3 border-t border-border pt-6">
        <legend className="text-base font-semibold text-foreground">
          Layout density
        </legend>
        <p className="text-sm text-absent">
          Stored in a cookie. Adjusts surface padding, section margins, and control heights.
        </p>
        <div className="flex flex-wrap gap-3">
          {DENSITIES.map(({ value, label }) => (
            <OptionButton
              key={value}
              label={label}
              selected={density === value}
              onSelect={() => {
                startTransition(() => {
                  void setDensity(value);
                });
              }}
            />
          ))}
        </div>
        <p className="text-xs text-absent">
          {DENSITIES.find((item) => item.value === density)?.description}
        </p>
      </fieldset>
    </div>
  );
}

export { PreferenceControls as ThemeControls };
