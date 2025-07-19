// API Configuration
export const DEFAULT_BASE_URL = "https://sandbox.service.crestal.dev";
export const LOCAL_BASE_URL = "http://127.0.0.1:8000";

// Default configuration
export const DEFAULT_CONFIG = {
  BASE_URL: DEFAULT_BASE_URL,
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  IS_DEV: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_IS_DEV === 'true',
};

// Storage keys for localStorage
export const STORAGE_KEYS = {
  BASE_URL: "nation_base_url",
  AUTH_TOKEN: "nation_auth_token",
  USER_SESSION: "nation_user_session",
  USERNAME: "intentkit_username", // Legacy, to be removed
  PASSWORD: "intentkit_password", // Legacy, to be removed
};

// Social Links
export const SOCIAL_LINKS = {
  TWITTER: "https://x.com/crestalnetwork",
  GITHUB: "https://github.com/crestalnetwork",
  DISCORD: "https://discord.gg/crestal",
  TELEGRAM: "https://t.me/crestal_network",
  WEBSITE: "https://www.crestal.network/",
  DOCS: "https://docs.crestal.network/",
};

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: "/health",
  AGENTS: "/agents",
  AGENT_BY_ID: (id: string) => `/agents/${id}`,
  AGENT_VALIDATE: "/agent/validate",
  AGENT_GENERATE: "/agent/generate",
  AGENT_CHATS: (agentId: string) => `/agents/${agentId}/chats`,
  AGENT_CHAT_BY_ID: (agentId: string, chatId: string) => `/agents/${agentId}/chats/${chatId}`,
  AGENT_CHAT_MESSAGES: (agentId: string, chatId: string) => `/agents/${agentId}/chats/${chatId}/messages`,
  AGENT_CHAT_MESSAGE_BY_ID: (agentId: string, chatId: string, messageId: string) => `/agents/${agentId}/chats/${chatId}/messages/${messageId}`,
  AGENT_CHAT_MESSAGE_RETRY: (agentId: string, chatId: string, messageId: string) => `/agents/${agentId}/chats/${chatId}/messages/${messageId}/retry`,
  USER_AGENTS: "/user/agents",
  USER_AGENT_BY_ID: (id: string) => `/user/agents/${id}`,
  SKILLS: "/skills",
  LLMS: "/llms",
  AGENT_SCHEMA: "/agent-schema",
  SKILL_ICON: (skill: string, icon: string, ext: string) => `/metadata/skills/${skill}/${icon}.${ext}`,
}; 