import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { DEFAULT_CONFIG, STORAGE_KEYS, API_ENDPOINTS } from './config';
import { showToast } from './toast';
import logger from './logger';

// Agent Generation API types
export interface AgentGenerateRequest {
  prompt: string;
  existing_agent?: Agent;
  user_id: string;
  project_id?: string;
}

export interface AgentGenerateResponse {
  agent: Record<string, any>;
  project_id: string;
  summary: string;
  tags: Array<{ id: number }>;
  autonomous_tasks: Array<Record<string, any>>;
  activated_skills: Array<string>;
}

// Types based on Nation API documentation
export interface Agent {
  id?: string;
  name: string;
  description?: string;
  external_website?: string;
  picture?: string;
  ticker?: string;
  mode?: 'public' | 'private';
  fee_percentage?: number | string;
  purpose: string;
  personality: string;
  principles: string;
  owner?: string;
  upstream_id?: string;
  upstream_extra?: Record<string, any>;
  model?: string;
  prompt?: string;
  prompt_append?: string;
  temperature?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  short_term_memory_strategy?: 'trim' | 'summarize';
  autonomous?: Array<{
    id: string;
    name: string;
    description?: string;
    minutes?: number;
    cron?: string;
    prompt: string;
    enabled?: boolean;
  }>;
  example_intro?: string;
  examples?: Array<{
    name: string;
    description: string;
    prompt: string;
  }>;
  skills?: Record<string, any>;
  wallet_provider?: 'cdp';
  network_id?: string;
  cdp_network_id?: string;
  twitter_entrypoint_enabled?: boolean;
  twitter_entrypoint_prompt?: string;
  twitter_config?: Record<string, any>;
  telegram_entrypoint_enabled?: boolean;
  telegram_entrypoint_prompt?: string;
  telegram_config?: Record<string, any>;
  // Response-only fields
  created_at?: string;
  updated_at?: string;
  slug?: string;
  token_address?: string;
  token_pool?: string;
  cdp_wallet_address?: string;
  has_twitter_linked?: boolean;
  linked_twitter_username?: string;
  linked_twitter_name?: string;
  has_twitter_self_key?: boolean;
  has_telegram_self_key?: boolean;
  linked_telegram_username?: string;
  linked_telegram_name?: string;
  accept_image_input?: boolean;
  accept_image_input_private?: boolean;
}

export interface ChatThread {
  id: string;
  agent_id: string;
  user_id: string;
  summary: string;
  rounds: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  agent_id: string;
  chat_id: string;
  user_id: string;
  author_id: string;
  author_type: 'user' | 'agent' | 'system';
  model?: string;
  thread_type: 'agent';
  reply_to?: string;
  message: string;
  attachments?: Array<{
    type: 'link' | 'image' | 'file';
    url: string;
  }>;
  skill_calls?: Array<{
    id: string;
    name: string;
    parameters: Record<string, any>;
    success: boolean;
    response?: string;
    error_message?: string;
    credit_event_id?: string;
    credit_cost?: string;
  }>;
  input_tokens?: number;
  output_tokens?: number;
  time_cost?: number;
  credit_event_id?: string;
  credit_cost?: string;
  cold_start_cost?: number;
  app_id?: string;
  search_mode?: boolean;
  super_mode?: boolean;
  created_at: string;
}

