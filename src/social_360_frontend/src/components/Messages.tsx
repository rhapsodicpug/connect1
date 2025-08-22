import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  User,
  Search,
  MoreVertical,
  ArrowLeft,
  Phone,
  Video,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface Conversation {
  id: string;
  user: {
    handle: string;
    name: string;
  };
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  messages: Message[];
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Mock conversations since backend doesn't have DM endpoints yet
      const mockConversations: Conversation[] = [
        {
          id: "1",
          user: { handle: "user123", name: "User 123" },
          lastMessage: "Hey! How are you doing?",
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          unreadCount: 2,
          messages: [
            {
              id: "1",
              sender: "user123",
              content: "Hey! How are you doing?",
              timestamp: new Date(Date.now() - 1000 * 60 * 5),
              isRead: false,
            },
            {
              id: "2",
              sender: user.principal,
              content: "I'm doing great! Thanks for asking.",
              timestamp: new Date(Date.now() - 1000 * 60 * 3),
              isRead: true,
            },
          ],
        },
        {
          id: "2",
          user: { handle: "user456", name: "User 456" },
          lastMessage: "Did you see the latest update?",
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          unreadCount: 0,
          messages: [
            {
              id: "3",
              sender: "user456",
              content: "Did you see the latest update?",
              timestamp: new Date(Date.now() - 1000 * 60 * 30),
              isRead: true,
            },
          ],
        },
        {
          id: "3",
          user: { handle: "user789", name: "User 789" },
          lastMessage: "Thanks for the follow!",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          unreadCount: 1,
          messages: [
            {
              id: "4",
              sender: "user789",
              content: "Thanks for the follow!",
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
              isRead: false,
            },
          ],
        },
      ];

      setConversations(mockConversations);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const message: Message = {
        id: Date.now().toString(),
        sender: user!.principal,
        content: newMessage,
        timestamp: new Date(),
        isRead: false,
      };

      // Add message to conversation
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: newMessage,
                timestamp: new Date(),
                messages: [...conv.messages, message],
              }
            : conv
        )
      );

      // Update selected conversation
      setSelectedConversation((prev) =>
        prev
          ? {
              ...prev,
              lastMessage: newMessage,
              timestamp: new Date(),
              messages: [...prev.messages, message],
            }
          : null
      );

      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
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

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.user.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="messages">
      {!selectedConversation ? (
        // Conversation list view
        <>
          <motion.div
            className="messages-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1>Messages</h1>
            <div className="search-container">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search messages"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </motion.div>

          <div className="conversations-list">
            <AnimatePresence>
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <motion.div
                    key={index}
                    className="conversation-skeleton card"
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
              ) : filteredConversations.length === 0 ? (
                <motion.div
                  className="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <MessageCircle size={48} className="empty-icon" />
                  <h3>No messages yet</h3>
                  <p>When you start conversations, they'll show up here.</p>
                </motion.div>
              ) : (
                filteredConversations.map((conversation, index) => (
                  <motion.div
                    key={conversation.id}
                    className="conversation-item card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedConversation(conversation)}
                    whileHover={{ y: -2 }}
                  >
                    <div className="conversation-avatar">
                      <User size={20} />
                    </div>

                    <div className="conversation-content">
                      <div className="conversation-header">
                        <div className="conversation-user">
                          <span className="user-name">
                            {conversation.user.name}
                          </span>
                          <span className="user-handle">
                            @{conversation.user.handle}
                          </span>
                        </div>
                        <div className="conversation-time">
                          {formatTime(conversation.timestamp)}
                        </div>
                      </div>

                      <div className="conversation-message">
                        {conversation.lastMessage}
                      </div>
                    </div>

                    {conversation.unreadCount > 0 && (
                      <div className="unread-badge">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        // Chat view
        <div className="chat-view">
          <motion.div
            className="chat-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              className="back-btn"
              onClick={() => setSelectedConversation(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ArrowLeft size={20} />
            </motion.button>

            <div className="chat-user-info">
              <div className="user-avatar">
                <User size={20} />
              </div>
              <div className="user-details">
                <div className="user-name">
                  {selectedConversation.user.name}
                </div>
                <div className="user-handle">
                  @{selectedConversation.user.handle}
                </div>
              </div>
            </div>

            <div className="chat-actions">
              <motion.button
                className="action-btn"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Phone size={18} />
              </motion.button>
              <motion.button
                className="action-btn"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Video size={18} />
              </motion.button>
              <motion.button
                className="action-btn"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <MoreVertical size={18} />
              </motion.button>
            </div>
          </motion.div>

          <div className="chat-messages">
            <AnimatePresence>
              {selectedConversation.messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  className={`message ${
                    message.sender === user?.principal ? "sent" : "received"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="message-content">{message.content}</div>
                  <div className="message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="chat-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="message-input"
            />
            <motion.button
              className="send-btn"
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
