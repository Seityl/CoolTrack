import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FrappeProvider, useFrappeAuth } from "frappe-react-sdk";
import ProtectedRoute from "./utils/auth/ProtectedRoute";
import "@radix-ui/themes/styles.css";
import { Theme, Spinner, Flex } from "@radix-ui/themes";
import Workspace from "./components/layout/Workspace";
import { Suspense, lazy, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

const Login = lazy(() => import("./pages/auth/Login"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProfilePage = lazy(() => import("./pages/user/ProfilePage"));
const NotificationsPage = lazy(() => import("./pages/user/NotificationsPage"));
const GatewayList = lazy(() => import("./pages/gateway/GatewayList"));
const GatewayPage = lazy(() => import("./pages/gateway/GatewayPage"));
const SensorList = lazy(() => import("./pages/sensor/SensorList"));
const SensorPage = lazy(() => import("./pages/sensor/SensorPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));

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
          path="/signup"
          element={
            <RedirectIfLoggedIn>
              <PageWrapper>
                <SignUp />
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
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
          <Route path="/user/profile" element={<PageWrapper><ProfilePage /></PageWrapper>} />
        	<Route path="/user/notifications" element={<PageWrapper><NotificationsPage /></PageWrapper>} />
          <Route path="/gateways" element={<PageWrapper><GatewayList /></PageWrapper>} />
          <Route path="/gateways/:id" element={<PageWrapper><GatewayPage /></PageWrapper>} />
          <Route path="/sensors" element={<PageWrapper><SensorList /></PageWrapper>} />
          <Route path="/sensors/:id" element={<PageWrapper><SensorPage /></PageWrapper>} />
          <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
          <Route path="/history" element={<PageWrapper><HistoryPage /></PageWrapper>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const getSiteName = (): string => {
    // @ts-expect-error - frappe.boot might not exist on window
    if (window.frappe?.boot?.versions?.frappe.startsWith("14")) {
      return import.meta.env.VITE_SITE_NAME;
    } else {
      // @ts-expect-error - frappe.boot might not exist on window
      return window.frappe?.boot?.sitename ?? import.meta.env.VITE_SITE_NAME;
    }
  };

  return (
    <div className="App">
      <Theme appearance="light" accentColor="blue" grayColor="sage">
        <FrappeProvider
          socketPort={import.meta.env.VITE_SOCKET_PORT ? parseInt(import.meta.env.VITE_SOCKET_PORT) : undefined}
          siteName={getSiteName()}
        >
          <Router>
            <Suspense
              fallback={
                <Flex height="100vh" align="center" justify="center">
                  <Spinner size="3" />
                </Flex>
              }
            >
              <AnimatedRoutes />
            </Suspense>
          </Router>
        </FrappeProvider>
      </Theme>
    </div>
  );
}

export default App;