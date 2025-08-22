import { motion } from "framer-motion";
import { useState } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import Sidebar from "./components/Sidebar.tsx";
import Timeline from "./components/Timeline.tsx";
import Explore from "./components/Explore.tsx";
import Notifications from "./components/Notifications.tsx";
import Messages from "./components/Messages.tsx";
import Profile from "./components/Profile";
import Settings from "./components/Settings.tsx";
import LoginPage from "./components/LoginPage";
import { useAuth } from "./contexts/AuthContext";
import "./App.css";

type Page =
  | "home"
  | "explore"
  | "notifications"
  | "messages"
  | "profile"
  | "settings";

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("home");

  if (isLoading) {
    return (
      <div className="loading-container">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Loading Connect...
        </motion.p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderMainContent = () => {
    switch (currentPage) {
      case "home":
        return <Timeline />;
      case "explore":
        return <Explore />;
      case "notifications":
        return <Notifications />;
      case "messages":
        return <Messages />;
      case "profile":
        return <Profile />;
      case "settings":
        return <Settings />;
      default:
        return <Timeline />;
    }
  };

  return (
    <ThemeProvider>
      <div className="app">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        <main className="main-content">{renderMainContent()}</main>
      </div>
    </ThemeProvider>
  );
}

export default App;
