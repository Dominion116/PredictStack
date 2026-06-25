'use client';

import { useTheme as useNextTheme } from 'next-themes';

/**
 * Thin wrapper around next-themes useTheme.
 * Provides a typed toggle and resolved theme value.
 */
export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();

  function toggle() {
    const current = resolvedTheme ?? theme;
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  return {
    theme,
    resolvedTheme,
    systemTheme,
    setTheme,
    toggle,
    isDark: resolvedTheme === 'dark',
  };
}
