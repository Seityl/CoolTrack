import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FrappeProvider, useFrappeAuth } from "frappe-react-sdk";
import ProtectedRoute from "./utils/auth/ProtectedRoute";
import "@radix-ui/themes/styles.css";
import { Theme, Spinner, Flex } from "@radix-ui/themes";
import Workspace from "./components/layout/Workspace";
import { Suspense, ReactNode, JSX, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import UpdatePassword from "./pages/auth/UpdatePassword";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/user/ProfilePage";
import NotificationsPage from "./pages/user/NotificationsPage";
import GatewayPage from "./pages/gateway/GatewayPage";
import SensorList from "./pages/sensor/SensorList";
import SensorPage from "./pages/sensor/SensorPage";
import SettingsPage from "./pages/SettingsPage";
import HistoryPage from "./pages/HistoryPage";
import LogList from "./pages/LogList";
import AlertList from "./pages/alerts/AlertList";
import AlertPage from "./pages/alerts/AlertPage";
import MaintenanceList from "./pages/maintenance/MaintenaceList";
import MaintenancePage from "./pages/maintenance/MaintenancePage";

interface RedirectIfLoggedInProps {
  children: JSX.Element;
}

const RedirectIfLoggedIn = ({ children }: RedirectIfLoggedInProps) => {
  const { currentUser } = useFrappeAuth();
  return currentUser ? <Navigate to="/" replace /> : children;
};

interface PageWrapperProps {
  children: ReactNode;
}

const PageWrapper = ({ children }: PageWrapperProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);

const PageLoader = () => (
  <Flex 
    height="100vh" 
    align="center" 
    justify="center"
    style={{
      background: "var(--color-panel-solid)",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999
    }}
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Spinner size="3" />
    </motion.div>
  </Flex>
);

// App initialization component to handle loading states
const AppInitializer = ({ children }: { children: ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Small delay to ensure proper initialization
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!isInitialized) {
    return <PageLoader />;
  }

  return <>{children}</>;
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <RedirectIfLoggedIn>
              <PageWrapper>
                <Login />
              </PageWrapper>
            </RedirectIfLoggedIn>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RedirectIfLoggedIn>
              <PageWrapper>
                <ForgotPassword />
              </PageWrapper>
            </RedirectIfLoggedIn>
          }
        />
        <Route
          path="/update-password"
          element={
            <RedirectIfLoggedIn>
              <PageWrapper>
                <UpdatePassword />
              </PageWrapper>
            </RedirectIfLoggedIn>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/profile" element={<PageWrapper><ProfilePage /></PageWrapper>} />
        	<Route path="/notifications" element={<PageWrapper><NotificationsPage /></PageWrapper>} />
          <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
          <Route path="/settings/gateways/:id" element={<PageWrapper><GatewayPage /></PageWrapper>} />
          <Route path="/history" element={<PageWrapper><HistoryPage /></PageWrapper>} />
          <Route path="/logs" element={<PageWrapper><LogList /></PageWrapper>} />
          <Route path="/sensors" element={<PageWrapper><SensorList /></PageWrapper>} />
            <Route path="/sensors/:id" element={<PageWrapper><SensorPage /></PageWrapper>} />
          <Route path="/alerts" element={<PageWrapper><AlertList /></PageWrapper>} />
            <Route path="/alerts/:id" element={<PageWrapper><AlertPage /></PageWrapper>} />
          <Route path="/maintenance" element={<PageWrapper><MaintenanceList /></PageWrapper>} />
            <Route path="/maintenance/:id" element={<PageWrapper><MaintenancePage /></PageWrapper>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  // We not need to pass sitename if the Frappe version is v14.
  const getSiteName = () => {
    // @ts-ignore
    if (window.frappe?.boot?.versions?.frappe.startsWith('14')) {
      return import.meta.env.VITE_SITE_NAME
    }
    // @ts-ignore
    else {
      // @ts-ignore
      return window.frappe?.boot?.sitename ?? import.meta.env.VITE_SITE_NAME
    }
  }

  return (
    <div className="App">
      <Theme appearance="light" accentColor="blue" grayColor="auto">
        <FrappeProvider
          url={import.meta.env.VITE_FRAPPE_PATH ?? ''}
          socketPort={import.meta.env.VITE_SOCKET_PORT ? import.meta.env.VITE_SOCKET_PORT : undefined}
          siteName={getSiteName()}
        >
          <Router>
            <AppInitializer>
              <Suspense fallback={<PageLoader />}>
                <AnimatedRoutes />
              </Suspense>
            </AppInitializer>
          </Router>
        </FrappeProvider>
      </Theme>
    </div>
  );
}

export default App;