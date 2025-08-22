import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Heart,
  Repeat,
  UserPlus,
  MessageCircle,
  User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface Notification {
  id: string;
  type: "like" | "repost" | "follow" | "mention";
  user: {
    handle: string;
    name: string;
  };
  content: string;
  timestamp: Date;
  postId?: string;
  isRead: boolean;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "mentions">("all");

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // For now, we'll create mock notifications since the backend doesn't have notification endpoints
      // In a real implementation, you'd fetch from backend.getNotifications()
      const mockNotifications: Notification[] = [
        {
          id: "1",
          type: "like",
          user: { handle: "user123", name: "User 123" },
          content: "liked your post",
          timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
          postId: "post1",
          isRead: false,
        },
        {
          id: "2",
          type: "repost",
          user: { handle: "user456", name: "User 456" },
          content: "reposted your post",
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
          postId: "post1",
          isRead: false,
        },
        {
          id: "3",
          type: "follow",
          user: { handle: "user789", name: "User 789" },
          content: "started following you",
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          isRead: false,
        },
        {
          id: "4",
          type: "mention",
          user: { handle: "user101", name: "User 101" },
          content: "mentioned you in a post",
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          postId: "post2",
          isRead: true,
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart size={20} className="text-red-500" />;
      case "repost":
        return <Repeat size={20} className="text-green-500" />;
      case "follow":
        return <UserPlus size={20} className="text-blue-500" />;
      case "mention":
        return <MessageCircle size={20} className="text-purple-500" />;
      default:
        return <Bell size={20} />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "mentions") {
      return notification.type === "mention";
    }
    return true;
  });

  return (
    <div className="notifications">
      <motion.div
        className="notifications-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Notifications</h1>

        <div className="notification-tabs">
          <motion.button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            All
          </motion.button>
          <motion.button
            className={`tab-btn ${activeTab === "mentions" ? "active" : ""}`}
            onClick={() => setActiveTab("mentions")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Mentions
          </motion.button>
        </div>
      </motion.div>

      <div className="notifications-content">
        <AnimatePresence>
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, index) => (
              <motion.div
                key={index}
                className="notification-skeleton card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="skeleton-avatar shimmer"></div>
                <div className="skeleton-content">
                  <div className="skeleton-line shimmer"></div>
                  <div className="skeleton-line shimmer"></div>
                </div>
              </motion.div>
            ))
          ) : filteredNotifications.length === 0 ? (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Bell size={48} className="empty-icon" />
              <h3>No notifications yet</h3>
              <p>When you get notifications, they'll show up here.</p>
            </motion.div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                className={`notification-item card ${
                  !notification.isRead ? "unread" : ""
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => markAsRead(notification.id)}
                whileHover={{ y: -2 }}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-user">
                    <div className="user-avatar">
                      <User size={16} />
                    </div>
                    <div className="user-info">
                      <span className="user-name">
                        {notification.user.name}
                      </span>
                      <span className="user-handle">
                        @{notification.user.handle}
                      </span>
                    </div>
                  </div>

                  <div className="notification-text">
                    {notification.content}
                  </div>

                  <div className="notification-time">
                    {formatTime(notification.timestamp)}
                  </div>
                </div>

                {!notification.isRead && (
                  <div className="unread-indicator"></div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notifications;
