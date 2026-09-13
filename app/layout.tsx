import { SiteShell } from "@/components/layout/SiteShell";
import { ThemeApplier } from "@/components/theme/ThemeApplier";
import { student } from "@/lib/student";
import {
  DENSITY_COOKIE,
  TEXT_SIZE_COOKIE,
  THEME_COOKIE,
  parseDensity,
  parseTextSize,
  parseTheme,
} from "@/lib/preferences";
import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "latin-ext"],
});

const notoMono = Noto_Sans_Mono({
  variable: "--font-noto-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: student.assessmentTitle,
    template: `%s · ${student.assessmentTitle}`,
  },
  description:
    "Frontend builder for phoneme-based Wordle and Word Search classroom activities for Speech Pathology teaching.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);
  const textSize = parseTextSize(cookieStore.get(TEXT_SIZE_COOKIE)?.value);
  const density = parseDensity(cookieStore.get(DENSITY_COOKIE)?.value);
  const isExplicitDark = theme === "dark";

  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${notoMono.variable} h-full antialiased ${isExplicitDark ? "dark" : ""}`}
      data-theme={theme}
      data-text-size={textSize}
      data-density={density}
    >
      <body
        className="flex min-h-dvh flex-col font-sans"
        data-theme={theme}
        data-text-size={textSize}
        data-density={density}
      >
        <ThemeApplier theme={theme} />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
