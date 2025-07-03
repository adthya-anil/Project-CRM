import { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ColorModeContext, useMode } from "../theme.js";
import useSession from "./hooks/useSession.js";
import useUserRole from "./hooks/roles.js";

import TopBar from "./global/topbar.jsx";
import SideBar from "./global/sidebar.jsx";

import SignIn from "./scenes/auth/SignIn.jsx";
import PasswordResetRequest from "./scenes/auth/PasswordResetRequest.jsx";
import PasswordReset from "./scenes/auth/PasswordReset.jsx";

import Dashboard from "./scenes/dashboard";
import Team from "./scenes/team";
import Leads from "./scenes/leads";
import Form from "./scenes/form";
import Calendar from "./scenes/calendar";
import Pie from "./scenes/pie";
import Bar from "./scenes/bar";
import Line from "./scenes/line";
import Reports from "./scenes/reports";
import FAQ from "./scenes/faq";
import AccountantSection from "./scenes/manage";
import LoadingComponent from "./loading/LoadingComponent.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  const [theme, colorMode] = useMode();
  const [forceReset, setForceReset] = useState(false);
  const [previousUserId, setPreviousUserId] = useState(null);
  const [isUserSwitching, setIsUserSwitching] = useState(false);

  const session = useSession();
  const userId = session?.user?.id;
  const role = useUserRole(userId);

  const location = useLocation();
  const isResetPasswordRoute = location.pathname === "/reset-password";

  // Track user changes and force loading state during user switch
  useEffect(() => {
    if (userId !== previousUserId) {
      if (previousUserId !== null && userId !== null) {
        // User switched - force loading state for 2 seconds
        setIsUserSwitching(true);
        setTimeout(() => setIsUserSwitching(false), 2000);
      }
      setPreviousUserId(userId);
    }
  }, [userId, previousUserId]);

  const isAdmin = role === "admin";
  const isAccountant = role === "accountant";

  useEffect(() => {
    if (window.location.hash.includes("access_token") && !isResetPasswordRoute) {
      setForceReset(true);
      window.location.replace("/reset-password" + window.location.hash);
    }
  }, [isResetPasswordRoute]);

  const renderAuthRoutes = () => (
    <Routes>
      <Route path="/forgot-password" element={<PasswordResetRequest />} />
      <Route path="/reset-password" element={<PasswordReset />} />
      <Route path="*" element={<SignIn isAccountant={isAccountant} />} />
    </Routes>
  );

  const renderResetOnlyRoutes = () => (
    <Routes>
      <Route path="/reset-password" element={<PasswordReset />} />
    </Routes>
  );

  const renderAppRoutes = () => (
    <div className="app">
      <SideBar isAdmin={isAdmin} userId={userId} isAccountant={isAccountant} />
      <main className="content">
        <TopBar isAdmin={isAdmin} />
        <Routes>
          <Route path="/" element={isAccountant ? <Navigate to="/manage" replace /> : <Dashboard isAdmin={isAdmin} />} />
          <Route path="/manage" element={isAccountant ? <AccountantSection /> : <Navigate to="/" replace />} />
          <Route path="/leads" element={<Leads isAdmin={isAdmin} />} />
          <Route path="/team" element={<Team isAdmin={isAdmin} />} />
          <Route path="/form" element={<Form />} />
          <Route path="/calendar" element={<Calendar isAdmin={isAdmin} />} />
          <Route path="/pie" element={<Pie isAdmin={isAdmin} />} />
          <Route path="/line" element={<Line isAdmin={isAdmin} />} />
          <Route path="/bar" element={<Bar isAdmin={isAdmin} />} />
          <Route path="/reports" element={<Reports isAdmin={isAdmin} />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </main>
    </div>
  );

  // Show loading if session is loading
  if (session === undefined) {
    return <LoadingComponent />;
  }

  // Show loading if user is switching
  if (isUserSwitching) {
    return <LoadingComponent />;
  }

  // Show loading if user is logged in but role is still loading
  if (session && userId && role === undefined) {
    return <LoadingComponent />;
  }

  // Show loading if we have a session but no userId
  if (session && !userId) {
    return <LoadingComponent />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {!session && !isResetPasswordRoute
            ? renderAuthRoutes()
            : isResetPasswordRoute
            ? renderResetOnlyRoutes()
            : renderAppRoutes()}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </QueryClientProvider>
  );
}

export default App;