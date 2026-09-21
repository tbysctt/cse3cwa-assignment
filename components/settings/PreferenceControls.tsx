"use client";

import { setDensity, setTextSize, setTheme } from "@/app/actions/preferences";
import {
  DENSITIES,
  TEXT_SIZES,
  THEMES,
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
        "ui-button",
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

function PreferenceSection({
  title,
  description,
  options,
  selected,
  pending,
  onSelect,
}: {
  title: string;
  description: string;
  options: { value: string; label: string; description: string }[];
  selected: string;
  pending: boolean;
  onSelect: (value: string) => void;
}) {
  const selectedOption = options.find((option) => option.value === selected);

  return (
    <fieldset disabled={pending} className="space-y-3">
      <legend className="text-base font-semibold text-foreground">
        {title}
      </legend>
      <p className="text-sm text-absent">{description}</p>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <OptionButton
            key={option.value}
            label={option.label}
            selected={selected === option.value}
            disabled={pending}
            onSelect={() => onSelect(option.value)}
          />
        ))}
      </div>
      <p className="text-xs text-absent">{selectedOption?.description ?? ""}</p>
    </fieldset>
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
    <div className="flex flex-col gap-12">
      <PreferenceSection
        title="Colour theme"
        description="Stored in a cookie and applied across the whole site."
        options={THEMES}
        selected={theme}
        pending={pending}
        onSelect={(value) => {
          startTransition(() => {
            void setTheme(value as Theme);
          });
        }}
      />
      <PreferenceSection
        title="Text size & readability"
        description="Persistent font scaling stored in a cookie. Scales all typography, phoneme tiles, and interactive elements proportionally."
        options={TEXT_SIZES}
        selected={textSize}
        pending={pending}
        onSelect={(value) => {
          startTransition(() => {
            void setTextSize(value as TextSize);
          });
        }}
      />
      <PreferenceSection
        title="Layout density"
        description="Stored in a cookie. Adjusts surface padding, section margins, and control heights."
        options={DENSITIES}
        selected={density}
        pending={pending}
        onSelect={(value) => {
          startTransition(() => {
            void setDensity(value as Density);
          });
        }}
      />
    </div>
  );
}

export { PreferenceControls as ThemeControls };
