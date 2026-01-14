import LoginPage from "./pages/Login";
import Home from "./pages/Home";
import Backstage from "./pages/Backstage";
import Settings from "./pages/Settings";
import PrivateRoom from "./pages/PrivateRoom";
import Setup from "./pages/Setup";
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
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 500);

    fetch("/install/status")
      .then((r) => r.json())
      .then((data) => setIsInstalled(data.isInstalled))
      .catch(() => setIsInstalled(true));

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isInitialLoad) {
      setIsTransitioning(false);
    }
  }, [location.pathname]);

  const showGlobalLoading =
    authLoading || isInitialLoad || isTransitioning || isInstalled === null;

  if (isInstalled === false && location.pathname !== "/setup") {
    return <Navigate to="/setup" />;
  }

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
          <Route
            path="/setup"
            element={isInstalled === false ? <Setup /> : <Navigate to="/" />}
          />
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
          <Route
            path="/private-room"
            element={isAuthenticated ? <PrivateRoom /> : <Navigate to="/" />}
          />
          <Route
            path="/private-room/:roomId"
            element={isAuthenticated ? <PrivateRoom /> : <Navigate to="/" />}
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
              className: "custom-toast",
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
