import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
  Search,
  Bell,
  Mail,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

type Page =
  | "home"
  | "explore"
  | "notifications"
  | "messages"
  | "profile"
  | "settings";

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { icon: Home, label: "Home", page: "home" as Page },
    { icon: Search, label: "Explore", page: "explore" as Page },
    { icon: Bell, label: "Notifications", page: "notifications" as Page },
    { icon: Mail, label: "Messages", page: "messages" as Page },
    { icon: User, label: "Profile", page: "profile" as Page },
  ];

  return (
    <motion.div
      className={`sidebar ${isExpanded ? "expanded" : "collapsed"}`}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="sidebar-header">
        <motion.div
          className="logo"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Sparkles size={32} />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: isExpanded ? "block" : "none" }}
          >
            Connect.
          </motion.span>
        </motion.div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, index) => (
          <motion.div
            key={item.label}
            className={`nav-item ${currentPage === item.page ? "active" : ""}`}
            onClick={() => onPageChange(item.page)}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            title={!isExpanded ? item.label : undefined}
          >
            <item.icon size={32} />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: isExpanded ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: isExpanded ? "block" : "none" }}
            >
              {item.label}
            </motion.span>
          </motion.div>
        ))}
      </nav>

      <div className="sidebar-actions">
        <motion.button
          className="theme-toggle btn btn-ghost"
          onClick={toggleTheme}
          title={
            !isExpanded ? (isDark ? "Light Mode" : "Dark Mode") : undefined
          }
        >
          {isDark ? <Sun size={28} /> : <Moon size={28} />}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: isExpanded ? "block" : "none" }}
          >
            {isDark ? "Light Mode" : "Dark Mode"}
          </motion.span>
        </motion.button>

        <motion.button
          className="settings-btn btn btn-ghost"
          onClick={() => onPageChange("settings")}
          title={!isExpanded ? "Settings" : undefined}
        >
          <Settings size={28} />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: isExpanded ? "block" : "none" }}
          >
            Settings
          </motion.span>
        </motion.button>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <User size={28} />
          </div>
          <motion.div
            className="user-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: isExpanded ? "block" : "none" }}
          >
            <div className="user-name">{user?.handle || "User"}</div>
            <div className="user-handle">@{user?.handle || "user"}</div>
          </motion.div>
        </div>

        <motion.button
          className="logout-btn btn btn-ghost"
          onClick={logout}
          title={!isExpanded ? "Logout" : undefined}
        >
          <LogOut size={28} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
