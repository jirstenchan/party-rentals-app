import { createContext, useContext } from "react";

export const TabBarVisibilityContext = createContext<(hidden: boolean) => void>(
  () => {},
);

export function useSetTabBarHidden() {
  return useContext(TabBarVisibilityContext);
}
