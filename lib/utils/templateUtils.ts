import { AgentTemplate } from "./templates";

export function templateToPrompt(template: AgentTemplate): string {
  const skillsList = Object.keys(template.skills).join(", ");
  
  return `Create an agent with EXACTLY these specifications - do not add any additional skills:

Name: ${template.baseConfig.name}
Purpose: ${template.baseConfig.purpose}
Personality: ${template.baseConfig.personality}
Principles: ${template.baseConfig.principles}

IMPORTANT: Enable ONLY these skills and no others: ${skillsList}

Do not add token, twitter, http, carv, system, or any other skills unless they are explicitly listed above. Use only the specified skills: ${skillsList}

Configure the agent exactly as specified with only these skills enabled and configured appropriately.`;
}

export function templateToAgentConfig(template: AgentTemplate, userWalletAddress?: string): Record<string, any> {
  return {
    ...template.baseConfig,
    skills: template.skills,
    owner: userWalletAddress,
    mode: "private", // Default to private for template-based agents
    fee_percentage: 0,
    wallet_provider: "cdp",
    network_id: "base-mainnet",
    cdp_network_id: "base-mainnet",
  };
} 