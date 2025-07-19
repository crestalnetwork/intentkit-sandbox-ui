// Re-export Agent type from API client to maintain consistency
export type { Agent, ChatThread, ChatMessage, SendMessageRequest, PaginatedResponse } from '../utils/apiClient';
import type { AgentTemplate } from '../utils/templates';
import type { Agent } from '../utils/apiClient';

export interface Skill {
  enabled: boolean;
  api_key?: string;
  api_key_provider?: string;
  states?: Record<string, string>;
  [key: string]: any; // For any additional properties
}

// Agent Generation API types
export interface AgentGenerateRequest {
  prompt: string;
  existing_agent?: any;
  user_id?: string;
  project_id?: string;
}

export interface AgentGenerateResponse {
  agent: Record<string, any>;
  project_id: string;
  summary: string;
  tags: Array<{ id: number }>;
}

export interface ConversationMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface ExtendedMessage {
  id: string;
  content: string;
  sender: "user" | "agent" | "system";
  timestamp: string;
  skillCalls?: Array<{
    id: string;
    name: string;
    parameters: Record<string, any>;
    success: boolean;
    response?: string;
    error_message?: string;
    credit_event_id?: string;
    credit_cost?: string;
  }>;
}

export interface SettingsProps {
  baseUrl: string;
  onBaseUrlChange: (url: string) => void;
}

export interface StatusMessage {
  type: "success" | "error" | "info" | "warning";
  message: string;
}

export interface ConversationProject {
  project_id: string;
  user_id?: string;
  created_at?: string;
  last_activity?: string;
  message_count: number;
  messages?: ConversationMessage[];
  summary?: string;
  title?: string;
  first_message?: ConversationMessage;
  conversation_history?: ConversationMessage[];
}

export interface GenerationsListResponse {
  projects: ConversationProject[];
  total_count: number;
}

// UI Component Props
export interface AgentsListProps {
  baseUrl: string;
  onAgentSelect: (agent: Agent) => void;
  selectedAgentId?: string;
}

export interface ChatInterfaceProps {
  baseUrl: string;
  agentName: string;
  onToggle?: (isOpen: boolean) => void;
  isOpen?: boolean;
  onToggleViewMode?: () => void;
  viewMode?: "chat" | "details";
}

export interface AgentDetailProps {
  agent: Agent;
}

export interface AgentCreatorProps {
  baseUrl: string;
  selectedTemplate?: AgentTemplate;
  currentProjectId?: string;
  onAgentCreated?: (agent: any) => void;
}

export interface TemplateCreatorProps {
  onTemplateSelect?: (template: AgentTemplate) => void;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isJson?: boolean;
  isError?: boolean;
  rawData?: any;
}

// Server check types
export interface ServerCheckResult {
  status: 'connected' | 'disconnected' | 'error';
  agents_available: boolean;
  error?: string;
  agent_count?: number;
}

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  field?: string;
} 