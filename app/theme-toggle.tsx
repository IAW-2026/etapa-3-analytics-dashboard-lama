"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem("lama-theme");

  return savedTheme === "dark" ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initialTheme = getInitialTheme();

    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";

    setTheme(nextTheme);
    window.localStorage.setItem("lama-theme", nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }

  return (
    <button
      aria-label={`Cambiar a modo ${theme === "light" ? "oscuro" : "claro"}`}
      aria-pressed={theme === "dark"}
      className="theme-toggle"
      onClick={toggleTheme}
      type="button"
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb" />
      </span>
    </button>
  );
}
