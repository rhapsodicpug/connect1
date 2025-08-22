import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image, Smile, User, Sparkles, FileText, Zap, Calendar, Gift, Trophy, Heart, Star, TrendingUp, Users, Lightbulb, Target, Bold, Italic, List, Clock, Save, Eye, EyeOff } from "lucide-react";

interface PostFormProps {
  onSubmit: (content: string) => void;
}

interface PostTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  content: string;
  category: string;
  description: string;
}

interface Draft {
  id: string;
  content: string;
  timestamp: number;
  scheduledFor?: number;
}

const PostForm: React.FC<PostFormProps> = ({ onSubmit }) => {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isRichText, setIsRichText] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 280;
  const remainingChars = maxLength - content.length;

  // Auto-save drafts every 3 seconds
  useEffect(() => {
    if (content.trim() && isDirty) {
      const timer = setTimeout(() => {
        saveDraft();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [content, isDirty]);

  // Smart suggestions based on content
  useEffect(() => {
    if (content.trim()) {
      const words = content.split(' ');
      const currentWord = words[words.length - 1];
      
      if (currentWord.startsWith('#')) {
        const hashtagSuggestions = [
          '#Innovation', '#Tech', '#Startup', '#Design', '#Development',
          '#AI', '#MachineLearning', '#Web3', '#Blockchain', '#Future',
          '#Success', '#Motivation', '#Leadership', '#Growth', '#Learning'
        ];
        setSuggestions(hashtagSuggestions.filter(h => h.toLowerCase().includes(currentWord.slice(1).toLowerCase())));
        setShowSuggestions(true);
      } else if (currentWord.startsWith('@')) {
        const mentionSuggestions = [
          '@elonmusk', '@sundarpichai', '@tim_cook', '@satyanadella',
          '@markzuckerberg', '@jack', '@brianchesky', '@drew_houston'
        ];
        setSuggestions(mentionSuggestions.filter(m => m.toLowerCase().includes(currentWord.slice(1).toLowerCase())));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [content]);

  // Pre-built post templates
  const templates: PostTemplate[] = [
    {
      id: "birthday",
      name: "Birthday Celebration",
      icon: <Gift className="w-5 h-5" />,
      content: "🎉 Happy Birthday! 🎂\n\nWishing you a day filled with joy, laughter, and wonderful surprises! May this year bring you all the happiness you deserve.\n\n#Birthday #Celebration #HappyBirthday",
      category: "celebration",
      description: "Perfect for birthday wishes"
    },
    {
      id: "promotion",
      name: "Career Achievement",
      icon: <Trophy className="w-5 h-5" />,
      content: "🚀 Exciting news! I'm thrilled to share that I've been promoted to [Position] at [Company]!\n\nGrateful for this opportunity and excited for what's ahead. Thank you to everyone who supported me on this journey.\n\n#CareerGrowth #Promotion #Success #NewBeginnings",
      category: "professional",
      description: "Announce career milestones"
    },
    {
      id: "event",
      name: "Event Announcement",
      icon: <Calendar className="w-5 h-5" />,
      content: "📅 Mark your calendars! 🎯\n\nJoin us for [Event Name] on [Date] at [Time]. This is going to be an amazing experience you won't want to miss!\n\nRSVP: [Link]\n#Event #Networking #Community",
      category: "event",
      description: "Promote upcoming events"
    },
    {
      id: "gratitude",
      name: "Thank You Post",
      icon: <Heart className="w-5 h-5" />,
      content: "🙏 Feeling incredibly grateful today!\n\nThank you to everyone who has supported, encouraged, and believed in me. Your kindness means the world to me.\n\n#Gratitude #Thankful #Blessed #Community",
      category: "personal",
      description: "Express gratitude and appreciation"
    },
    {
      id: "inspiration",
      name: "Motivational Quote",
      icon: <Star className="w-5 h-5" />,
      content: "✨ Today's reminder:\n\n\"The only way to do great work is to love what you do.\" - Steve Jobs\n\nWhat are you passionate about today? Share your thoughts below! 👇\n\n#Motivation #Inspiration #Quote #Mindset",
      category: "inspiration",
      description: "Share motivational content"
    },
    {
      id: "question",
      name: "Engagement Question",
      icon: <Users className="w-5 h-5" />,
      content: "🤔 Question of the day:\n\nWhat's one thing you've learned this week that you'd like to share with others?\n\nDrop your insights in the comments! 💭\n\n#Question #Engagement #Learning #Community",
      category: "engagement",
      description: "Boost engagement with questions"
    },
    {
      id: "update",
      name: "Life Update",
      icon: <TrendingUp className="w-5 h-5" />,
      content: "📝 Life update time!\n\n[Share your recent experience, achievement, or milestone]\n\nSometimes the best moments are the ones we don't plan for. What's new in your world?\n\n#LifeUpdate #Personal #Sharing #Journey",
      category: "personal",
      description: "Share personal updates"
    },
    {
      id: "tip",
      name: "Pro Tip",
      icon: <Lightbulb className="w-5 h-5" />,
      content: "💡 Pro tip of the day:\n\n[Your valuable tip or advice]\n\nThis simple trick has saved me so much time and effort. Hope it helps you too!\n\n#ProTip #Advice #Helpful #Knowledge",
      category: "tips",
      description: "Share helpful tips and advice"
    }
  ];

  const categories = [
    { id: "all", name: "All Templates", icon: <FileText className="w-4 h-4" /> },
    { id: "celebration", name: "Celebration", icon: <Gift className="w-4 h-4" /> },
    { id: "professional", name: "Professional", icon: <Trophy className="w-4 h-4" /> },
    { id: "event", name: "Events", icon: <Calendar className="w-4 h-4" /> },
    { id: "personal", name: "Personal", icon: <Heart className="w-4 h-4" /> },
    { id: "inspiration", name: "Inspiration", icon: <Star className="w-4 h-4" /> },
    { id: "engagement", name: "Engagement", icon: <Users className="w-4 h-4" /> },
    { id: "tips", name: "Tips", icon: <Lightbulb className="w-4 h-4" /> }
  ];

  const filteredTemplates = selectedCategory === "all" 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const saveDraft = () => {
    if (content.trim()) {
      const newDraft: Draft = {
        id: Date.now().toString(),
        content: content,
        timestamp: Date.now()
      };
      setDrafts(prev => [newDraft, ...prev.slice(0, 4)]); // Keep only 5 drafts
      setLastSaved(Date.now());
      setIsDirty(false);
    }
  };

  const loadDraft = (draft: Draft) => {
    setContent(draft.content);
    setShowDrafts(false);
    setIsDirty(false);
  };

  const schedulePost = () => {
    if (scheduledDate && scheduledTime && content.trim()) {
      const scheduledTimestamp = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
      const newDraft: Draft = {
        id: Date.now().toString(),
        content: content,
        timestamp: Date.now(),
        scheduledFor: scheduledTimestamp
      };
      setDrafts(prev => [newDraft, ...prev]);
      setContent("");
      setShowScheduler(false);
      setScheduledDate("");
      setScheduledTime("");
      setIsDirty(false);
      // Show success toast
      showToast("Post scheduled successfully! 📅", "success");
    }
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    // Toast notification will be handled by CSS
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add("show");
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
      onSubmit(content.trim());
      setContent("");
      setDrafts(prev => prev.filter(d => d.content !== content.trim()));
      setIsDirty(false);
      showToast("Post published successfully! 🚀", "success");
    } catch (error) {
      console.error("Failed to post:", error);
      showToast("Failed to publish post. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const useTemplate = (template: PostTemplate) => {
    setContent(template.content);
    setShowTemplates(false);
    setIsDirty(true);
  };

  const insertSuggestion = (suggestion: string) => {
    const words = content.split(' ');
    words[words.length - 1] = suggestion;
    setContent(words.join(' '));
    setShowSuggestions(false);
    setIsDirty(true);
    
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  };

  const formatText = (format: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = "";
    let newCursorPosition = start;
    
    switch (format) {
      case "bold":
        if (selectedText) {
          formattedText = `**${selectedText}**`;
          newCursorPosition = start + formattedText.length;
        } else {
          formattedText = "**bold text**";
          newCursorPosition = start + 2;
        }
        break;
      case "italic":
        if (selectedText) {
          formattedText = `*${selectedText}*`;
          newCursorPosition = start + formattedText.length;
        } else {
          formattedText = "*italic text*";
          newCursorPosition = start + 1;
        }
        break;
      case "list":
        if (selectedText) {
          // Split by lines and add bullet points
          const lines = selectedText.split('\n');
          formattedText = lines.map(line => `• ${line}`).join('\n');
          newCursorPosition = start + formattedText.length;
        } else {
          formattedText = "• List item 1\n• List item 2\n• List item 3";
          newCursorPosition = start + formattedText.length;
        }
        break;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    setIsDirty(true);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Keyboard shortcuts for formatting
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'l':
          e.preventDefault();
          formatText('list');
          break;
      }
    }
  };

  const isOverLimit = remainingChars < 0;
  const charPercentage = (content.length / maxLength) * 100;
  const isNearLimit = charPercentage > 80;

  return (
    <div className="relative">
      {/* Main Post Form */}
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
            <div className="post-input-container relative">
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="What's happening?"
                className="post-input"
                maxLength={maxLength}
                rows={3}
                ref={textareaRef}
                onKeyDown={handleKeyDown}
              />

              {/* Smart Suggestions Panel */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    className="suggestions-panel"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => insertSuggestion(suggestion)}
                        className="suggestion-item"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Rich Text Formatting Toolbar */}
              <div className="rich-text-toolbar">
                <button
                  type="button"
                  onClick={() => formatText("bold")}
                  className="format-btn"
                  title="Bold (Ctrl+B)"
                >
                  <Bold size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("italic")}
                  className="format-btn"
                  title="Italic (Ctrl+I)"
                >
                  <Italic size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("list")}
                  className="format-btn"
                  title="List"
                >
                  <List size={16} />
                </button>
                <div className="toolbar-divider"></div>
                <button
                  type="button"
                  onClick={() => setShowDrafts(!showDrafts)}
                  className="format-btn"
                  title="Saved Drafts"
                >
                  <Save size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowScheduler(!showScheduler)}
                  className="format-btn"
                  title="Schedule Post"
                >
                  <Clock size={16} />
                </button>
              </div>

              {/* Character Counter with Animation */}
              <div className="char-counter-container">
                <div className="char-counter-bar">
                  <motion.div
                    className={`char-counter-fill ${isOverLimit ? 'over-limit' : isNearLimit ? 'near-limit' : 'normal'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${charPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <span className={`char-counter-text ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-orange-500' : 'text-gray-500'}`}>
                  {remainingChars}
                </span>
                {lastSaved && (
                  <span className="last-saved">
                    <Save size={12} />
                    Saved {Math.floor((Date.now() - lastSaved) / 1000)}s ago
                  </span>
                )}
              </div>
            </div>

            {/* Drafts Panel */}
            <AnimatePresence>
              {showDrafts && (
                <motion.div
                  className="drafts-panel"
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="drafts-header">
                    <div className="drafts-title">
                      <Save className="w-5 h-5 text-green-500" />
                      <div>
                        <h4>Saved Drafts</h4>
                        <p>Your auto-saved post drafts</p>
                      </div>
                    </div>
                    <button onClick={() => setShowDrafts(false)} className="close-drafts-btn">×</button>
                  </div>
                  {drafts.length > 0 ? (
                    <div className="drafts-list">
                      {drafts.map((draft) => (
                        <div key={draft.id} className="draft-item">
                          <div className="draft-content">
                            <p className="draft-text">{draft.content.substring(0, 100)}...</p>
                            <div className="draft-meta">
                              <span className="draft-time">
                                <Clock className="w-3 h-3" />
                                {new Date(draft.timestamp).toLocaleString()}
                              </span>
                              {draft.scheduledFor && (
                                <span className="draft-scheduled">
                                  <Calendar className="w-3 h-3" />
                                  Scheduled for {new Date(draft.scheduledFor).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="draft-actions">
                            <button onClick={() => loadDraft(draft)} className="load-draft-btn">
                              <Eye className="w-4 h-4" />
                              Load
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-drafts">
                      <Save className="w-12 h-12 text-gray-300" />
                      <p>No saved drafts yet</p>
                      <span>Your drafts will appear here as you type</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Post Scheduler */}
            <AnimatePresence>
              {showScheduler && (
                <motion.div
                  className="scheduler-panel"
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="scheduler-header">
                    <div className="scheduler-title">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <div>
                        <h4>Schedule Post</h4>
                        <p>Choose when to publish your post</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowScheduler(false)}
                      className="close-scheduler-btn"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="scheduler-content">
                    <div className="scheduler-info">
                      <div className="scheduler-preview">
                        <span className="preview-label">Post Preview:</span>
                        <div className="preview-content">
                          {content.trim() || "Your post content will appear here..."}
                        </div>
                      </div>
                    </div>
                    
                    <div className="scheduler-inputs">
                      <div className="input-group">
                        <label>Date</label>
                        <div className="date-input-wrapper">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="scheduler-input date-input"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                      
                      <div className="input-group">
                        <label>Time</label>
                        <div className="time-input-wrapper">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="scheduler-input time-input"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="scheduler-actions">
                      <button
                        onClick={() => setShowScheduler(false)}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={schedulePost}
                        className="schedule-btn"
                        disabled={!scheduledDate || !scheduledTime || !content.trim()}
                      >
                        <Clock size={16} />
                        Schedule Post
                      </button>
                    </div>
                    
                    {scheduledDate && scheduledTime && (
                      <div className="scheduled-info">
                        <div className="scheduled-badge">
                          <Clock className="w-4 h-4" />
                          <span>Post will be published on {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="post-form-footer">
            <div className="post-actions">
              <button
                type="button"
                className="action-btn"
                title="Add image"
                disabled={isSubmitting}
              >
                <Image size={20} />
              </button>
              
              <button
                type="button"
                className="action-btn"
                title="Add emoji"
                disabled={isSubmitting}
              >
                <Smile size={20} />
              </button>

              {/* Smart Templates Button */}
              <button
                type="button"
                className="action-btn templates-btn"
                title="Smart Templates"
                onClick={() => setShowTemplates(!showTemplates)}
                disabled={isSubmitting}
              >
                <Users size={20} />
              </button>
            </div>
          </div>
        </form>

        {/* Clean Floating Template Picker */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div
              className="floating-templates-picker"
              initial={{ opacity: 0, scale: 0.8, y: -30, rotateX: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -30, rotateX: -15 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.46, 0.45, 0.94],
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
            >
              <motion.div 
                className="templates-picker-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <div className="header-content">
                  <div className="header-text">
                    <h4>Smart Templates</h4>
                    <p>Professional post templates for better engagement</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowTemplates(false)}
                  className="close-picker-btn"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  ×
                </motion.button>
              </motion.div>
              
              <motion.div 
                className="templates-grid-compact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {templates.slice(0, 6).map((template, index) => (
                  <motion.button
                    key={template.id}
                    onClick={() => useTemplate(template)}
                    className="template-chip"
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      delay: 0.3 + (index * 0.1), 
                      duration: 0.4,
                      type: "spring",
                      stiffness: 400,
                      damping: 20
                    }}
                    whileHover={{ 
                      scale: 1.08, 
                      y: -4,
                      rotateY: 5,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      if (target) target.style.zIndex = "10";
                    }}
                    onHoverEnd={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      if (target) target.style.zIndex = "1";
                    }}
                    title={template.description}
                  >
                    <motion.div 
                      className="template-chip-icon"
                      whileHover={{ 
                        scale: 1.2,
                        rotate: 5,
                        transition: { duration: 0.2 }
                      }}
                    >
                      {template.icon}
                    </motion.div>
                    <motion.span 
                      className="template-chip-name"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + (index * 0.1) }}
                    >
                      {template.name}
                    </motion.span>
                    <motion.div
                      className="template-hover-effect"
                      initial={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.button>
                ))}
              </motion.div>
              
              <motion.div 
                className="templates-quick-actions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <motion.button
                  onClick={() => setContent("🚀 Just launched something amazing! Stay tuned for updates... #Launch #Exciting #NewBeginnings")}
                  className="quick-action-chip"
                  whileHover={{ 
                    scale: 1.05, 
                    x: 5,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <TrendingUp size={16} />
                  </motion.div>
                  Quick Launch
                </motion.button>
                <motion.button
                  onClick={() => setContent("💡 Lightbulb moment! [Share your idea here]\n\nWhat do you think? Would love to hear your thoughts! #Ideas #Innovation #Brainstorming")}
                  className="quick-action-chip"
                  whileHover={{ 
                    scale: 1.05, 
                    x: 5,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Lightbulb size={16} />
                  </motion.div>
                  Share Idea
                </motion.button>
                <motion.button
                  onClick={() => setContent("🎯 Goal update: [Your goal]\n\nProgress: [Current status]\n\nWhat's your biggest goal right now? #Goals #Progress #Motivation")}
                  className="quick-action-chip"
                  whileHover={{ 
                    scale: 1.05, 
                    x: 5,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Target size={16} />
                  </motion.div>
                  Goal Update
                </motion.button>
              </motion.div>
              
              {/* Enhanced Background Effects */}
              <motion.div
                className="template-background-effects"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <div className="floating-particle particle-1" />
                <div className="floating-particle particle-2" />
                <div className="floating-particle particle-3" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post Submit Section */}
        <div className="post-submit-section">
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
      </motion.div>
    </div>
  );
};

export default PostForm;