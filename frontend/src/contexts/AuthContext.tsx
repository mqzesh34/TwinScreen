import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface UserProfile {
  name: string;
  role: string;
  key: string;
}

interface AuthContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  userRole: string;
  userKey: string | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let isAuthing = false;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const validateToken = async (savedToken: string) => {
    try {
      const res = await fetch("/validate-key", {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile({ name: data.name, role: data.role, key: data.key });
        if (data.token) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
        }
        return true;
      }
    } catch (err) {}

    return false;
  };

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthing) return;

      const savedToken =
        localStorage.getItem("token") ||
        localStorage.getItem("user_token") ||
        localStorage.getItem("user_key");
      if (savedToken) {
        isAuthing = true;
        await validateToken(savedToken);

        localStorage.removeItem("user_token");
        localStorage.removeItem("user_key");
      }
      setIsLoading(false);
      isAuthing = false;
    };
    initAuth();
  }, []);

  const login = async (key: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile({ name: data.name, role: data.role, key: data.key });
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setIsLoading(false);
        return true;
      }
    } catch (err) {}

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_key");
    setToken(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        isLoading,
        login,
        logout,
        isAuthenticated: !!userProfile,
        userRole: userProfile?.role || "",
        userKey: token,

        refreshProfile: async () => {
          if (token) await validateToken(token);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth bir AuthProvider içerisinde kullanılmalıdır");
  }
  return context;
};
