import { describe, expect, it, vi } from "vitest";
import {
  setDensity,
  setTextSize,
  setTheme,
} from "@/app/actions/preferences";
import {
  COOKIE_MAX_AGE,
  DENSITY_COOKIE,
  TEXT_SIZE_COOKIE,
  THEME_COOKIE,
  parseDensity,
  parseTextSize,
  parseTheme,
} from "@/lib/preferences";

// Mock next/headers
const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockImplementation(async () => ({
    set: mockCookieSet,
  })),
}));

describe("Persistent preferences parser", () => {
  it("parses valid and invalid themes", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBe("system");
    expect(parseTheme("invalid")).toBe("system");
    expect(parseTheme(undefined)).toBe("system");
  });

  it("parses valid and invalid text sizes", () => {
    expect(parseTextSize("normal")).toBe("normal");
    expect(parseTextSize("large")).toBe("large");
    expect(parseTextSize("extra-large")).toBe("extra-large");
    expect(parseTextSize("huge")).toBe("normal");
    expect(parseTextSize(undefined)).toBe("normal");
  });

  it("parses valid and invalid densities", () => {
    expect(parseDensity("comfortable")).toBe("comfortable");
    expect(parseDensity("compact")).toBe("compact");
    expect(parseDensity("tight")).toBe("comfortable");
    expect(parseDensity(undefined)).toBe("comfortable");
  });
});

describe("Preference server actions", () => {
  it("sets theme cookie with long maxAge and lax sameSite", async () => {
    mockCookieSet.mockClear();
    await setTheme("dark");
    expect(mockCookieSet).toHaveBeenCalledWith(THEME_COOKIE, "dark", {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  });

  it("sets text size cookie with long maxAge and lax sameSite", async () => {
    mockCookieSet.mockClear();
    await setTextSize("large");
    expect(mockCookieSet).toHaveBeenCalledWith(TEXT_SIZE_COOKIE, "large", {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  });

  it("sets density cookie with long maxAge and lax sameSite", async () => {
    mockCookieSet.mockClear();
    await setDensity("compact");
    expect(mockCookieSet).toHaveBeenCalledWith(DENSITY_COOKIE, "compact", {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  });
});
