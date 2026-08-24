import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarCollapsed: boolean;
  activeRoute: string;
  isDarkMode: boolean;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  activeRoute: "/dashboard",
  isDarkMode: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setActiveRoute: (state, action: PayloadAction<string>) => {
      state.activeRoute = action.payload;
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setActiveRoute, toggleDarkMode, setDarkMode } = uiSlice.actions;
export default uiSlice.reducer;
