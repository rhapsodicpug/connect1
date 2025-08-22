use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::time;
use ic_cdk_macros::*;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::storable::Bound;
use ic_stable_structures::{Cell, DefaultMemoryImpl, StableBTreeMap, Storable};
use std::borrow::Cow;
use std::cell::RefCell;
use serde::de::DeserializeOwned;
use serde::Serialize;

type Memory = VirtualMemory<DefaultMemoryImpl>;

const USERS_MEMORY_ID: MemoryId = MemoryId::new(0);
const FOLLOWS_MEMORY_ID: MemoryId = MemoryId::new(1);
const UPDATES_MEMORY_ID: MemoryId = MemoryId::new(2);
const NEXT_UPDATE_ID_MEMORY_ID: MemoryId = MemoryId::new(3);
const FOLLOWERS_MEMORY_ID: MemoryId = MemoryId::new(4);
const LIKES_MEMORY_ID: MemoryId = MemoryId::new(5);
const REPOSTS_MEMORY_ID: MemoryId = MemoryId::new(6);
const MODERATION_MEMORY_ID: MemoryId = MemoryId::new(7);
const WARNINGS_MEMORY_ID: MemoryId = MemoryId::new(8);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static USERS: RefCell<StableBTreeMap<Principal, User, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MEMORY_ID)),
        )
    );

    static FOLLOWS: RefCell<StableBTreeMap<Principal, StableVec<Principal>, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(FOLLOWS_MEMORY_ID)),
        )
    );

    static FOLLOWERS: RefCell<StableBTreeMap<Principal, StableVec<Principal>, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(FOLLOWERS_MEMORY_ID)),
        )
    );

    static UPDATES: RefCell<StableBTreeMap<u64, Update, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(UPDATES_MEMORY_ID)),
        )
    );

    static NEXT_UPDATE_ID: RefCell<Cell<u64, Memory>> = RefCell::new(
        Cell::init(MEMORY_MANAGER.with(|m| m.borrow().get(NEXT_UPDATE_ID_MEMORY_ID)), 0)
            .expect("Cannot initialize next update ID")
    );

    static LIKES: RefCell<StableBTreeMap<u64, StableVec<Principal>, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(LIKES_MEMORY_ID)),
        )
    );

    static REPOSTS: RefCell<StableBTreeMap<u64, StableVec<Principal>, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(REPOSTS_MEMORY_ID)),
        )
    );

    static MODERATION_FLAGS: RefCell<StableBTreeMap<u64, ModerationFlag, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MODERATION_MEMORY_ID)),
        )
    );

    static USER_WARNINGS: RefCell<StableBTreeMap<Principal, StableVec<Warning>, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(WARNINGS_MEMORY_ID)),
        )
    );
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
struct User {
    handle: String,
    is_verified: bool,
    warning_count: u32,
    is_suspended: bool,
    suspension_until: Option<u64>,
}

