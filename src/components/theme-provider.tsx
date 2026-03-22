"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

type Theme = "light" | "dark"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const pathname = usePathname()
  const [theme, setTheme] = React.useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme;
    }
    const storedTheme = localStorage.getItem(storageKey);
    if (storedTheme === "dark" || storedTheme === "contrast-dark" || storedTheme === "night") {
      return "dark";
    }
    return "light";
  })
  const isDashboardRoute = pathname?.startsWith("/dashboard") ?? false
  const effectiveTheme: Theme = isDashboardRoute ? theme : "light"

  React.useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark", "night", "contrast-light", "contrast-dark")
    root.classList.add(effectiveTheme)
  }, [effectiveTheme])

  const value = {
    theme: effectiveTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
