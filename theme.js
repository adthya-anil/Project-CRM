import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// Color tokens based on your requirements
export const tokens = (mode) => ({
  primary: mode === "dark"
    ? { 500: "#344E67" }  // sidebar background
    : { 500: "#92C4DA" }, // sidebar background
  secondary: mode === "dark"
    ? { 500: "#1b1b1b" }  // icon color
    : { 500: "#1b1b1b" }, // icon color
  background: mode === "dark"
    ? { 500: "#f2f2eb" }  // app background
    : { 500: "#f2f2eb" }, // app background
  text: mode === "dark"
    ? { 500: "#1b1b1b" }  // primary text color
    : { 500: "#1b1b1b" }, // primary text color
  greenAccent: mode === "dark"
    ? { 500: "#4caf50" }
    : { 500: "#81c784" },
  redAccent: mode === "dark"
    ? { 500: "#f44336" }
    : { 500: "#e57373" },
  grey: mode === "dark"
    ? { 500: "#A0A0A0" } // lighter grey for dark mode
    : { 500: "#606060" }, // darker grey for light mode
});

// MUI theme settings
export const themeSettings = (mode) => {
  const colors = tokens(mode);
  return {
    palette: {
      mode,
      primary: {
        main: colors.primary[500],
      },
      secondary: {
        main: colors.secondary[500],
      },
      background: {
        default: colors.background[500],
      },
      text: {
        primary: colors.text[500],
        secondary: colors.grey[500], // use grey for secondary text
      },
      greenAccent: {
        main: colors.greenAccent[500],
      },
      redAccent: {
        main: colors.redAccent[500],
      },
    },
    typography: {
      fontFamily: ["Roboto", "sans-serif"].join(","),
      fontSize: 12,
      h1: { fontSize: 40 },
      h2: { fontSize: 32 },
      h3: { fontSize: 24 },
      h4: { fontSize: 20 },
      h5: { fontSize: 16 },
      h6: { fontSize: 14 },
    },
  };
};

// Context
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

// Hook to manage and toggle the mode
export const useMode = () => {
  const [mode, setMode] = useState("light");

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    []
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return [theme, colorMode];
};