impl Storable for User {
    fn to_bytes(&self) -> Cow<[u8]> { candid::encode_one(self).unwrap().into() }
    fn from_bytes(bytes: Cow<[u8]>) -> Self { candid::decode_one(bytes.as_ref()).unwrap() }
    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
struct Update {
    id: u64,
    author: Principal,
    content: String,
    timestamp: u64,
    likes: u64,
    reposts: u64,
    quotes: u64,
    original_post_id: Option<u64>, // For reposts and quotes
    quote_content: Option<String>, // For quotes
    is_moderated: bool,
    moderation_reason: Option<String>,
    is_hidden: bool,
}

impl Storable for Update {
    fn to_bytes(&self) -> Cow<[u8]> { candid::encode_one(self).unwrap().into() }
    fn from_bytes(bytes: Cow<[u8]>) -> Self { candid::decode_one(bytes.as_ref()).unwrap() }
    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
struct ModerationFlag {
    update_id: u64,
    flagged_by: Principal,
    reason: String,
    severity: ModerationSeverity,
    timestamp: u64,
    is_resolved: bool,
}

impl Storable for ModerationFlag {
    fn to_bytes(&self) -> Cow<[u8]> { candid::encode_one(self).unwrap().into() }
    fn from_bytes(bytes: Cow<[u8]>) -> Self { candid::decode_one(bytes.as_ref()).unwrap() }
    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
struct Warning {
    id: u64,
    reason: String,
    severity: ModerationSeverity,
    timestamp: u64,
    expires_at: Option<u64>,
}

impl Storable for Warning {
    fn to_bytes(&self) -> Cow<[u8]> { candid::encode_one(self).unwrap().into() }
    fn from_bytes(bytes: Cow<[u8]>) -> Self { candid::decode_one(bytes.as_ref()).unwrap() }
    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone, PartialEq)]
enum ModerationSeverity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(CandidType, Serialize, Clone)]
struct StableVec<T: CandidType + Serialize + DeserializeOwned + Clone + Storable>(Vec<T>);

impl<T: CandidType + Serialize + DeserializeOwned + Clone + Storable> Storable for StableVec<T> {
    fn to_bytes(&self) -> Cow<[u8]> { candid::encode_one(&self.0).unwrap().into() }
    fn from_bytes(bytes: Cow<[u8]>) -> Self { Self(candid::decode_one(bytes.as_ref()).unwrap()) }
    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
struct AIInsights {
    content_score: u8, // 0-100
    engagement_prediction: EngagementPrediction,
    audience_reach: u32,
    optimization_suggestions: Vec<String>,
    trending_topics: Vec<String>,
    best_posting_time: String,
    content_category: ContentCategory,
    sentiment_score: f32, // -1.0 to 1.0
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
struct EngagementPrediction {
    predicted_likes: u32,
    predicted_shares: u32,
    predicted_comments: u32,
    viral_potential: f32, // 0.0 to 1.0
}

#[derive(CandidType, Serialize, Deserialize, Clone, PartialEq)]
enum ContentCategory {
    Personal,
    Professional,
    Entertainment,
    News,
    Educational,
    Promotional,
    Question,
    Story,
    Opinion,
    Other,
}

// AI Content Analysis function
fn analyze_content_ai(content: &str) -> AIInsights {
    let lower_content = content.to_lowercase();
    
    // Content Quality Score (0-100)
    let mut content_score = 50; // Base score
    
    // Length analysis
    let word_count = content.split_whitespace().count();
    if word_count >= 10 && word_count <= 50 {
        content_score += 20; // Optimal length
    } else if word_count > 50 {
        content_score += 10; // Good length but might be too long
    }
    
    // Engagement keywords analysis
    let engagement_keywords = vec![
        "what", "how", "why", "when", "where", "who",
        "think", "believe", "feel", "love", "hate", "amazing",
        "incredible", "awesome", "terrible", "question", "help",
        "advice", "experience", "story", "opinion", "fact"
    ];
    
    for keyword in &engagement_keywords {
        if lower_content.contains(keyword) {
            content_score += 2;
        }
    }
    
    // Hashtag analysis
    let hashtag_count = content.matches('#').count();
    if hashtag_count > 0 && hashtag_count <= 3 {
        content_score += 10; // Good hashtag usage
    } else if hashtag_count > 3 {
        content_score -= 5; // Too many hashtags
    }
    
    // Question analysis
    if content.contains('?') {
        content_score += 15; // Questions drive engagement
    }
    
    // Emoji analysis (simplified - count common emoji characters)
    let emoji_chars = "😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🤩🥳😏😒😞😔😟😕🙁☹️😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🤗🤔🤭🤫🤥😶😐😑😯😦😧😮😲🥱😴🤤😪😵🤐🥴🤢🤮🤧😷🤒🤕";
    let emoji_count = content.chars().filter(|c| emoji_chars.contains(*c)).count();
    if emoji_count > 0 && emoji_count <= 3 {
        content_score += 5; // Good emoji usage
    } else if emoji_count > 3 {
        content_score -= 5; // Too many emojis
    }
    
    // Sentiment analysis (basic)
    let positive_words = vec!["good", "great", "amazing", "love", "happy", "excellent", "wonderful"];
    let negative_words = vec!["bad", "terrible", "hate", "awful", "horrible", "disgusting"];
    
    let mut sentiment_score: f32 = 0.0;
    for word in &positive_words {
        if lower_content.contains(word) {
            sentiment_score += 0.1;
        }
    }
    for word in &negative_words {
        if lower_content.contains(word) {
            sentiment_score -= 0.1;
        }
    }
    sentiment_score = sentiment_score.max(-1.0).min(1.0);
    
    // Content category detection
    let content_category = if lower_content.contains("work") || lower_content.contains("job") || lower_content.contains("career") {
        ContentCategory::Professional
    } else if lower_content.contains("movie") || lower_content.contains("game") || lower_content.contains("fun") {
        ContentCategory::Entertainment
    } else if lower_content.contains("news") || lower_content.contains("update") || lower_content.contains("announcement") {
        ContentCategory::News
    } else if lower_content.contains("learn") || lower_content.contains("study") || lower_content.contains("education") {
        ContentCategory::Educational
    } else if lower_content.contains("buy") || lower_content.contains("sale") || lower_content.contains("promotion") {
        ContentCategory::Promotional
    } else if content.contains('?') {
        ContentCategory::Question
    } else if lower_content.contains("story") || lower_content.contains("happened") || lower_content.contains("experience") {
        ContentCategory::Story
    } else if lower_content.contains("think") || lower_content.contains("believe") || lower_content.contains("opinion") {
        ContentCategory::Opinion
    } else {
        ContentCategory::Personal
    };
    
    // Engagement prediction
    let base_engagement = content_score as f32 / 100.0;
    let predicted_likes = ((base_engagement * 50.0) + (sentiment_score * 20.0) + (if content.contains('?') { 15.0 } else { 0.0 })) as u32;
    let predicted_shares = ((base_engagement * 20.0) + (sentiment_score * 10.0)) as u32;
    let predicted_comments = ((base_engagement * 30.0) + (if content.contains('?') { 25.0 } else { 0.0 })) as u32;
    
    let viral_potential = (base_engagement + sentiment_score.abs() * 0.3 + if hashtag_count > 0 { 0.2 } else { 0.0 }).min(1.0);
    
    // Audience reach estimation
    let audience_reach = if content_score > 80 { 10000 } else if content_score > 60 { 5000 } else if content_score > 40 { 2000 } else { 500 };
    
    // Optimization suggestions
    let mut suggestions = Vec::new();
    if word_count < 10 {
        suggestions.push("Consider adding more details to make your post more engaging".to_string());
    }
    if word_count > 100 {
        suggestions.push("Your post is quite long. Consider breaking it into multiple posts".to_string());
    }
    if hashtag_count == 0 {
        suggestions.push("Add 1-3 relevant hashtags to increase discoverability".to_string());
    }
    if hashtag_count > 3 {
        suggestions.push("Too many hashtags can look spammy. Use 1-3 relevant ones".to_string());
    }
    if !content.contains('?') && content_score < 70 {
        suggestions.push("Ask a question to encourage engagement and comments".to_string());
    }
    if emoji_count == 0 {
        suggestions.push("Add 1-2 relevant emojis to make your post more visually appealing".to_string());
    }
    if emoji_count > 3 {
        suggestions.push("Too many emojis can be distracting. Use 1-2 relevant ones".to_string());
    }
    
    // Trending topics detection
    let mut trending_topics = Vec::new();
    let current_trends = vec!["technology", "ai", "blockchain", "crypto", "gaming", "sports", "music", "food", "travel"];
    for trend in &current_trends {
        if lower_content.contains(trend) {
            trending_topics.push(trend.to_string());
        }
    }
    
    // Best posting time (simplified)
    let best_posting_time = if content_category == ContentCategory::Professional {
        "Tuesday-Thursday, 9-11 AM".to_string()
    } else if content_category == ContentCategory::Entertainment {
        "Friday-Sunday, 7-9 PM".to_string()
    } else {
        "Monday-Friday, 12-2 PM".to_string()
    };
    
    // Cap the content score at 100
    content_score = content_score.min(100);
    
    AIInsights {
        content_score,
        engagement_prediction: EngagementPrediction {
            predicted_likes,
            predicted_shares,
            predicted_comments,
            viral_potential,
        },
        audience_reach,
        optimization_suggestions: suggestions,
        trending_topics,
        best_posting_time,
        content_category,
        sentiment_score,
    }
}

// Content filtering function using basic keyword detection
fn filter_content(content: &str) -> (bool, Option<String>, ModerationSeverity) {
    let lower_content = content.to_lowercase();
    
    // Define harmful keywords and their severity levels
    let harmful_keywords = vec![
        ("hate", ModerationSeverity::High),
        ("violence", ModerationSeverity::High),
        ("harassment", ModerationSeverity::High),
        ("bully", ModerationSeverity::Medium),
        ("spam", ModerationSeverity::Low),
        ("scam", ModerationSeverity::Medium),
        ("fake", ModerationSeverity::Low),
        ("misinformation", ModerationSeverity::Medium),
    ];
    
    for (keyword, severity) in harmful_keywords {
        if lower_content.contains(keyword) {
            return (true, Some(format!("Content contains inappropriate keyword: {}", keyword)), severity);
        }
    }
    
    // Check for excessive caps (shouting)
    let caps_count = content.chars().filter(|c| c.is_uppercase()).count();
    let total_chars = content.chars().filter(|c| c.is_alphabetic()).count();
    
    if total_chars > 10 && caps_count as f64 / total_chars as f64 > 0.7 {
        return (true, Some("Content appears to be shouting (excessive caps)".to_string()), ModerationSeverity::Low);
    }
    
    // Check for repetitive characters
    let mut prev_char = ' ';
    let mut repeat_count = 0;
    for c in content.chars() {
        if c == prev_char && c != ' ' {
            repeat_count += 1;
            if repeat_count > 3 {
                return (true, Some("Content contains excessive repetitive characters".to_string()), ModerationSeverity::Low);
            }
        } else {
            repeat_count = 0;
        }
        prev_char = c;
    }
    
    (false, None, ModerationSeverity::Low)
}

#[update()]
fn post_update(content: String) -> u64 {
    let caller = ic_cdk::caller();
    
    // Check if user is suspended
    let user = USERS.with(|users| users.borrow().get(&caller).clone());
    let mut user_data = user.clone();
    
    if let Some(ref user_info) = user_data {
        if user_info.is_suspended {
            if let Some(suspension_until) = user_info.suspension_until {
                if time() < suspension_until {
                    return 0; // User is suspended
                }
            }
        }
    }
    
    // Content filtering
    let (is_flagged, reason, severity) = filter_content(&content);
    
    let id = NEXT_UPDATE_ID.with(|next_id| {
        let id = *next_id.borrow().get();
        next_id.borrow_mut().set(id + 1).unwrap();
        id
    });
    
    let update = Update {
        id,
        author: caller,
        content,
        timestamp: time(),
        likes: 0,
        reposts: 0,
        quotes: 0,
        original_post_id: None,
        quote_content: None,
        is_moderated: is_flagged,
        moderation_reason: reason.clone(),
        is_hidden: is_flagged,
    };
    
    UPDATES.with(|updates| updates.borrow_mut().insert(id, update));
    
    // If content is flagged, add warning to user
    if is_flagged {
        USER_WARNINGS.with(|warnings| {
            let mut user_warnings = warnings.borrow_mut();
            let mut current = user_warnings.get(&caller).unwrap_or(StableVec(vec![])).0;
            current.push(Warning {
                id: time(), // Use timestamp as warning ID
                reason: reason.unwrap_or("Content flagged by automatic moderation".to_string()),
                severity,
                timestamp: time(),
                expires_at: Some(time() + 86400_000_000_000), // 24 hours
            });
            user_warnings.insert(caller, StableVec(current));
        });
        
        // Update user warning count
        if let Some(ref mut user_info) = user_data {
            user_info.warning_count += 1;
            USERS.with(|users| users.borrow_mut().insert(caller, user_info.clone()));
        }
    }
    
    id
}

#[update()]
fn register(handle: String) {
    let caller = ic_cdk::caller();
    USERS.with(|users| users.borrow_mut().insert(caller, User { 
        handle, 
        is_verified: false, 
        warning_count: 0, 
        is_suspended: false, 
        suspension_until: None 
    }));
}

#[query]
fn get_user(principal: Principal) -> Option<User> {
    USERS.with(|users| users.borrow().get(&principal).clone())
}

#[update()]
fn repost_update(original_post_id: u64) -> u64 {
    let caller = ic_cdk::caller();
    let original_update = UPDATES.with(|updates| updates.borrow().get(&original_post_id).clone());
    
    if let Some(original) = original_update {
        let id = NEXT_UPDATE_ID.with(|next_id| {
            let id = *next_id.borrow().get();
            next_id.borrow_mut().set(id + 1).unwrap();
            id
        });
        
        let repost = Update {
            id,
            author: caller,
            content: format!("Reposted: {}", original.content),
            timestamp: time(),
            likes: 0,
            reposts: 0,
            quotes: 0,
            original_post_id: Some(original_post_id),
            quote_content: None,
            is_moderated: false,
            moderation_reason: None,
            is_hidden: false,
        };
        
        UPDATES.with(|updates| updates.borrow_mut().insert(id, repost));
        
        // Update repost count on original post
        let mut original_mut = original.clone();
        original_mut.reposts += 1;
        UPDATES.with(|updates| updates.borrow_mut().insert(original_post_id, original_mut));
        
        id
    } else {
        0 // Return 0 if original post doesn't exist
    }
}

#[update()]
fn quote_update(original_post_id: u64, quote_content: String) -> u64 {
    let caller = ic_cdk::caller();
    let original_update = UPDATES.with(|updates| updates.borrow().get(&original_post_id).clone());
    
    if let Some(original) = original_update {
        let id = NEXT_UPDATE_ID.with(|next_id| {
            let id = *next_id.borrow().get();
            next_id.borrow_mut().set(id + 1).unwrap();
            id
        });
        
        let original_content = original.content.clone();
        
        let quote = Update {
            id,
            author: caller,
            content: format!("Quote: {}", quote_content),
            timestamp: time(),
            likes: 0,
            reposts: 0,
            quotes: 0,
            original_post_id: Some(original_post_id),
            quote_content: Some(original_content),
            is_moderated: false,
            moderation_reason: None,
            is_hidden: false,
        };
        
        UPDATES.with(|updates| updates.borrow_mut().insert(id, quote));
        
        // Update quote count on original post
        let mut original_mut = original.clone();
        original_mut.quotes += 1;
        UPDATES.with(|updates| updates.borrow_mut().insert(original_post_id, original_mut));
        
        id
    } else {
        0 // Return 0 if original post doesn't exist
    }
}

#[update()]
fn flag_update(update_id: u64, reason: String, severity: ModerationSeverity) -> bool {
    let caller = ic_cdk::caller();
    let update = UPDATES.with(|updates| updates.borrow().get(&update_id).clone());
    
    if let Some(update_data) = update {
        if update_data.is_moderated {
            return false; // Cannot flag a moderated update
        }
        
        // Generate a unique flag ID using timestamp
        let flag_id = time();
        let severity_clone = severity.clone();
        
        MODERATION_FLAGS.with(|flags| {
            flags.borrow_mut().insert(flag_id, ModerationFlag {
                update_id,
                flagged_by: caller,
                reason: reason.clone(),
                severity,
                timestamp: time(),
                is_resolved: false,
            });
        });
        
        // Add to user's warnings
        USER_WARNINGS.with(|warnings| {
            let mut user_warnings = warnings.borrow_mut();
            let mut current = user_warnings.get(&update_data.author).unwrap_or(StableVec(vec![])).0;
            current.push(Warning {
                id: flag_id,
                reason,
                severity: severity_clone,
                timestamp: time(),
                expires_at: Some(time() + 86400_000_000_000), // 24 hours
            });
            user_warnings.insert(update_data.author, StableVec(current));
        });
        
        return true;
    }
    false
}

#[update()]
fn resolve_flag(flag_id: u64) -> bool {
    MODERATION_FLAGS.with(|flags| {
        let mut flags_map = flags.borrow_mut();
        if let Some(flag) = flags_map.get(&flag_id).clone() {
            let mut resolved_flag = flag;
            resolved_flag.is_resolved = true;
            flags_map.insert(flag_id, resolved_flag);
            return true;
        }
        false
    })
}

#[update()]
fn moderate_update(update_id: u64, reason: String, _severity: ModerationSeverity) -> bool {
    let update = UPDATES.with(|updates| updates.borrow().get(&update_id).clone());
    
    if let Some(mut update_data) = update {
        update_data.is_moderated = true;
        update_data.moderation_reason = Some(reason);
        update_data.is_hidden = true; // Hide the update
        UPDATES.with(|updates| updates.borrow_mut().insert(update_id, update_data));
        return true;
    }
    false
}

#[update()]
fn unmoderate_update(update_id: u64) -> bool {
    let update = UPDATES.with(|updates| updates.borrow().get(&update_id).clone());
    
    if let Some(mut update_data) = update {
        update_data.is_moderated = false;
        update_data.moderation_reason = None;
        update_data.is_hidden = false; // Unhide the update
        UPDATES.with(|updates| updates.borrow_mut().insert(update_id, update_data));
        return true;
    }
    false
}

#[update()]
fn follow(user: Principal) {
    let caller = ic_cdk::caller();
    FOLLOWS.with(|follows| {
        let mut follows_map = follows.borrow_mut();
        let mut current = follows_map.get(&caller).unwrap_or(StableVec(vec![])).0;
        if !current.contains(&user) {
            current.push(user);
        }
        follows_map.insert(caller, StableVec(current));
    });
    FOLLOWERS.with(|followers| {
        let mut followers_map = followers.borrow_mut();
        let mut current = followers_map.get(&user).unwrap_or(StableVec(vec![])).0;
        if !current.contains(&caller) {
            current.push(caller);
        }
        followers_map.insert(user, StableVec(current));
    });
}

#[update()]
fn like_update(update_id: u64) -> bool {
    let caller = ic_cdk::caller();
    let mut liked = false;
    
    LIKES.with(|likes| {
        let mut likes_map = likes.borrow_mut();
        let mut current_likes = likes_map.get(&update_id).unwrap_or(StableVec(vec![])).0;
        
        if current_likes.contains(&caller) {
            // Unlike
            current_likes.retain(|&x| x != caller);
            liked = false;
        } else {
            // Like
            current_likes.push(caller);
            liked = true;
        }
        
        likes_map.insert(update_id, StableVec(current_likes));
    });
    
    // Update the like count in the update
    UPDATES.with(|updates| {
        let mut updates_map = updates.borrow_mut();
        if let Some(mut update) = updates_map.get(&update_id).clone() {
            if liked {
                update.likes += 1;
            } else {
                update.likes = update.likes.saturating_sub(1);
            }
            updates_map.insert(update_id, update);
        }
    });
    
    liked
}

#[query]
fn has_liked_update(update_id: u64, user: Principal) -> bool {
    LIKES.with(|likes| {
        likes.borrow().get(&update_id).unwrap_or(StableVec(vec![])).0.contains(&user)
    })
}

#[query]
fn has_reposted_update(update_id: u64, user: Principal) -> bool {
    REPOSTS.with(|reposts| {
        reposts.borrow().get(&update_id).unwrap_or(StableVec(vec![])).0.contains(&user)
    })
}

#[query()]
fn get_timeline(page: u64, page_size: u64) -> Vec<Update> {
    let caller = ic_cdk::caller();
    let followed = FOLLOWS.with(|follows| follows.borrow().get(&caller).unwrap_or(StableVec(vec![])).0);
    let mut timeline: Vec<Update> = UPDATES.with(|updates| {
        updates.borrow().iter().filter_map(|(_, update)| if followed.contains(&update.author) || update.author == caller { Some(update.clone()) } else { None }).collect()
    });
    timeline.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    let start = (page * page_size) as usize;
    
    // Check if start index is beyond the vector length
    if start >= timeline.len() {
        return vec![];
    }
    
    let end = std::cmp::min(start + page_size as usize, timeline.len());
    timeline[start..end].to_vec()
}

#[query]
fn search_updates(keyword: String) -> Vec<Update> {
    UPDATES.with(|updates| {
        updates.borrow().iter().filter_map(|(_, update)| if update.content.to_lowercase().contains(&keyword.to_lowercase()) { Some(update.clone()) } else { None }).collect()
    })
}

#[query]
fn search_users(handle_prefix: String) -> Vec<(Principal, User)> {
    USERS.with(|users| {
        users.borrow().iter().filter_map(|(p, u)| if u.handle.to_lowercase().starts_with(&handle_prefix.to_lowercase()) { Some((p.clone(), u.clone())) } else { None }).collect()
    })
}

#[query]
fn get_followers(principal: Principal) -> Vec<Principal> {
    FOLLOWERS.with(|followers| followers.borrow().get(&principal).unwrap_or(StableVec(vec![])).0)
}

#[query]
fn get_following(principal: Principal) -> Vec<Principal> {
    FOLLOWS.with(|follows| follows.borrow().get(&principal).unwrap_or(StableVec(vec![])).0)
}

#[query]
fn get_user_updates(principal: Principal, page: u64, page_size: u64) -> Vec<Update> {
    let mut user_updates: Vec<Update> = UPDATES.with(|updates| {
        updates.borrow().iter().filter_map(|(_, update)| if update.author == principal { Some(update.clone()) } else { None }).collect()
    });
    user_updates.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    let start = (page * page_size) as usize;
    
    // Check if start index is beyond the vector length
    if start >= user_updates.len() {
        return vec![];
    }
    
    let end = std::cmp::min(start + page_size as usize, user_updates.len());
    user_updates[start..end].to_vec()
}

// New moderation query functions
#[query]
fn get_user_warnings(principal: Principal) -> Vec<Warning> {
    USER_WARNINGS.with(|warnings| {
        warnings.borrow().get(&principal).unwrap_or(StableVec(vec![])).0
    })
}

#[query]
fn get_flagged_content() -> Vec<(u64, ModerationFlag)> {
    MODERATION_FLAGS.with(|flags| {
        flags.borrow().iter()
            .filter_map(|(id, flag)| {
                if !flag.is_resolved {
                    Some((id, flag.clone()))
                } else {
                    None
                }
            })
            .collect()
    })
}

#[query]
fn get_moderated_updates() -> Vec<Update> {
    UPDATES.with(|updates| {
        updates.borrow().iter()
            .filter_map(|(_, update)| {
                if update.is_moderated {
                    Some(update.clone())
                } else {
                    None
                }
            })
            .collect()
    })
}

#[update()]
fn suspend_user(principal: Principal, duration_hours: u64) -> bool {
    let user = USERS.with(|users| users.borrow().get(&principal).clone());
    
    if let Some(mut user_data) = user {
        user_data.is_suspended = true;
        user_data.suspension_until = Some(time() + (duration_hours * 3600_000_000_000)); // Convert hours to nanoseconds
        USERS.with(|users| users.borrow_mut().insert(principal, user_data));
        true
    } else {
        false
    }
}

#[update()]
fn unsuspend_user(principal: Principal) -> bool {
    let user = USERS.with(|users| users.borrow().get(&principal).clone());
    
    if let Some(mut user_data) = user {
        user_data.is_suspended = false;
        user_data.suspension_until = None;
        USERS.with(|users| users.borrow_mut().insert(principal, user_data));
        true
    } else {
        false
    }
}

#[update()]
fn verify_user(principal: Principal) -> bool {
    let user = USERS.with(|users| users.borrow().get(&principal).clone());
    
    if let Some(mut user_data) = user {
        user_data.is_verified = true;
        USERS.with(|users| users.borrow_mut().insert(principal, user_data));
        true
    } else {
        false
    }
}

// New AI Insights endpoint
#[query]
fn get_ai_insights(content: String) -> AIInsights {
    analyze_content_ai(&content)
}

#[pre_upgrade]
fn pre_upgrade() {
    // Save state before upgrade
}

#[post_upgrade]
fn post_upgrade() {}