import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { showToast } from "../lib/utils/toast";
import AgentCreator from "../components/AgentCreator";
import TemplateSelector from "../components/TemplateSelector";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { AgentTemplate } from "../lib/utils/templates";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { STORAGE_KEYS, DEFAULT_BASE_URL } from "../lib/utils/config";

const CreateAgentPage: React.FC = () => {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] =
    useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<
    AgentTemplate | undefined
  >(undefined);
  const { isAuthenticated } = useSupabaseAuth();

  // Initialize base URL from config
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL);
      const defaultUrl = DEFAULT_BASE_URL;
      setBaseUrl(storedUrl || defaultUrl);
    }
  }, []);

  const handleAgentCreated = (agent: Record<string, any>) => {
    console.log("Agent deployed successfully:", agent);
    const agentName = agent.name || "Unnamed Agent";
    setSuccessMessage(`🎉 Agent "${agentName}" deployed successfully!`);

    // Redirect to main page after 3 seconds to see the new agent
    setTimeout(() => {
      router.push("/");
    }, 3000);
  };

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
  };

  const handleShowTemplateSelector = () => {
    setShowTemplateSelector(true);
  };

  const handleGetApiKey = () => {
    showToast.info("🔑 API Key management coming soon!");
  };

  // Prepare right actions for the header
  const rightActions = (
    <>
      <button
        onClick={handleShowTemplateSelector}
        className="text-sm py-1.5 px-3 bg-[#238636] text-white rounded hover:bg-[#2ea043] transition-colors"
      >
        📋 Use Template
      </button>
      {successMessage && (
        <div className="text-green-400 text-sm font-medium py-1 px-2 bg-green-400/10 rounded border border-green-400/20">
          {successMessage}
        </div>
      )}
      <button
        onClick={handleGetApiKey}
        className="text-sm py-1.5 px-3 bg-[#0969da] text-white rounded hover:bg-[#0550ae] transition-colors"
      >
        🔑 Get API Key
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col h-screen">
      <Head>
        <title>Create Agent - IntentKit Sandbox</title>
        <meta
          name="description"
          content="Create a new IntentKit agent with AI assistance"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <Header
        title="Create New Agent"
        backLink={{
          href: "/",
          label: "← Back to Sandbox",
        }}
        rightActions={rightActions}
        showBaseUrl={false}
        baseUrl={baseUrl}
      />

      {/* Authentication Warning */}
      {!isAuthenticated && (
        <div className="bg-[#fef3cd]/10 border-b border-[#fef3cd]/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[#fef3cd] text-sm">
              Please sign in to create agents. You can use the Quick Creator for
              a streamlined experience.
            </p>
            <Link
              href="/mini-app"
              className="text-sm py-1.5 px-3 bg-[#238636] text-white rounded hover:bg-[#2ea043] transition-colors"
            >
              Go to Quick Creator
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          <AgentCreator
            baseUrl={baseUrl}
            onAgentCreated={handleAgentCreated}
            currentProjectId={undefined}
            selectedTemplate={selectedTemplate}
          />
        </div>
      </main>

      {/* Template Selector Modal */}
      <TemplateSelector
        isVisible={showTemplateSelector}
        onTemplateSelect={handleTemplateSelect}
        onClose={() => setShowTemplateSelector(false)}
      />

      {/* Footer */}
      <Footer baseUrl={baseUrl} showConnectionStatus={true} />
    </div>
  );
};

export default CreateAgentPage;
