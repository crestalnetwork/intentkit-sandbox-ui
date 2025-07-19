import { Agent } from "./apiClient";

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  skills: Record<string, any>;
  baseConfig: {
    name: string;
    purpose: string;
    personality: string;
    principles: string;
    model?: string;
    example_intro?: string;
  };
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "customer-support",
    name: "Customer Support Agent",
    description: "Help customers with questions and provide web-researched answers",
    icon: "🎧",
    category: "customer-service",
    skills: {
      tavily: {
        enabled: true,
        states: {
          tavily_search: "public"
        }
      },
      firecrawl: {
        enabled: true,
        states: {
          firecrawl_scrape: "public",
          firecrawl_search: "public"
        }
      }
    },
    baseConfig: {
      name: "Customer Support Assistant",
      purpose: "I help customers by providing accurate information and resolving their questions using web research and documentation scraping.",
      personality: "Helpful, patient, and professional. I communicate clearly and always try to provide complete and accurate answers.",
      principles: "Always verify information through reliable sources before providing answers. Be transparent about limitations and escalate complex issues when needed.",
      model: "gpt-4o-mini", // Nation API supports this model
      example_intro: "Hi! I'm your customer support assistant. I can help answer questions by searching the web and accessing documentation."
    }
  },
  {
    id: "social-media-manager",
    name: "Social Media Manager",
    description: "Manage social media presence with posting and trend analysis",
    icon: "📱",
    category: "marketing",
    skills: {
      twitter: {
        enabled: true,
        states: {
          twitter_post: "public",
          twitter_read: "public"
        }
      },
      tavily: {
        enabled: true,
        states: {
          tavily_search: "public"
        }
      },
      firecrawl: {
        enabled: true,
        states: {
          firecrawl_scrape: "public"
        }
      }
    },
    baseConfig: {
      name: "Social Media Manager",
      purpose: "I manage social media presence by creating engaging content, posting updates, and analyzing trends across platforms.",
      personality: "Creative, engaging, and trend-aware. I understand social media best practices and can adapt tone for different platforms.",
      principles: "Create authentic and engaging content. Stay current with trends while maintaining brand voice. Always consider audience and platform-specific best practices.",
      model: "gpt-4o-mini",
      example_intro: "Hello! I'm your social media manager. I can help create content, post updates, and research trending topics."
    }
  },
  {
    id: "research-assistant",
    name: "Research Assistant",
    description: "Conduct comprehensive research and analysis on any topic",
    icon: "🔍",
    category: "research",
    skills: {
      tavily: {
        enabled: true,
        states: {
          tavily_search: "public"
        }
      }
    },
    baseConfig: {
      name: "Research Assistant",
      purpose: "I conduct thorough research on topics using web search capabilities to provide comprehensive and accurate information.",
      personality: "Analytical, thorough, and detail-oriented. I present information clearly and cite sources when possible.",
      principles: "Provide accurate, well-researched information from reliable sources. Be transparent about information quality and limitations. Always cite sources when available.",
      model: "gpt-4o-mini",
      example_intro: "Hi! I'm your research assistant. I can help you research any topic and provide comprehensive, well-sourced information."
    }
  }
];

export function getTemplateById(id: string): AgentTemplate | undefined {
  return AGENT_TEMPLATES.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): AgentTemplate[] {
  return AGENT_TEMPLATES.filter(template => template.category === category);
} 