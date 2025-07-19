/**
 * Utility to check if the IntentKit server is running and properly configured
 */

import { Agent, ServerCheckResult, ValidationIssue } from '../types';
import apiClient from './apiClient';

export const checkServerConnection = async (): Promise<ServerCheckResult> => {
  try {
    const result = await apiClient.checkServerStatus();
    return {
      status: 'connected' as const,
      agents_available: result.agents_available
    };
  } catch (error: any) {
    console.error('Server connection check failed:', error);
    
    let errorMessage = 'Cannot connect to Nation API';
    if (error.response?.status === 401) {
      errorMessage = 'Authentication required. Please sign in.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      status: 'error',
      agents_available: false,
      error: errorMessage
    };
  }
};

export const checkAgentStatus = async (agentId: string): Promise<{
  exists: boolean;
  error?: string;
  agent?: Agent;
}> => {
  try {
    const agent = await apiClient.getAgent(agentId);
    
    return {
      exists: true,
      agent: agent
    };
  } catch (error: any) {
    console.error(`Agent ${agentId} check failed:`, error);
    
    let errorMessage = `Agent ${agentId} not found`;
    if (error.response?.status === 401) {
      errorMessage = 'Authentication required to check agent status';
    } else if (error.response?.status === 404) {
      errorMessage = `Agent ${agentId} does not exist`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      exists: false,
      error: errorMessage
    };
  }
};

export const validateAgentConfig = (agentData: Agent | undefined): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  
  if (!agentData) {
    return [{ type: 'error', message: 'No agent data available' }];
  }
  
  // Check required fields
  if (!agentData.name) {
    issues.push({ type: 'error', message: 'Agent name is required', field: 'name' });
  }
  
  if (!agentData.purpose) {
    issues.push({ type: 'error', message: 'Agent purpose is required', field: 'purpose' });
  }
  
  if (!agentData.personality) {
    issues.push({ type: 'error', message: 'Agent personality is required', field: 'personality' });
  }
  
  if (!agentData.principles) {
    issues.push({ type: 'error', message: 'Agent principles is required', field: 'principles' });
  }
  
  // Check skills configuration
  if (agentData.skills) {
    Object.entries(agentData.skills).forEach(([skillName, skillConfig]) => {
      if (!skillConfig.enabled) {
        return; // Skip disabled skills
      }
      
      // Check for common skill configuration issues
      if (skillName === 'token' && skillConfig.enabled) {
        if (!skillConfig.api_key) {
          issues.push({ 
            type: 'warning', 
            message: 'Token skill is missing api_key', 
            field: `skills.${skillName}.api_key` 
          });
        }
        
        if (!skillConfig.api_key_provider || skillConfig.api_key_provider !== 'agent_owner') {
          issues.push({ 
            type: 'warning', 
            message: 'Token skill api_key_provider should be set to "agent_owner"', 
            field: `skills.${skillName}.api_key_provider` 
          });
        }
        
        // Check states
        const tokenStates = skillConfig.states || {};
        ['token_price', 'token_search', 'token_analytics'].forEach(state => {
          if (tokenStates[state] !== 'public') {
            issues.push({ 
              type: 'warning', 
              message: `Token skill state "${state}" should be set to "public"`, 
              field: `skills.${skillName}.states.${state}` 
            });
          }
        });
      }
      
      // Check portfolio skill
      if (skillName === 'portfolio' && skillConfig.enabled) {
        if (!skillConfig.api_key) {
          issues.push({ 
            type: 'warning', 
            message: 'Portfolio skill is missing api_key', 
            field: `skills.${skillName}.api_key` 
          });
        }
        
        if (!skillConfig.api_key_provider || skillConfig.api_key_provider !== 'agent_owner') {
          issues.push({ 
            type: 'warning', 
            message: 'Portfolio skill api_key_provider should be set to "agent_owner"', 
            field: `skills.${skillName}.api_key_provider` 
          });
        }
        
        // Check states
        const portfolioStates = skillConfig.states || {};
        [
          'wallet_net_worth', 'wallet_stats', 'token_balances', 
          'wallet_history', 'wallet_nfts', 'wallet_defi_positions', 
          'wallet_profitability', 'wallet_swaps'
        ].forEach(state => {
          if (portfolioStates[state] !== 'public') {
            issues.push({ 
              type: 'warning', 
              message: `Portfolio skill state "${state}" should be set to "public"`, 
              field: `skills.${skillName}.states.${state}` 
            });
          }
        });
      }
    });
  }
  
  // Check model compatibility
  if (agentData.model) {
    const supportedModels = [
      'gpt-4o', 'gpt-4o-mini', 'deepseek-chat', 'deepseek-reasoner', 
      'grok-2', 'eternalai', 'reigent', 'venice-uncensored'
    ];
    
    if (!supportedModels.includes(agentData.model)) {
      issues.push({ 
        type: 'warning', 
        message: `Model "${agentData.model}" may not be supported by Nation API`, 
        field: 'model' 
      });
    }
  }
  
  return issues;
}; 