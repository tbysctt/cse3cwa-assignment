import { PreferenceControls } from "@/components/settings/PreferenceControls";
import {
  DENSITY_COOKIE,
  TEXT_SIZE_COOKIE,
  THEME_COOKIE,
  parseDensity,
  parseTextSize,
  parseTheme,
} from "@/lib/preferences";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);
  const textSize = parseTextSize(cookieStore.get(TEXT_SIZE_COOKIE)?.value);
  const density = parseDensity(cookieStore.get(DENSITY_COOKIE)?.value);

  return (
    <div className="mx-auto flex flex-col gap-(--section-gap)">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-absent">
          Manage your persistent interface preferences. Choices are saved in cookies and applied across sessions.
        </p>
      </header>
      <section className="ui-surface ui-surface-pad">
        <PreferenceControls
          theme={theme}
          textSize={textSize}
          density={density}
        />
      </section>
    </div>
  );
}
