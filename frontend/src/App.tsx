import LoginPage from "./pages/Login";
import Home from "./pages/Home";
import Backstage from "./pages/Backstage";
import Settings from "./pages/Settings";
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import LoadingScreen from "./components/LoadingScreen";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";

function AnimatedRoutes() {
  const location = useLocation();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const showGlobalLoading = authLoading || isInitialLoad || isTransitioning;

  return (
    <>
      <AnimatePresence>
        {showGlobalLoading && <LoadingScreen key="global-loading" />}
      </AnimatePresence>

      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Routes location={location}>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/home"
            element={isAuthenticated ? <Home /> : <Navigate to="/" />}
          />
          <Route
            path="/backstage"
            element={isAuthenticated ? <Backstage /> : <Navigate to="/" />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <Settings /> : <Navigate to="/" />}
          />
        </Routes>
      </motion.div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <MemoryRouter>
        <SocketProvider>
          <Toaster
            position="top-center"
            reverseOrder={false}
            containerStyle={{ zIndex: 100000 }}
            toastOptions={{
              style: {
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "100px",
                color: "#fff",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "600",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              },
              success: {
                iconTheme: {
                  primary: "#A855F7",
                  secondary: "#fff",
                },
              },
            }}
          />
          <AnimatedRoutes />
        </SocketProvider>
      </MemoryRouter>
    </AuthProvider>
  );
}

export default App;
