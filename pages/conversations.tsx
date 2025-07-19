import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import ConversationHistory from "../components/ConversationHistory";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { STORAGE_KEYS, DEFAULT_BASE_URL } from "../lib/utils/config";

const ConversationsPage: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState<string>("");

  // Initialize base URL from config
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL);
      const defaultUrl = DEFAULT_BASE_URL;
      setBaseUrl(storedUrl || defaultUrl);
    }
  }, []);

  const handleProjectSelect = (projectId: string) => {
    console.log("Selected project:", projectId);
    // You could navigate to a detailed view or do something else with the selected project
  };

  // Prepare right actions for the header
  const rightActions = (
    <Link
      href="/create-agent"
      className="text-sm py-1.5 px-3 bg-[#238636] text-white rounded hover:bg-[#2ea043] transition-colors"
    >
      + Create New Agent
    </Link>
  );

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col h-screen">
      <Head>
        <title>Conversation History - IntentKit Sandbox</title>
        <meta
          name="description"
          content="View your agent creation conversation history"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <Header
        title="Conversation History"
        backLink={{
          href: "/",
          label: "← Back to Sandbox",
        }}
        rightActions={rightActions}
        showBaseUrl={true}
        baseUrl={baseUrl}
      />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full px-4 py-6">
          <ConversationHistory
            baseUrl={baseUrl}
            onProjectSelect={handleProjectSelect}
          />
        </div>
      </main>

      {/* Footer */}
      <Footer baseUrl={baseUrl} showConnectionStatus={true} />
    </div>
  );
};

export default ConversationsPage;
