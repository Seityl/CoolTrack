import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FrappeProvider, useFrappeAuth } from "frappe-react-sdk";
import ProtectedRoute from "./utils/auth/ProtectedRoute";
import "@radix-ui/themes/styles.css";
import { Theme, Spinner, Flex } from "@radix-ui/themes";
import Workspace from "./components/layout/Workspace";
import { Suspense, lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ItemList = lazy(() => import("./pages/items/ItemList"));
const Uom = lazy(() => import("./pages/items/Uom"));
const ItemGroup = lazy(() => import("./pages/items/ItemGroup"));
const SupplierList = lazy(() => import("./pages/suppliers/SupplierList"));
const HSCodeList = lazy(() => import("./pages/items/HSCodeList"));
const SupplierGroupList = lazy(() => import("./pages/suppliers/SupplierGroupList"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/auth/Login"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const Profile = lazy(() => import("./pages/user/Profile"));
const Settings = lazy(() => import("./pages/utils/Settings"));
const InvoiceList = lazy(() => import("./pages/invoices/InvoiceList"));
const UploadInvoice = lazy(() => import("./pages/invoices/UploadInvoice"));

const RedirectIfLoggedIn = ({ children }: { children: JSX.Element }) => {
  const { currentUser } = useFrappeAuth();
  return currentUser ? <Navigate to="/" replace /> : children;
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
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
          <Route path="/user/profile" element={<PageWrapper><Profile /></PageWrapper>} />
          <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
          <Route path="/invoices" element={<PageWrapper><InvoiceList /></PageWrapper>} />
          <Route path="/invoices/upload" element={<PageWrapper><UploadInvoice /></PageWrapper>} />
          <Route path="/items" element={<PageWrapper><ItemList /></PageWrapper>} />
          <Route path="/items/uom" element={<PageWrapper><Uom /></PageWrapper>} />
          <Route path="/items/hs-code" element={<PageWrapper><HSCodeList /></PageWrapper>} />
          <Route path="/items/item-group" element={<PageWrapper><ItemGroup /></PageWrapper>} />
          <Route path="/suppliers" element={<PageWrapper><SupplierList /></PageWrapper>} />
          <Route path="/suppliers/supplier-group" element={<PageWrapper><SupplierGroupList /></PageWrapper>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const getSiteName = () => {
    // @ts-ignore
    if (window.frappe?.boot?.versions?.frappe.startsWith("14")) {
      return import.meta.env.VITE_SITE_NAME;
    } else {
      // @ts-ignore
      return window.frappe?.boot?.sitename ?? import.meta.env.VITE_SITE_NAME;
    }
  };

  return (
    <div className="App">
      <Theme appearance="light" accentColor="blue" grayColor="sage">
        <FrappeProvider
          socketPort={import.meta.env.VITE_SOCKET_PORT}
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