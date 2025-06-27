import { ColorModeContext, useMode } from "../theme.js";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Routes, Route } from "react-router-dom";
import TopBar from "./global/topbar.jsx";
import SideBar from "./global/sidebar.jsx";
import Dashboard from "./scenes/dashboard";
import Team from "./scenes/team/index.jsx";
import Leads from "./scenes/leads/index.jsx";
import Form from "./scenes/form";
import SignIn from "./scenes/auth/SignIn.jsx";
import PasswordReset from "./scenes/auth/PasswordReset.jsx";
import PasswordResetConfirm from "./scenes/auth/PasswordResetConfirm.jsx";
import useSession from "./hooks/useSession.js";
import Calendar from "./scenes/calendar";
import Pie from "./scenes/pie";
import Bar from "./scenes/bar";
import Line from "./scenes/line";
import Reports from "./scenes/reports/index.jsx";
//import PerformanceChart from "./components/Barstack.jsx";
import FAQ from "./scenes/faq";
import useUserRole from "./hooks/roles.js";
//import LeadInteractions from "./components/LeadInteraction.jsx";
//
//  
//
//  
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
  const session = useSession();
  const userId = session?.user?.id;
  const role = useUserRole(userId);
  const isAdmin = role === "admin";
  const [theme, colorMode] = useMode();

  return (
    <QueryClientProvider client={queryClient}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {!session ? (
            <Routes>
              <Route path="/reset-password" element={<PasswordReset />} />
              <Route path="/reset-password-confirm" element={<PasswordResetConfirm />} />
              <Route path="*" element={<SignIn />} />
            </Routes>
          ) : (
            <div className='app'>
              <SideBar isAdmin={isAdmin} userId={userId} />
              <main className='content'>
                <TopBar isAdmin={isAdmin} />
                <Routes>
                  <Route path="/" element={<Dashboard isAdmin={isAdmin} />} />
                  <Route path="/leads" element={<Leads isAdmin={isAdmin} />} />
                  <Route path="/team" element={<Team isAdmin={isAdmin} />} />
                  <Route path="/form" element={<Form />} />
                  <Route path="/calendar" element={<Calendar isAdmin={isAdmin} />} />
                  <Route path="/pie" element={<Pie isAdmin={isAdmin} />} />
                  <Route path="/line" element={<Line isAdmin={isAdmin} />} />
                  <Route path="/bar" element={<Bar isAdmin={isAdmin} />} />
                  <Route path="/reports" element={<Reports isAdmin={isAdmin} />} />
                  <Route path="/faq" element={<FAQ />} />
                  {/* } />                                                                                          
                  <Route path="/geography" element = {<Geography />} /> */}
                  {/*                
                  <Route path="/" element = {<Contacts />} />                                                                                                                         
                  */}
                </Routes>
              </main>
            </div>
          )}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </QueryClientProvider>
  );
}

export default App;