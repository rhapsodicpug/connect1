import React from "react";
import { motion } from "framer-motion";
import { Heart, Repeat, MessageCircle, Share, User } from "lucide-react";

interface Post {
  id: string;
  content: string;
  author: {
    handle: string;
    name: string;
  };
  timestamp: Date;
  likes: number;
  reposts: number;
  replies: number;
  isLiked: boolean;
  isReposted: boolean;
}

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onRepost: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onRepost }) => {
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <motion.div
      className="post-card card"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="post-header">
        <div className="post-author">
          <div className="author-avatar">
            <User size={20} />
          </div>
          <div className="author-info">
            <div className="author-name">{post.author.name}</div>
            <div className="author-handle">@{post.author.handle}</div>
          </div>
        </div>
        <div className="post-time">{formatTime(post.timestamp)}</div>
      </div>

      <div className="post-content">
        <p>{post.content}</p>
      </div>

      <div className="post-actions">
        <motion.button
          className="action-btn btn btn-ghost"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MessageCircle size={18} />
          <span>{formatNumber(post.replies)}</span>
        </motion.button>

        <motion.button
          className={`action-btn btn btn-ghost ${
            post.isReposted ? "reposted" : ""
          }`}
          onClick={onRepost}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Repeat size={18} />
          <span>{formatNumber(post.reposts)}</span>
        </motion.button>

        <motion.button
          className={`action-btn btn btn-ghost ${post.isLiked ? "liked" : ""}`}
          onClick={onLike}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart size={18} />
          <span>{formatNumber(post.likes)}</span>
        </motion.button>

        <motion.button
          className="action-btn btn btn-ghost"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Share size={18} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PostCard;
