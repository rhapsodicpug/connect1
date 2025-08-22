import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  TrendingUp,
  UserPlus,
  Hash,
  Sparkles,
  TrendingDown,
  Users,
  Globe,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import * as backend from "../backend/social360";
import PostCard from "./PostCard";

interface TrendingTopic {
  id: string;
  topic: string;
  posts: number;
  category: string;
  trend: "up" | "down" | "stable";
}

interface SuggestedUser {
  id: string;
  name: string;
  handle: string;
  followers: number;
  isFollowing: boolean;
}

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

const Explore: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trending" | "posts" | "users">(
    "trending"
  );

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      setIsLoading(true);

      // Fetch trending topics by searching popular hashtags
      const popularHashtags = [
        "#ICP",
        "#Web3",
        "#Social360",
        "#DeFi",
        "#InternetComputer",
        "#Blockchain",
        "#Crypto",
        "#DApp",
      ];
      const trendingData: TrendingTopic[] = [];

      for (const hashtag of popularHashtags) {
        try {
          const posts = await backend.searchUpdates(hashtag);
          trendingData.push({
            id: hashtag,
            topic: hashtag,
            posts: posts.length,
            category: "Technology",
            trend:
              posts.length > 5 ? "up" : posts.length > 2 ? "stable" : "down",
          });
        } catch (error) {
          console.error(`Failed to fetch ${hashtag}:`, error);
        }
      }

      setTrendingTopics(trendingData);

      // Fetch suggested users
      const users = await backend.searchUsers("");
      const suggestedData: SuggestedUser[] = users
        .slice(0, 6)
        .map((user: any) => ({
          id: user[0].toString(),
          name: `User ${user[0].toString().slice(0, 8)}`,
          handle: user[1].handle,
          followers: Math.floor(Math.random() * 1000),
          isFollowing: false,
        }));

      setSuggestedUsers(suggestedData);

      // Fetch trending posts
      const timelinePosts = await backend.getTimeline(0, 10);
      const formattedPosts: Post[] = await Promise.all(
        timelinePosts.map(async (post: any) => {
          const isLiked = user
            ? await backend.hasLikedUpdate(post.id, user.principal)
            : false;
          const isReposted = user
            ? await backend.hasRepostedUpdate(post.id, user.principal)
            : false;

          return {
            id: post.id.toString(),
            content: post.content,
            author: {
              handle: `user_${post.author.toString().slice(0, 8)}`,
              name: `User ${post.author.toString().slice(0, 8)}`,
            },
            timestamp: new Date(Number(post.timestamp) / 1000000),
            likes: Number(post.likes),
            reposts: Number(post.reposts),
            replies: 0,
            isLiked,
            isReposted,
          };
        })
      );

      setTrendingPosts(formattedPosts);
    } catch (error) {
      console.error("Failed to fetch explore data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;

    try {
      await backend.follow(userId);
      setSuggestedUsers((users) =>
        users.map((user) =>
          user.id === userId
            ? { ...user, isFollowing: !user.isFollowing }
            : user
        )
      );
    } catch (error) {
      console.error("Failed to follow user:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setActiveTab("posts");

      // Search for updates and users
      const updates = await backend.searchUpdates(searchQuery);
      const users = await backend.searchUsers(searchQuery);

      // Update trending topics with search results
      setTrendingTopics([
        {
          id: searchQuery,
          topic: searchQuery,
          posts: updates.length,
          category: "Search",
          trend: "up",
        },
      ]);

      // Update suggested users with search results
      const searchUsers: SuggestedUser[] = users
        .slice(0, 6)
        .map((user: any) => ({
          id: user[0].toString(),
          name: `User ${user[0].toString().slice(0, 8)}`,
          handle: user[1].handle,
          followers: Math.floor(Math.random() * 1000),
          isFollowing: false,
        }));

      setSuggestedUsers(searchUsers);

      // Update trending posts with search results
      const formattedPosts: Post[] = await Promise.all(
        updates.slice(0, 10).map(async (post: any) => {
          const isLiked = user
            ? await backend.hasLikedUpdate(post.id, user.principal)
            : false;
          const isReposted = user
            ? await backend.hasRepostedUpdate(post.id, user.principal)
            : false;

          return {
            id: post.id.toString(),
            content: post.content,
            author: {
              handle: `user_${post.author.toString().slice(0, 8)}`,
              name: `User ${post.author.toString().slice(0, 8)}`,
            },
            timestamp: new Date(Number(post.timestamp) / 1000000),
            likes: Number(post.likes),
            reposts: Number(post.reposts),
            replies: 0,
            isLiked,
            isReposted,
          };
        })
      );

      setTrendingPosts(formattedPosts);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const newLikedState = await backend.likeUpdate(BigInt(postId));
      setTrendingPosts(
        trendingPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likes: newLikedState ? post.likes + 1 : post.likes - 1,
                isLiked: newLikedState,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleRepost = async (postId: string) => {
    if (!user) return;

    try {
      const repostId = await backend.repostUpdate(BigInt(postId));
      if (repostId > 0) {
        await fetchExploreData();
      }
    } catch (error) {
      console.error("Failed to repost:", error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp size={16} className="text-green-500" />;
      case "down":
        return <TrendingDown size={16} className="text-red-500" />;
      default:
        return <Sparkles size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="explore">
      <motion.div
        className="explore-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Explore</h1>

        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search Social360"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="search-input"
            />
          </div>
        </div>
      </motion.div>

      <div className="explore-tabs">
        <motion.button
          className={`tab-btn ${activeTab === "trending" ? "active" : ""}`}
          onClick={() => setActiveTab("trending")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <TrendingUp size={18} />
          Trending
        </motion.button>
        <motion.button
          className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Globe size={18} />
          Posts
        </motion.button>
        <motion.button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Users size={18} />
          People
        </motion.button>
      </div>

      <div className="explore-content">
        <AnimatePresence mode="wait">
          {activeTab === "trending" && (
            <motion.div
              key="trending"
              className="trending-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="section-title">
                <TrendingUp size={20} />
                Trending Topics
              </h3>

              {isLoading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <motion.div
                      key={index}
                      className="trending-skeleton shimmer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    />
                  ))
                : trendingTopics.map((topic, index) => (
                    <motion.div
                      key={topic.id}
                      className="trending-item"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="trending-category">{topic.category}</div>
                      <div className="trending-topic">{topic.topic}</div>
                      <div className="trending-stats">
                        {getTrendIcon(topic.trend)}
                        <span>{formatNumber(topic.posts)} posts</span>
                      </div>
                    </motion.div>
                  ))}
            </motion.div>
          )}

          {activeTab === "posts" && (
            <motion.div
              key="posts"
              className="posts-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="section-title">
                <Globe size={20} />
                Trending Posts
              </h3>

              {isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <motion.div
                      key={index}
                      className="post-skeleton card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="skeleton-header">
                        <div className="skeleton-avatar shimmer"></div>
                        <div className="skeleton-info">
                          <div className="skeleton-name shimmer"></div>
                          <div className="skeleton-handle shimmer"></div>
                        </div>
                      </div>
                      <div className="skeleton-content">
                        <div className="skeleton-line shimmer"></div>
                        <div className="skeleton-line shimmer"></div>
                      </div>
                    </motion.div>
                  ))
                : trendingPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <PostCard
                        post={post}
                        onLike={() => handleLike(post.id)}
                        onRepost={() => handleRepost(post.id)}
                      />
                    </motion.div>
                  ))}
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div
              key="users"
              className="users-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="section-title">
                <UserPlus size={20} />
                Who to follow
              </h3>

              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <motion.div
                      key={index}
                      className="user-skeleton shimmer"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    />
                  ))
                : suggestedUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      className="suggested-user"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="user-info">
                        <div className="user-avatar">
                          <Hash size={16} />
                        </div>
                        <div className="user-details">
                          <div className="user-name">{user.name}</div>
                          <div className="user-handle">@{user.handle}</div>
                          <div className="user-followers">
                            {formatNumber(user.followers)} followers
                          </div>
                        </div>
                      </div>
                      <motion.button
                        className={`follow-btn btn ${
                          user.isFollowing ? "btn-secondary" : "btn-primary"
                        }`}
                        onClick={() => handleFollow(user.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {user.isFollowing ? "Following" : "Follow"}
                      </motion.button>
                    </motion.div>
                  ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Explore;
