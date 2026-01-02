import LoginPage from "./pages/Login";
import Home from "./pages/Home";
import Backstage from "./pages/Backstage";
import Settings from "./pages/Settings";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <MemoryRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/backstage" element={<Backstage />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </MemoryRouter>
  );
}

export default App;
