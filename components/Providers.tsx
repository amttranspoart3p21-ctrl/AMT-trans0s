"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store } from "@/store/store";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDarkMode } from "@/store/slices/uiSlice";

/**
 * ThemeSynchronizer handles safe client-side synchronization:
 * - Defaults to "light" theme if no localStorage value exists
 * - Persists theme to localStorage under the single key "theme" ("light" | "dark")
 * - Synchronizes the .dark class on document.documentElement with Redux isDarkMode state
 */
function ThemeSynchronizer() {
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.ui.isDarkMode);

  // Initialize theme from localStorage on initial client mount (Default: "light")
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        dispatch(setDarkMode(true));
        document.documentElement.classList.add("dark");
      } else {
        dispatch(setDarkMode(false));
        document.documentElement.classList.remove("dark");
        if (!savedTheme) {
          localStorage.setItem("theme", "light");
        }
      }
    } catch {
      // Ignore localStorage restrictions
    }
  }, [dispatch]);

  // Synchronize document.documentElement class and localStorage when theme state changes
  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    } catch {
      // Ignore localStorage restrictions
    }
  }, [isDarkMode]);

  return null;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <ThemeSynchronizer />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-xl px-4 py-2.5 shadow-lg",
          duration: 4000,
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#f43f5e",
              secondary: "#ffffff",
            },
          },
        }}
      />
    </Provider>
  );
}
