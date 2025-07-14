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
}

#[derive(CandidType, Serialize, Deserialize, Clone)]
struct User {
    handle: String,
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
}

impl Storable for Update {
    fn to_bytes(&self) -> Cow<[u8]> { candid::encode_one(self).unwrap().into() }
    fn from_bytes(bytes: Cow<[u8]>) -> Self { candid::decode_one(bytes.as_ref()).unwrap() }
    const BOUND: Bound = Bound::Unbounded;
}

#[derive(CandidType, Serialize, Clone)]
struct StableVec<T: CandidType + Serialize + DeserializeOwned + Clone + Storable>(Vec<T>);

impl<T: CandidType + Serialize + DeserializeOwned + Clone + Storable> Storable for StableVec<T> {
    fn to_bytes(&self) -> Cow<[u8]> { candid::encode_one(&self.0).unwrap().into() }
    fn from_bytes(bytes: Cow<[u8]>) -> Self { Self(candid::decode_one(bytes.as_ref()).unwrap()) }
    const BOUND: Bound = Bound::Unbounded;
}

#[update()]
fn register(handle: String) {
    let caller = ic_cdk::caller();
    USERS.with(|users| users.borrow_mut().insert(caller, User { handle }));
}

#[query]
fn get_user(principal: Principal) -> Option<User> {
    USERS.with(|users| users.borrow().get(&principal).clone())
}

#[update()]
fn post_update(content: String) -> u64 {
    let caller = ic_cdk::caller();
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
    };
    UPDATES.with(|updates| updates.borrow_mut().insert(id, update));
    id
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

#[pre_upgrade]
fn pre_upgrade() {
    // Save state before upgrade
}

#[post_upgrade]
fn post_upgrade() {}