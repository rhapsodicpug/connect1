import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, Image, Smile, User } from "lucide-react";

interface PostFormProps {
  onSubmit: (content: string) => void;
}

const PostForm: React.FC<PostFormProps> = ({ onSubmit }) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxLength = 280;
  const remainingChars = maxLength - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
      onSubmit(content.trim());
      setContent("");
    } catch (error) {
      console.error("Failed to post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars <= 20;

  return (
    <motion.div
      className="post-form-container card"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="post-form">
        <div className="post-form-header">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="post-input-container">
            <textarea
              className="post-input"
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={maxLength}
              rows={3}
            />
          </div>
        </div>

        <div className="post-form-footer">
          <div className="post-actions">
            <motion.button
              type="button"
              className="action-btn btn btn-ghost"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Image size={20} />
            </motion.button>
            <motion.button
              type="button"
              className="action-btn btn btn-ghost"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Smile size={20} />
            </motion.button>
          </div>

          <div className="post-submit-section">
            <div className="char-counter">
              <span
                className={isOverLimit ? "error" : isNearLimit ? "warning" : ""}
              >
                {remainingChars}
              </span>
            </div>
            <motion.button
              type="submit"
              className="submit-btn btn btn-primary"
              disabled={!content.trim() || isSubmitting || isOverLimit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send size={16} />
              {isSubmitting ? "Posting..." : "Post"}
            </motion.button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default PostForm;
