import { Colors, type AppColors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useThemeScheme() {
  return useColorScheme() === "dark" ? "dark" : "light";
}

export function useTheme() {
  return Colors[useThemeScheme()];
}

export function createThemeStyles<T>(createStyles: (theme: AppColors) => T) {
  const variants = {
    light: {
      scheme: "light",
      theme: Colors.light,
      styles: createStyles(Colors.light),
    },
    dark: {
      scheme: "dark",
      theme: Colors.dark,
      styles: createStyles(Colors.dark),
    },
  } as const;

  return function useStyles() {
    return variants[useThemeScheme()];
  };
}