export interface SendMessageRequest {
  app_id?: string;
  message: string;
  stream?: boolean;
  search_mode?: boolean;
  super_mode?: boolean;
  attachments?: Array<{
    type: 'link' | 'image' | 'file';
    url: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  has_more: boolean;
  next_cursor?: string;
}

// Add health check response interface
export interface HealthResponse {
  status: string;
  timestamp?: string;
}

class ApiClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    // Get base URL from localStorage or use default
    this.baseUrl = this.getBaseUrl();
    logger.info('ApiClient initialized', { baseUrl: this.baseUrl }, 'ApiClient.constructor');
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: DEFAULT_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          logger.debug('Auth token added to request', { url: config.url }, 'ApiClient.requestInterceptor');
        } else {
          logger.warn('No auth token for request', { url: config.url }, 'ApiClient.requestInterceptor');
        }
        logger.apiCall(config.method?.toUpperCase() || 'UNKNOWN', config.url || '', config.data, 'ApiClient');
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error, 'ApiClient.requestInterceptor');
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.apiResponse(
          response.config.method?.toUpperCase() || 'UNKNOWN', 
          response.config.url || '', 
          response.status, 
          response.data, 
          'ApiClient.responseInterceptor'
        );
        return response;
      },
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url;
        logger.error(`API Error ${status}`, { url, error: error.message, response: error.response?.data }, 'ApiClient.responseInterceptor');
        
        if (status === 401) {
          // Clear invalid token
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
          logger.auth('Token expired, cleared auth data', { url });
          showToast.error('Authentication expired. Please sign in again.');
        }
        return Promise.reject(error);
      }
    );
  }

  private getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.BASE_URL) || DEFAULT_CONFIG.BASE_URL;
    }
    return DEFAULT_CONFIG.BASE_URL;
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }
    return null;
  }

  // Update base URL and recreate client
  public updateBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl;
    localStorage.setItem(STORAGE_KEYS.BASE_URL, newBaseUrl);
    this.client.defaults.baseURL = newBaseUrl;
  }

  // Health check
  public async health(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>(API_ENDPOINTS.HEALTH);
    return response.data;
  }

  // Agent Management
  public async createAgent(agent: Agent): Promise<Agent> {
    const response = await this.client.post<Agent>(API_ENDPOINTS.AGENTS, agent);
    return response.data;
  }

  public async getAgents(params?: {
    sort?: 'created_at desc' | 'created_at asc' | 'updated_at desc';
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedResponse<Agent>> {
    const response = await this.client.get<PaginatedResponse<Agent>>(
      API_ENDPOINTS.AGENTS,
      { params }
    );
    return response.data;
  }

  public async getAgent(agentId: string): Promise<Agent> {
    const response = await this.client.get<Agent>(API_ENDPOINTS.AGENT_BY_ID(agentId));
    return response.data;
  }

  public async updateAgent(agentId: string, agent: Partial<Agent>): Promise<Agent> {
    const response = await this.client.patch<Agent>(
      API_ENDPOINTS.AGENT_BY_ID(agentId),
      agent
    );
    return response.data;
  }

  public async validateAgent(agent: Agent): Promise<void> {
    await this.client.post(API_ENDPOINTS.AGENT_VALIDATE, agent);
  }

  public async generateAgent(request: AgentGenerateRequest): Promise<AgentGenerateResponse> {
    const response = await this.client.post<AgentGenerateResponse>(
      API_ENDPOINTS.AGENT_GENERATE,
      request
    );
    return response.data;
  }

  // User Agents
  public async getUserAgents(params?: {
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedResponse<Agent>> {
    const response = await this.client.get<PaginatedResponse<Agent>>(
      API_ENDPOINTS.USER_AGENTS,
      { params }
    );
    return response.data;
  }

  public async getUserAgent(agentId: string): Promise<Agent> {
    const response = await this.client.get<Agent>(API_ENDPOINTS.USER_AGENT_BY_ID(agentId));
    return response.data;
  }

  // Chat Management
  public async createChatThread(agentId: string): Promise<ChatThread> {
    const response = await this.client.post<ChatThread>(
      API_ENDPOINTS.AGENT_CHATS(agentId)
    );
    return response.data;
  }

  public async getChatThreads(agentId: string): Promise<ChatThread[]> {
    // Fixed: API returns array directly, not paginated response
    const response = await this.client.get<ChatThread[]>(
      API_ENDPOINTS.AGENT_CHATS(agentId)
    );
    return response.data;
  }

  public async getChatThread(agentId: string, chatId: string): Promise<ChatThread> {
    logger.apiCall('GET', API_ENDPOINTS.AGENT_CHAT_BY_ID(agentId, chatId), { agentId, chatId }, 'ApiClient.getChatThread');
    try {
      const response = await this.client.get<ChatThread>(
        API_ENDPOINTS.AGENT_CHAT_BY_ID(agentId, chatId)
      );
      logger.apiResponse('GET', API_ENDPOINTS.AGENT_CHAT_BY_ID(agentId, chatId), response.status, response.data, 'ApiClient.getChatThread');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get chat thread', { agentId, chatId, error: error.message }, 'ApiClient.getChatThread');
      throw error;
    }
  }

  public async updateChatThread(
    agentId: string,
    chatId: string,
    updates: { summary: string }
  ): Promise<ChatThread> {
    const response = await this.client.patch<ChatThread>(
      API_ENDPOINTS.AGENT_CHAT_BY_ID(agentId, chatId),
      updates
    );
    return response.data;
  }

  public async deleteChatThread(agentId: string, chatId: string): Promise<void> {
    await this.client.delete(API_ENDPOINTS.AGENT_CHAT_BY_ID(agentId, chatId));
  }

  public async sendMessage(
    agentId: string,
    chatId: string,
    messageData: SendMessageRequest
  ): Promise<ChatMessage[]> {
    const response = await this.client.post<ChatMessage[]>(
      API_ENDPOINTS.AGENT_CHAT_MESSAGES(agentId, chatId),
      messageData
    );
    return response.data;
  }

  public async getChatMessages(
    agentId: string,
    chatId: string,
    params?: {
      cursor?: string;
      limit?: number;
    }
  ): Promise<PaginatedResponse<ChatMessage>> {
    const response = await this.client.get<PaginatedResponse<ChatMessage>>(
      API_ENDPOINTS.AGENT_CHAT_MESSAGES(agentId, chatId),
      { params }
    );
    return response.data;
  }

  public async retryMessage(agentId: string, chatId: string, messageId: string): Promise<ChatMessage[]> {
    const response = await this.client.post<ChatMessage[]>(
      API_ENDPOINTS.AGENT_CHAT_MESSAGE_RETRY(agentId, chatId, messageId)
    );
    return response.data;
  }

  public async getMessage(agentId: string, chatId: string, messageId: string): Promise<ChatMessage> {
    const response = await this.client.get<ChatMessage>(
      API_ENDPOINTS.AGENT_CHAT_MESSAGE_BY_ID(agentId, chatId, messageId)
    );
    return response.data;
  }

  // Metadata
  public async getSkills(): Promise<any[]> {
    const response = await this.client.get<any[]>(API_ENDPOINTS.SKILLS);
    return response.data;
  }

  public async getLLMs(): Promise<any[]> {
    const response = await this.client.get<any[]>(API_ENDPOINTS.LLMS);
    return response.data;
  }

  public async getAgentSchema(): Promise<any> {
    const response = await this.client.get<any>(API_ENDPOINTS.AGENT_SCHEMA);
    return response.data;
  }

  // Server status check for compatibility
  public async checkServerStatus(): Promise<{ status: string; agents_available: boolean }> {
    try {
      const healthResponse = await this.health();
      
      // Try to get agents to check if the API is working
      const agentsResponse = await this.getAgents({ limit: 1 });
      
      return {
        status: 'connected',
        agents_available: agentsResponse.data.length > 0
      };
    } catch (error) {
      throw new Error('Failed to connect to Nation API');
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export for use in components
export default apiClient; 