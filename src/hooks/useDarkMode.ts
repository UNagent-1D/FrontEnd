import { useCallback, useEffect, useState } from "react"

type Theme = "light" | "dark"
const STORAGE_KEY = "ui-theme"

function readInitial(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  return prefersDark ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === "dark") root.classList.add("dark")
  else root.classList.remove("dark")
}

export function useDarkMode() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const t = readInitial()
    if (typeof window !== "undefined") applyTheme(t)
    return t
  })

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((t: Theme) => setThemeState(t), [])
  const toggle = useCallback(
    () => setThemeState((prev) => (prev === "dark" ? "light" : "dark")),
    []
  )

  return { theme, setTheme, toggle }
}
