import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory, canisterId } from '../../../declarations/social_360_backend';

// Get canister ID - use hardcoded value if environment variable is not available
const getCanisterId = () => {
  // Try to get from environment variable first
  if (canisterId) {
    return canisterId;
  }
  // Fallback to hardcoded canister ID for local development
  return 'u6s2n-gx777-77774-qaaba-cai';
};

// Helper to get principal from context or mock (deprecated except for guest mode)
// Remove usage in favor of passing principal from user context
export async function getPrincipal(): Promise<string> {
  // This should only be used for guest mode
  console.log('Using mock principal for guest mode');
  return '2vxsx-fae';
}

// Helper to get an authenticated actor (Plug or default)
export async function getActor() {
  const canisterIdValue = getCanisterId();
  const localHost = 'http://localhost:4943';
  
  console.log('Creating actor with canister ID:', canisterIdValue);
  console.log('Using host:', localHost);
  
  // For local development, always use unauthenticated agent
  // Plug Wallet is designed for mainnet, not local development
  console.log('Using unauthenticated agent for local development');
  
  // Create a simple agent for local development
  const agent = new HttpAgent({ 
    host: localHost
  });
  
  // For local development, we need to handle certificate issues
  // This is a workaround for local testing
  console.log('Configuring agent for local development...');
  
  // Try to fetch the root key for local development
  try {
    await agent.fetchRootKey();
    console.log('Root key fetched successfully');
  } catch (error) {
    console.warn('Could not fetch root key, continuing anyway:', error);
  }
  
  return Actor.createActor(idlFactory, { agent, canisterId: canisterIdValue });
}

// Helper to convert string to Principal
function stringToPrincipal(principalString: string): Principal {
  try {
    return Principal.fromText(principalString);
  } catch (error) {
    console.error('Invalid principal format:', principalString);
    throw new Error('Invalid principal format');
  }
}

// Backend API wrappers
export async function register(handle: string) {
  const actor = await getActor();
  return actor.register(handle);
}

export async function getUser(principal: string) {
  const actor = await getActor();
  const principalObj = stringToPrincipal(principal);
  return actor.get_user(principalObj);
}

export async function postUpdate(content: string) {
  const actor = await getActor();
  return actor.post_update(content);
}

export async function repostUpdate(postId: bigint) {
  const actor = await getActor();
  return actor.repost_update(postId);
}

export async function quoteUpdate(postId: bigint, quoteContent: string) {
  const actor = await getActor();
  return actor.quote_update(postId, quoteContent);
}

export async function follow(principal: string) {
  const actor = await getActor();
  const principalObj = stringToPrincipal(principal);
  return actor.follow(principalObj);
}

export async function likeUpdate(postId: bigint) {
  const actor = await getActor();
  return actor.like_update(postId);
}

export async function hasLikedUpdate(postId: bigint, principal: string) {
  const actor = await getActor();
  const principalObj = stringToPrincipal(principal);
  return actor.has_liked_update(postId, principalObj);
}

export async function hasRepostedUpdate(postId: bigint, principal: string) {
  const actor = await getActor();
  const principalObj = stringToPrincipal(principal);
  return actor.has_reposted_update(postId, principalObj);
}

export async function getTimeline(page: number, pageSize: number) {
  const actor = await getActor();
  return actor.get_timeline(BigInt(page), BigInt(pageSize));
}

export async function searchUpdates(keyword: string) {
  const actor = await getActor();
  return actor.search_updates(keyword);
}

export async function searchUsers(handlePrefix: string) {
  const actor = await getActor();
  return actor.search_users(handlePrefix);
}

export async function getUserUpdates(principal: string, page: number, pageSize: number) {
  const actor = await getActor();
  const principalObj = stringToPrincipal(principal);
  return actor.get_user_updates(principalObj, BigInt(page), BigInt(pageSize));
}

export async function getFollowers(principal: string) {
  const actor = await getActor();
  const principalObj = stringToPrincipal(principal);
  return actor.get_followers(principalObj);
}

export async function getFollowing(principal: string) {
  const actor = await getActor();
  const principalObj = stringToPrincipal(principal);
  return actor.get_following(principalObj);
}

// New moderation functions
export async function flagUpdate(postId: bigint, reason: string, severity: string) {
  const actor = await getActor();
  return actor.flag_update(postId, reason, severity);
}

export async function resolveFlag(flagId: bigint) {
  const actor = await getActor();
  return actor.resolve_flag(flagId);
}

export async function moderateUpdate(postId: bigint, reason: string, severity: string) {
  const actor = await getActor();
  return actor.moderate_update(postId, reason, severity);
}

export async function unmoderateUpdate(postId: bigint) {
  const actor = await getActor();
  return actor.unmoderate_update(postId);
}

export async function getUserWarnings(principal: string) {
  const actor = await getActor();
  const principalObj = stringToPrincipal(principal);
  return actor.get_user_warnings(principalObj);
}

export async function getFlaggedContent() {
  const actor = await getActor();
  return actor.get_flagged_content();
}

export async function getModeratedUpdates() {
  const actor = await getActor();
  return actor.get_moderated_updates();
}

export async function suspendUser(principal: string, durationHours: bigint) {
  const actor = await getActor();
  const principalObj = stringToPrincipal(principal);
  return actor.suspend_user(principalObj, durationHours);
}

export async function unsuspendUser(principal: string) {
  const actor = await getActor();
  const principalObj = stringToPrincipal(principal);
  return actor.unsuspend_user(principalObj);
}

export async function verifyUser(principal: string) {
  const actor = await getActor();
  const principalObj = stringToPrincipal(principal);
  return actor.verify_user(principalObj);
}

// AI Insights function
export async function getAIInsights(content: string) {
  const actor = await getActor();
  return actor.get_ai_insights(content);
} 