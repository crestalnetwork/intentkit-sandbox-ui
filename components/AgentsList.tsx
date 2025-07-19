import React, { useState, useEffect } from "react";
import { AgentsListProps, Agent } from "../lib/types";
import apiClient from "../lib/utils/apiClient";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { showToast } from "../lib/utils/toast";
import logger from "../lib/utils/logger";
import theme from "../lib/utils/theme";

const AgentsList: React.FC<AgentsListProps> = ({
  baseUrl,
  onAgentSelect,
  selectedAgentId,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { isAuthenticated } = useSupabaseAuth();

  logger.component("mounted", "AgentsList", {
    baseUrl,
    selectedAgentId,
    isAuthenticated,
  });

  useEffect(() => {
    logger.info(
      "Base URL changed, fetching agents",
      { baseUrl },
      "AgentsList.useEffect"
    );
    fetchAgents();
  }, [baseUrl]);

  useEffect(() => {
    logger.info(
      "Authentication status changed",
      { isAuthenticated },
      "AgentsList.useEffect"
    );
    fetchAgents();
  }, [isAuthenticated]);

  const fetchAgents = async () => {
    logger.info(
      "Starting agent fetch",
      { isAuthenticated, baseUrl },
      "AgentsList.fetchAgents"
    );
    setLoading(true);
    setError(null);

    try {
      if (!isAuthenticated) {
        logger.warn(
          "Not authenticated, clearing agents list",
          {},
          "AgentsList.fetchAgents"
        );
        setAgents([]);
        setError("Please sign in to view agents");
        return;
      }

      logger.debug("Calling API to get agents", {}, "AgentsList.fetchAgents");
      const response = await apiClient.getAgents({ limit: 50 });
      logger.info(
        "Agents fetched successfully",
        {
          count: response.data.length,
          hasMore: response.has_more,
        },
        "AgentsList.fetchAgents"
      );

      setAgents(response.data);

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent("refreshAgentsListComplete"));
      logger.debug(
        "Agents list refresh event dispatched",
        {},
        "AgentsList.fetchAgents"
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch agents";
      logger.error(
        "Failed to fetch agents",
        {
          error: errorMessage,
          status: err.response?.status,
          isAuthenticated,
        },
        "AgentsList.fetchAgents"
      );

      console.error("Error fetching agents:", err);
      setError(errorMessage);

      if (err.response?.status === 401) {
        showToast.error("Authentication expired. Please sign in again.");
      } else {
        showToast.error(`Failed to load agents: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshAgents = () => {
    logger.info("Manual refresh triggered", {}, "AgentsList.refreshAgents");
    fetchAgents();
  };

  const handleAgentClick = (agent: Agent) => {
    logger.info(
      "Agent selected",
      {
        agentId: agent.id,
        agentName: agent.name,
        previousSelection: selectedAgentId,
      },
      "AgentsList.handleAgentClick"
    );
    onAgentSelect(agent);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    logger.debug(
      "Search query changed",
      {
        query: query,
        length: query.length,
      },
      "AgentsList.handleSearchChange"
    );
    setSearchQuery(query);
  };

  // Filter agents based on search query
  const filteredAgents = agents.filter((agent) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      agent.name?.toLowerCase().includes(searchLower) ||
      agent.purpose?.toLowerCase().includes(searchLower) ||
      agent.id?.toLowerCase().includes(searchLower)
    );
  });

  // Log filtered results when search changes
  useEffect(() => {
    if (searchQuery) {
      logger.debug(
        "Search results filtered",
        {
          query: searchQuery,
          totalAgents: agents.length,
          filteredCount: filteredAgents.length,
        },
        "AgentsList.searchFilter"
      );
    }
  }, [searchQuery, agents.length, filteredAgents.length]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      logger.warn(
        "Invalid date format",
        { dateString },
        "AgentsList.formatDate"
      );
      return "Invalid date";
    }
  };

  if (!isAuthenticated) {
    logger.debug("Rendering unauthenticated state", {}, "AgentsList.render");
    return (
      <div className="bg-[#161b22] border-r border-[#30363d] w-80 flex flex-col">
        <div className="p-4 border-b border-[#30363d]">
          <h2 className="text-lg font-semibold text-[#c9d1d9] mb-3">Agents</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-[#8b949e] text-sm mb-3">
              Please sign in to view agents
            </p>
            <div className="text-xs text-[#8b949e]">
              Use the sign in button in the header to get started
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    logger.debug("Rendering error state", { error }, "AgentsList.render");
    return (
      <div
        className={`bg-[${theme.colors.background.primary}] border-r border-[${theme.colors.border.primary}] w-full min-w-80 max-w-none flex flex-col h-full`}
      >
        <div
          className={`p-4 border-b border-[${theme.colors.border.primary}] flex-shrink-0`}
        >
          <h2 className="text-lg font-semibold text-white mb-3">Agents</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-xs">
            <div className="w-12 h-12 bg-[#f85149]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-[#f85149]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-[#f85149] text-sm mb-4 leading-relaxed">
              {error}
            </p>
            <button
              onClick={fetchAgents}
              className="text-sm bg-[#238636] text-white px-4 py-2 rounded-md hover:bg-[#2ea043] transition-colors flex items-center space-x-2 mx-auto"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  logger.debug(
    "Rendering agents list",
    {
      loading,
      agentCount: agents.length,
      filteredCount: filteredAgents.length,
      hasSearch: !!searchQuery,
    },
    "AgentsList.render"
  );

  return (
    <div
      className={`bg-[${theme.colors.background.primary}] border-r border-[${theme.colors.border.primary}] w-full min-w-80 max-w-none flex flex-col h-full`}
    >
      <div
        className={`p-4 border-b border-[${theme.colors.border.primary}] flex-shrink-0`}
      >
        <div className="flex justify-between items-center mb-3">
          <h2
            className={`text-lg font-semibold text-[${theme.colors.text.primary}]`}
          >
            Agents
          </h2>
          <button
            onClick={refreshAgents}
            className={`text-xs bg-[${theme.colors.background.tertiary}] text-[${theme.colors.primary.main}] px-3 py-1.5 rounded-lg border border-[${theme.colors.primary.border}] hover:bg-[${theme.colors.primary.light}] hover:border-[${theme.colors.primary.borderHover}] transition-all duration-200 flex items-center space-x-1`}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2.5 bg-black/50 border border-[#d0ff16]/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#d0ff16]/50 focus:border-[#d0ff16] transition-all"
          />
          <svg
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[${theme.colors.text.tertiary}]`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-[${theme.colors.text.tertiary}] hover:text-[${theme.colors.primary.main}] transition-colors`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto agent-list-scroll">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#30363d] border-t-[#58a6ff] mx-auto mb-4"></div>
              <p className="text-[#8b949e] text-sm">Loading agents...</p>
            </div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 bg-[#8b949e]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {searchQuery ? (
                  <svg
                    className="w-8 h-8 text-[#8b949e]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 text-[#8b949e]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>
              <p className="text-[#8b949e] text-sm mb-4 leading-relaxed">
                {searchQuery
                  ? "No agents match your search criteria"
                  : "No agents found"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => {
                    logger.debug(
                      "Clearing search query",
                      {},
                      "AgentsList.clearSearch"
                    );
                    setSearchQuery("");
                  }}
                  className="text-sm text-[#58a6ff] hover:text-[#79c0ff] transition-colors px-4 py-2 rounded-md border border-[#30363d] hover:border-[#58a6ff]"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => handleAgentClick(agent)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedAgentId === agent.id
                    ? "bg-[#0969da] border-[#0969da] text-white shadow-lg transform scale-[1.02]"
                    : "bg-[#21262d] border-[#30363d] text-[#c9d1d9] hover:bg-[#30363d] hover:border-[#58a6ff] hover:transform hover:scale-[1.01]"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold text-sm leading-5 mb-1 truncate">
                      {agent.name || "Unnamed Agent"}
                    </h3>
                    {agent.id && (
                      <span
                        className={`text-xs font-mono ${
                          selectedAgentId === agent.id
                            ? "text-white/70"
                            : "text-[#8b949e]"
                        }`}
                      >
                        {agent.id}
                      </span>
                    )}
                  </div>
                  {agent.model && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                        selectedAgentId === agent.id
                          ? "bg-white/20 text-white"
                          : "bg-[#0d1117] text-[#58a6ff] border border-[#30363d]"
                      }`}
                    >
                      {agent.model}
                    </span>
                  )}
                </div>

                {agent.purpose && (
                  <p
                    className={`text-xs leading-relaxed mb-3 ${
                      selectedAgentId === agent.id
                        ? "text-white/90"
                        : "text-[#8b949e]"
                    }`}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      wordWrap: "break-word",
                    }}
                    title={agent.purpose}
                  >
                    {agent.purpose}
                  </p>
                )}

                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs ${
                      selectedAgentId === agent.id
                        ? "text-white/70"
                        : "text-[#8b949e]"
                    }`}
                  >
                    {formatDate(agent.created_at)}
                  </span>

                  {/* Skills indicator */}
                  {agent.skills &&
                  typeof agent.skills === "object" &&
                  Object.keys(agent.skills).length > 0 ? (
                    <div className="flex items-center space-x-1">
                      <svg
                        className={`w-3 h-3 ${
                          selectedAgentId === agent.id
                            ? "text-white/70"
                            : "text-[#8b949e]"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span
                        className={`text-xs ${
                          selectedAgentId === agent.id
                            ? "text-white/70"
                            : "text-[#8b949e]"
                        }`}
                      >
                        {Object.keys(agent.skills).length} skills
                      </span>
                    </div>
                  ) : (
                    <span
                      className={`text-xs ${
                        selectedAgentId === agent.id
                          ? "text-white/70"
                          : "text-[#8b949e]"
                      }`}
                    >
                      No skills
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentsList;
