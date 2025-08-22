import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth, useAuthError } from "../contexts/AuthContext";
import { Wallet, User, Sparkles, XCircle } from "lucide-react";

const LoginPage: React.FC = () => {
  const { loginWithII, mockLogin } = useAuth();
  const { error, clearError } = useAuthError();
  const [isLoading, setIsLoading] = useState(false);
  const [isMockLoading, setIsMockLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithII();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockLogin = async () => {
    setIsMockLoading(true);
    try {
      await mockLogin();
    } catch (error) {
      console.error("Mock login failed:", error);
    } finally {
      setIsMockLoading(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div
        className="login-card glass"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="logo-section"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Sparkles className="logo-icon" size={48} />
          <h1 className="app-title">Connect.</h1>
          <p className="app-subtitle">Decentralized Social Network</p>
        </motion.div>

        {error && (
          <motion.div
            className="login-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              color: "#f91880",
              margin: "16px 0",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <XCircle size={20} />
            <span>{error}</span>
            <button
              onClick={clearError}
              style={{
                background: "none",
                border: "none",
                color: "#f91880",
                cursor: "pointer",
                marginLeft: 8,
              }}
            >
              Dismiss
            </button>
          </motion.div>
        )}

        <motion.div
          className="login-options"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            className="login-btn btn btn-primary"
            onClick={handleLogin}
            disabled={isLoading || isMockLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Wallet size={20} />
            {isLoading ? "Connecting..." : "Connect with Internet Identity"}
          </motion.button>

          <div className="divider">
            <span>or</span>
          </div>

          <motion.button
            className="login-btn btn btn-secondary"
            onClick={handleMockLogin}
            disabled={isLoading || isMockLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <User size={20} />
            {isMockLoading ? "Logging in..." : "Continue as Guest"}
          </motion.button>
        </motion.div>

        <motion.div
          className="features"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="feature">
            <div className="feature-icon">🔐</div>
            <div className="feature-text">
              <h3>Secure Authentication</h3>
              <p>Connect with your Internet Computer wallet</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">🌐</div>
            <div className="feature-text">
              <h3>Decentralized</h3>
              <p>Built on the Internet Computer blockchain</p>
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <div className="feature-text">
              <h3>Lightning Fast</h3>
              <p>Instant updates and real-time interactions</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
