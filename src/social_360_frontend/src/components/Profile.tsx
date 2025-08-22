import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Edit, Calendar, MapPin, Link, Check, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import * as backend from "../backend/social360";
import PostCard from "./PostCard";

interface UserProfile {
  handle: string;
  name: string;
  bio: string;
  location: string;
  website: string;
  joinDate: Date;
  followers: number;
  following: number;
  posts: number;
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

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "posts" | "replies" | "media" | "likes"
  >("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      // For now, create a mock profile since backend doesn't have full profile endpoints
      const mockProfile: UserProfile = {
        handle: user.handle,
        name: `User ${user.handle}`,
        bio: "This is my bio. I love Social360!",
        location: "Internet Computer",
        website: "https://social360.ic",
        joinDate: new Date("2024-01-01"),
        followers: 42,
        following: 23,
        posts: 15,
      };

      setProfile(mockProfile);
      setEditForm({
        name: mockProfile.name,
        bio: mockProfile.bio,
        location: mockProfile.location,
        website: mockProfile.website,
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchUserPosts = async () => {
    if (!user) return;

    try {
      const backendPosts = await backend.getUserUpdates(user.principal, 0, 10);

      const formattedPosts: Post[] = await Promise.all(
        backendPosts.map(async (post: any) => {
          const isLiked = await backend.hasLikedUpdate(post.id, user.principal);
          const isReposted = await backend.hasRepostedUpdate(
            post.id,
            user.principal
          );

          return {
            id: post.id.toString(),
            content: post.content,
            author: {
              handle: user.handle,
              name: profile?.name || `User ${user.handle}`,
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

      setPosts(formattedPosts);
    } catch (error) {
      console.error("Failed to fetch user posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // In a real implementation, you'd call backend.updateProfile(editForm)
      setProfile((prev) => (prev ? { ...prev, ...editForm } : null));
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const newLikedState = await backend.likeUpdate(BigInt(postId));
      setPosts(
        posts.map((post) =>
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
        await fetchUserPosts();
      }
    } catch (error) {
      console.error("Failed to repost:", error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  if (!profile) {
    return (
      <div className="profile">
        <div className="loading-container">
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <motion.div
        className="profile-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="profile-cover">
          <div className="profile-avatar">
            <User size={40} />
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-actions">
            {isEditing ? (
              <div className="edit-actions">
                <motion.button
                  className="save-btn btn btn-primary"
                  onClick={handleSaveProfile}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Check size={16} />
                  Save
                </motion.button>
                <motion.button
                  className="cancel-btn btn btn-ghost"
                  onClick={() => setIsEditing(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={16} />
                  Cancel
                </motion.button>
              </div>
            ) : (
              <motion.button
                className="edit-btn btn btn-secondary"
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Edit size={16} />
                Edit Profile
              </motion.button>
            )}
          </div>

          <div className="profile-details">
            {isEditing ? (
              <div className="edit-form">
                <input
                  type="text"
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="edit-input"
                />
                <textarea
                  placeholder="Bio"
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  className="edit-textarea"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="edit-input"
                />
                <input
                  type="text"
                  placeholder="Website"
                  value={editForm.website}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      website: e.target.value,
                    }))
                  }
                  className="edit-input"
                />
              </div>
            ) : (
              <>
                <h1 className="profile-name">{profile.name}</h1>
                <div className="profile-handle">@{profile.handle}</div>

                {profile.bio && (
                  <div className="profile-bio">{profile.bio}</div>
                )}

                <div className="profile-meta">
                  {profile.location && (
                    <div className="profile-location">
                      <MapPin size={16} />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <div className="profile-website">
                      <Link size={16} />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                  <div className="profile-join-date">
                    <Calendar size={16} />
                    Joined {formatDate(profile.joinDate)}
                  </div>
                </div>

                <div className="profile-stats">
                  <div className="stat">
                    <span className="stat-number">{profile.posts}</span>
                    <span className="stat-label">Posts</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{profile.following}</span>
                    <span className="stat-label">Following</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{profile.followers}</span>
                    <span className="stat-label">Followers</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="profile-content">
        <div className="profile-tabs">
          <motion.button
            className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Posts
          </motion.button>
          <motion.button
            className={`tab-btn ${activeTab === "replies" ? "active" : ""}`}
            onClick={() => setActiveTab("replies")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Replies
          </motion.button>
          <motion.button
            className={`tab-btn ${activeTab === "media" ? "active" : ""}`}
            onClick={() => setActiveTab("media")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Media
          </motion.button>
          <motion.button
            className={`tab-btn ${activeTab === "likes" ? "active" : ""}`}
            onClick={() => setActiveTab("likes")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Likes
          </motion.button>
        </div>

        <div className="profile-posts">
          <AnimatePresence>
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
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
            ) : posts.length === 0 ? (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <User size={48} className="empty-icon" />
                <h3>No posts yet</h3>
                <p>When you post, it will show up here.</p>
              </motion.div>
            ) : (
              posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PostCard
                    post={post}
                    onLike={() => handleLike(post.id)}
                    onRepost={() => handleRepost(post.id)}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Profile;
