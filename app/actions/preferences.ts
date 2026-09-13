"use server";

import {
  COOKIE_MAX_AGE,
  DENSITY_COOKIE,
  TEXT_SIZE_COOKIE,
  THEME_COOKIE,
  type Density,
  type TextSize,
  type Theme,
} from "@/lib/preferences";
import { cookies } from "next/headers";

export async function setTheme(theme: Theme) {
  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

export async function setTextSize(textSize: TextSize) {
  const store = await cookies();
  store.set(TEXT_SIZE_COOKIE, textSize, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

export async function setDensity(density: Density) {
  const store = await cookies();
  store.set(DENSITY_COOKIE, density, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}
