import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  Eye,
  Globe,
  Smartphone,
  Palette,
  HelpCircle,
  LogOut,
  ChevronRight,
  Check,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  type: "toggle" | "select" | "button" | "info";
  value?: boolean | string;
  onClick?: () => void;
}

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);

  const settingsSections: SettingsSection[] = [
    {
      id: "account",
      title: "Account",
      icon: User,
      items: [
        {
          id: "profile",
          title: "Profile",
          subtitle: "Edit your profile information",
          type: "button",
          onClick: () => console.log("Edit profile"),
        },
        {
          id: "username",
          title: "Username",
          subtitle: "@" + (user?.handle || "user"),
          type: "info",
        },
        {
          id: "email",
          title: "Email",
          subtitle: "Add or change your email address",
          type: "button",
          onClick: () => console.log("Change email"),
        },
      ],
    },
    {
      id: "privacy",
      title: "Privacy and Safety",
      icon: Shield,
      items: [
        {
          id: "privacy-mode",
          title: "Private Account",
          subtitle: "Only approved followers can see your posts",
          type: "toggle",
          value: privacyMode,
          onClick: () => setPrivacyMode(!privacyMode),
        },
        {
          id: "blocked",
          title: "Blocked Accounts",
          subtitle: "Manage your blocked accounts",
          type: "button",
          onClick: () => console.log("Manage blocked accounts"),
        },
        {
          id: "muted",
          title: "Muted Accounts",
          subtitle: "Manage your muted accounts",
          type: "button",
          onClick: () => console.log("Manage muted accounts"),
        },
      ],
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: Bell,
      items: [
        {
          id: "push-notifications",
          title: "Push Notifications",
          subtitle: "Receive notifications on your device",
          type: "toggle",
          value: notifications,
          onClick: () => setNotifications(!notifications),
        },
        {
          id: "email-notifications",
          title: "Email Notifications",
          subtitle: "Receive notifications via email",
          type: "toggle",
          value: emailNotifications,
          onClick: () => setEmailNotifications(!emailNotifications),
        },
        {
          id: "notification-settings",
          title: "Notification Settings",
          subtitle: "Customize your notification preferences",
          type: "button",
          onClick: () => console.log("Customize notifications"),
        },
      ],
    },
    {
      id: "appearance",
      title: "Appearance",
      icon: Palette,
      items: [
        {
          id: "theme",
          title: "Theme",
          subtitle: isDark ? "Dark Mode" : "Light Mode",
          type: "toggle",
          value: isDark,
          onClick: toggleTheme,
        },
        {
          id: "font-size",
          title: "Font Size",
          subtitle: "Adjust text size",
          type: "button",
          onClick: () => console.log("Adjust font size"),
        },
      ],
    },
    {
      id: "accessibility",
      title: "Accessibility",
      icon: Eye,
      items: [
        {
          id: "high-contrast",
          title: "High Contrast",
          subtitle: "Increase contrast for better visibility",
          type: "toggle",
          value: false,
          onClick: () => console.log("Toggle high contrast"),
        },
        {
          id: "reduced-motion",
          title: "Reduced Motion",
          subtitle: "Reduce animations and motion",
          type: "toggle",
          value: false,
          onClick: () => console.log("Toggle reduced motion"),
        },
      ],
    },
    {
      id: "data",
      title: "Data Usage",
      icon: Globe,
      items: [
        {
          id: "data-saver",
          title: "Data Saver",
          subtitle: "Reduce data usage",
          type: "toggle",
          value: false,
          onClick: () => console.log("Toggle data saver"),
        },
        {
          id: "download-data",
          title: "Download Your Data",
          subtitle: "Get a copy of your data",
          type: "button",
          onClick: () => console.log("Download data"),
        },
      ],
    },
    {
      id: "help",
      title: "Help and Support",
      icon: HelpCircle,
      items: [
        {
          id: "help-center",
          title: "Help Center",
          subtitle: "Get help and support",
          type: "button",
          onClick: () => console.log("Open help center"),
        },
        {
          id: "contact-support",
          title: "Contact Support",
          subtitle: "Get in touch with our team",
          type: "button",
          onClick: () => console.log("Contact support"),
        },
        {
          id: "about",
          title: "About Connect.",
          subtitle: "Version 1.0.0",
          type: "info",
        },
      ],
    },
  ];

  const renderSettingsItem = (item: SettingsItem) => {
    return (
      <motion.div
        key={item.id}
        className="settings-item"
        whileHover={{ backgroundColor: "var(--bg-secondary)" }}
        transition={{ duration: 0.2 }}
      >
        <div className="settings-item-content">
          <div className="settings-item-info">
            <h3 className="settings-item-title">{item.title}</h3>
            {item.subtitle && (
              <p className="settings-item-subtitle">{item.subtitle}</p>
            )}
          </div>
          <div className="settings-item-control">
            {item.type === "toggle" && (
              <button
                className={`toggle-btn ${item.value ? "active" : ""}`}
                onClick={item.onClick}
              >
                <div className="toggle-slider">
                  {item.value && <Check size={12} />}
                </div>
              </button>
            )}
            {item.type === "button" && (
              <button className="settings-btn" onClick={item.onClick}>
                <ChevronRight size={20} />
              </button>
            )}
            {item.type === "info" && (
              <span className="settings-info">{item.value}</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="settings">
      <motion.div
        className="settings-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </motion.div>

      <motion.div
        className="settings-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.id}
            className="settings-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <div className="settings-section-header">
              <section.icon size={20} />
              <h2>{section.title}</h2>
            </div>
            <div className="settings-section-items">
              {section.items.map((item) => renderSettingsItem(item))}
            </div>
          </motion.div>
        ))}

        <motion.div
          className="settings-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: settingsSections.length * 0.1 }}
        >
          <div className="settings-section-header">
            <LogOut size={20} />
            <h2>Account</h2>
          </div>
          <div className="settings-section-items">
            <motion.div
              className="settings-item logout-item"
              whileHover={{ backgroundColor: "var(--like-color)" }}
              transition={{ duration: 0.2 }}
              onClick={logout}
            >
              <div className="settings-item-content">
                <div className="settings-item-info">
                  <h3 className="settings-item-title">Log Out</h3>
                  <p className="settings-item-subtitle">
                    Sign out of your account
                  </p>
                </div>
                <LogOut size={20} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Settings;
