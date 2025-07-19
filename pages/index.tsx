import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { showToast } from "../lib/utils/toast";
import ChatInterface from "../components/ChatInterface";
import AgentsList from "../components/AgentsList";
import AgentDetail from "../components/AgentDetail";
import Settings from "../components/Settings";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Agent } from "../lib/types";
import apiClient from "../lib/utils/apiClient";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { STORAGE_KEYS, DEFAULT_BASE_URL } from "../lib/utils/config";
import logger from "../lib/utils/logger";
import theme from "../lib/utils/theme";

const Home: React.FC = (): JSX.Element => {
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [viewMode, setViewMode] = useState<"chat" | "details">("chat");
  const { isAuthenticated } = useSupabaseAuth();

  logger.component("mounted", "Home");

  // Initialize base URL from config
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL);
      const defaultUrl = DEFAULT_BASE_URL;
      setBaseUrl(storedUrl || defaultUrl);

      logger.info(
        "Base URL initialized",
        { storedUrl, defaultUrl, finalUrl: storedUrl || defaultUrl },
        "Home.useEffect"
      );

      // Update API client base URL
      apiClient.updateBaseUrl(storedUrl || defaultUrl);
    }
  }, []);

  // Refresh the selected agent data
  const refreshSelectedAgent = useCallback(async () => {
    if (selectedAgent && isAuthenticated) {
      logger.info(
        "Refreshing selected agent",
        { agentId: selectedAgent.id },
        "Home.refreshSelectedAgent"
      );
      try {
        // Use the new API client to fetch updated agent data
        const updatedAgent = await apiClient.getAgent(selectedAgent.id!);
        setSelectedAgent(updatedAgent);
        logger.info(
          "Agent refreshed successfully",
          { agentId: selectedAgent.id },
          "Home.refreshSelectedAgent"
        );
      } catch (error: any) {
        logger.error(
          "Failed to refresh agent",
          { agentId: selectedAgent.id, error: error.message },
          "Home.refreshSelectedAgent"
        );
        console.error("Error refreshing agent data:", error);
        if (error.response?.status === 401) {
          showToast.error("Authentication expired. Please sign in again.");
        }
      }
    }
  }, [selectedAgent, isAuthenticated]);

  // Set up a global refreshSelectedAgent function
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).refreshSelectedAgent = refreshSelectedAgent;

      // Set up a listener for the refreshAgentsList event
      const handleRefreshAgentsList = () => {
        logger.debug(
          "Agents list refresh event received",
          {},
          "Home.handleRefreshAgentsList"
        );
        // When agents list is refreshed, also refresh the selected agent
        setTimeout(refreshSelectedAgent, 100);
      };

      window.addEventListener(
        "refreshAgentsListComplete",
        handleRefreshAgentsList
      );

      return () => {
        delete (window as any).refreshSelectedAgent;
        window.removeEventListener(
          "refreshAgentsListComplete",
          handleRefreshAgentsList
        );
      };
    }
  }, [refreshSelectedAgent]);

  // Store base URL in localStorage when changed
  const handleBaseUrlChange = (newUrl: string) => {
    logger.info(
      "Base URL changed",
      { oldUrl: baseUrl, newUrl },
      "Home.handleBaseUrlChange"
    );
    setBaseUrl(newUrl);
    localStorage.setItem(STORAGE_KEYS.BASE_URL, newUrl);
    apiClient.updateBaseUrl(newUrl);
  };

  const handleAgentSelect = (agent: Agent) => {
    logger.info(
      "Agent selected",
      { agentId: agent.id, agentName: agent.name },
      "Home.handleAgentSelect"
    );
    setSelectedAgent(agent);
    // Default to chat view when selecting an agent
    setViewMode("chat");
  };

  const toggleViewMode = () => {
    const newMode = viewMode === "chat" ? "details" : "chat";
    logger.info(
      "View mode toggled",
      { oldMode: viewMode, newMode },
      "Home.toggleViewMode"
    );
    setViewMode(newMode);
  };

  const handleGetApiKey = () => {
    logger.info("API key button clicked", {}, "Home.handleGetApiKey");
    showToast.info("API Key management coming soon!");
  };

  // Prepare right actions for the header
  const rightActions = (
    <>
      <Link
        href="/create-agent"
        className={`inline-flex items-center space-x-2 text-sm py-2 px-4 bg-[${theme.colors.primary.main}] text-[${theme.colors.text.onPrimary}] font-medium rounded-lg hover:bg-[${theme.colors.primary.hover}] hover:shadow-lg hover:shadow-[${theme.colors.primary.shadow}] transition-all duration-200`}
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>Create Agent</span>
      </Link>
    </>
  );

  return (
    <div
      className={`min-h-screen bg-[${theme.colors.background.primary}] flex flex-col h-screen`}
    >
      <Head>
        <title>IntentKit Sandbox</title>
        <meta name="description" content="Chat with your IntentKit agents" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <Header
        title="IntentKit Sandbox"
        rightActions={rightActions}
        showBaseUrl={false}
        baseUrl={baseUrl}
        onBaseUrlChange={handleBaseUrlChange}
      />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-full h-full px-4 py-3">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Sidebar - Agent List */}
            <div className="col-span-12 sm:col-span-5 md:col-span-4 lg:col-span-3 h-full overflow-hidden agent-list-container">
              <AgentsList
                baseUrl={baseUrl}
                onAgentSelect={handleAgentSelect}
                selectedAgentId={selectedAgent?.id}
              />
            </div>

            {/* Main content - Chat or Agent Details */}
            <div className="col-span-12 sm:col-span-7 md:col-span-8 lg:col-span-9 h-full overflow-hidden">
              {selectedAgent ? (
                viewMode === "chat" ? (
                  <ChatInterface
                    baseUrl={baseUrl}
                    agentName={selectedAgent.id!}
                    onToggleViewMode={toggleViewMode}
                    viewMode={viewMode}
                  />
                ) : (
                  <AgentDetail agent={selectedAgent} />
                )
              ) : (
                <div
                  className={`bg-[${theme.colors.background.primary}] rounded-xl border border-[${theme.colors.border.primary}] p-6 text-center text-[${theme.colors.text.tertiary}] flex flex-col items-center justify-center h-full`}
                >
                  <svg
                    className={`h-16 w-16 text-[${theme.colors.text.tertiary}]`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <h3 className="mt-6 text-lg font-medium text-[#c9d1d9]">
                    Select an Agent to Start
                  </h3>
                  <p className="mt-3 max-w-md mx-auto text-base">
                    {isAuthenticated
                      ? "Choose an agent from the list to start chatting."
                      : "Please sign in to view and chat with agents."}
                  </p>
                  {!isAuthenticated && (
                    <Link
                      href="/mini-app"
                      className="mt-4 inline-flex items-center px-4 py-2 bg-[#238636] text-white text-sm rounded-lg hover:bg-[#2ea043] transition-colors"
                    >
                      Sign In & Get Started
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer baseUrl={baseUrl} showConnectionStatus={true} />
    </div>
  );
};

export default Home;
