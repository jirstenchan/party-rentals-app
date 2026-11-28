/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { Platform } from "react-native";

/** Fixed brand colors for artwork and filled controls. */
export const BrandColors = {
  purple: "#6B2CF5",
  border: "#D4D4D4",
  muted: "#B3B3B3",
  error: "#B42318",
  pressed: "#6B2CF5",
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const Colors = {
  light: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    text: "#000000",
    textSecondary: "#60646C",
    border: "#D4D4D4",
    controlBorder: "#857F8C",
    accent: BrandColors.purple,
    accentSurface: "#F1EDFC",
    accentSurfacePressed: "#E2D5FA",
    danger: "#B42318",
    dangerSurface: "#FDEFF0",
    warning: "#854D0E",
    warningSurface: "#FDF0DA",
    success: "#166534",
    successSurface: "#DCFCE7",
  },
  dark: {
    background: "#15121B",
    surface: "#211B2B",
    backgroundElement: "#2C2437",
    backgroundSelected: "#3A3048",
    text: "#F8F6FC",
    textSecondary: "#C5BDCF",
    border: "#493D56",
    controlBorder: "#8C8099",
    accent: "#BF9FFF",
    accentSurface: "#382651",
    accentSurfacePressed: "#493266",
    danger: "#FFADB0",
    dangerSurface: "#472229",
    warning: "#FFD08A",
    warningSurface: "#3D2B17",
    success: "#A0E8B4",
    successSurface: "#183B2A",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;
export type AppColors = Record<ThemeColor, string>;

// FontSizes (insert)
/* 
  // Home UI
  headerTitle = fontSize: 22,
  sectionTitle = fontSize: 20,
  cardTtitle = fontSize: 16,
  searchInput = fontSize: 14,
  filterText = fontSize: 12,
  empty = fontSize: 12,
  viewButton = fontSzie: 11,
  infoText = fontSize: 10,

  // Event Details UI
  headerTitle = fontSize: 22,
  titleText = fontSize: 20,
  aboutTitle = fontSize: 18,
  ctaText = fontSize: 18,
  host = fontSize: 14,
  detailLine = fontSize: 14,
  aboutBody = fontSize: 14,
  pesoBadgeText = fontSize: 14,
  notFound = fontSize: 12,

  // Create Event UI (create.tsx)

  // Create Event UI (create-event-form.tsx)

  // Create Event UI (image-picker-field.tsx)

  // Create Event UI (form-input.tsx)

  // Create Modal UI (create-event-confirmation-modal.tsx)
  
  // Account (Profile) UI

  // Account (Profile - Settings) UI (not done)

  // Account (Profile - Settings Modal) UI (not done)

*/
export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
  full: 999,
} as const;

// ButtonSizes (insert)

// Color Palette for Dark Mode (insert)

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
