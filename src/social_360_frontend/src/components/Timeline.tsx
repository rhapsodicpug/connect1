import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import * as backend from "../backend/social360";
import PostForm from "./PostForm.tsx";
import PostCard from "./PostCard.tsx";

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

const Timeline: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchTimeline = async (pageNum: number = 0) => {
    try {
      const backendPosts = await backend.getTimeline(pageNum, 10);

      // Process posts and check like/repost status
      const formattedPosts: Post[] = await Promise.all(
        (backendPosts as any[]).map(async (post: any) => {
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
            timestamp: new Date(Number(post.timestamp) / 1000000), // Convert nanoseconds to milliseconds
            likes: Number(post.likes),
            reposts: Number(post.reposts),
            replies: 0, // Backend doesn't track replies yet
            isLiked: Boolean(isLiked),
            isReposted: Boolean(isReposted),
          };
        })
      );

      if (pageNum === 0) {
        setPosts(formattedPosts);
      } else {
        setPosts((prev) => [...prev, ...formattedPosts]);
      }

      setHasMore(formattedPosts.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch timeline:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [user]);

  const handleNewPost = async (content: string) => {
    try {
      await backend.postUpdate(content);
      // Refresh timeline to show new post
      await fetchTimeline(0);
    } catch (error) {
      console.error("Failed to post:", error);
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
                likes: Boolean(newLikedState) ? post.likes + 1 : post.likes - 1,
                isLiked: Boolean(newLikedState),
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
      if (Number(repostId) > 0) {
        // Refresh timeline to show repost
        await fetchTimeline(0);
      }
    } catch (error) {
      console.error("Failed to repost:", error);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchTimeline(page + 1);
    }
  };

  return (
    <div className="timeline">
      <motion.div
        className="timeline-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Home</h1>
      </motion.div>

      <PostForm onSubmit={handleNewPost} />

      <div className="timeline-content">
        <AnimatePresence>
          {isLoading && posts.length === 0 ? (
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
                  <div className="skeleton-line shimmer"></div>
                </div>
                <div className="skeleton-actions">
                  <div className="skeleton-action shimmer"></div>
                  <div className="skeleton-action shimmer"></div>
                  <div className="skeleton-action shimmer"></div>
                  <div className="skeleton-action shimmer"></div>
                </div>
              </motion.div>
            ))
          ) : (
            <>
              {posts.map((post, index) => (
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
              ))}

              {hasMore && (
                <motion.button
                  className="load-more-btn btn btn-secondary"
                  onClick={loadMore}
                  disabled={isLoading}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? "Loading..." : "Load More"}
                </motion.button>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Timeline;
