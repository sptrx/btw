"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "btw-nav-collapsed";

type Ctx = { collapsed: boolean; toggle: () => void };

const NavCollapseContext = createContext<Ctx>({ collapsed: true, toggle: () => {} });

/** Desktop sidebar: collapsed to icons by default, remembers an explicit expand (per browser). */
export function NavCollapseProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    try {
      // Collapsed by default; only an explicit "expanded" choice overrides it.
      if (window.localStorage.getItem(STORAGE_KEY) === "0") setCollapsed(false);
    } catch {
      /* storage unavailable: stay collapsed */
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ collapsed, toggle }), [collapsed, toggle]);
  return <NavCollapseContext.Provider value={value}>{children}</NavCollapseContext.Provider>;
}

export function useNavCollapse() {
  return useContext(NavCollapseContext);
}
