import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AgentTemplate } from "../lib/utils/templates";
import { templateToAgentConfig } from "../lib/utils/templateUtils";
import { showToast } from "../lib/utils/toast";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import apiClient, { AgentGenerateRequest } from "../lib/utils/apiClient";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { AGENT_TEMPLATES } from "../lib/utils/templates";
import ChatInterface from "../components/ChatInterface";
import { Agent } from "../lib/types";
import logger from "../lib/utils/logger";
import { DEFAULT_BASE_URL } from "../lib/utils/config";

const MiniApp: React.FC = () => {
  const [step, setStep] = useState<"templates" | "creating" | "chat">(
    "templates"
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<AgentTemplate | null>(null);
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { user, isAuthenticated, signIn, signUp } = useSupabaseAuth();
  const router = useRouter();

  // Authentication states for the mini modal
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  logger.component("mounted", "MiniApp", {
    step,
    hasTemplate: !!selectedTemplate,
    templateId: selectedTemplate?.id,
    isAuthenticated,
    userId: user?.id,
  });

  const handleTemplateSelect = (template: AgentTemplate) => {
    logger.info(
      "Template selected in mini-app",
      {
        templateId: template.id,
        templateName: template.name,
      },
      "MiniApp.handleTemplateSelect"
    );

    setSelectedTemplate(template);

    if (!isAuthenticated) {
      logger.warn(
        "User not authenticated, showing auth modal",
        { templateId: template.id },
        "MiniApp.handleTemplateSelect"
      );
      setShowAuthModal(true);
    } else {
      logger.info(
        "User authenticated, proceeding to create agent",
        { templateId: template.id },
        "MiniApp.handleTemplateSelect"
      );
      createAgentFromTemplate(template);
    }
  };

  const createAgentFromTemplate = async (template: AgentTemplate) => {
    if (!isAuthenticated || !user) {
      logger.error(
        "Cannot create agent - not authenticated",
        {
          hasTemplate: !!template,
          isAuthenticated,
          hasUser: !!user,
        },
        "MiniApp.createAgentFromTemplate"
      );
      showToast.error("Please sign in to create agents");
      return;
    }

    logger.info(
      "Starting agent generation from template using API",
      {
        templateId: template.id,
        userId: user.id,
      },
      "MiniApp.createAgentFromTemplate"
    );

    setStep("creating");
    setLoading(true);

    try {
      // Use the generator API to create agent from template description
      const generateRequest: AgentGenerateRequest = {
        prompt: `Create a ${template.name} agent. ${template.description}. This should be a ${template.category} agent.`,
        user_id: user.id,
      };

      const response = await apiClient.generateAgent(generateRequest);

      logger.info(
        "Agent generation successful via API",
        {
          templateId: template.id,
          projectId: response.project_id,
          agentName: response.agent.name,
          skillsCount: response.activated_skills.length,
          userId: user.id,
        },
        "MiniApp.createAgentFromTemplate"
      );

      // Convert the generated agent to our Agent type
      const generatedAgent: Agent = {
        name: response.agent.name || template.name,
        purpose: response.agent.purpose || template.description,
        personality: response.agent.personality || "Helpful and friendly",
        principles: response.agent.principles || "Be accurate and helpful",
        ...response.agent,
        owner: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Set the generated agent config
      setCreatedAgent(generatedAgent);

      logger.info(
        "Agent configuration generated from template via API",
        {
          templateId: template.id,
          agentName: generatedAgent.name,
          userId: user.id,
        },
        "MiniApp.createAgentFromTemplate"
      );

      // Now deploy the agent
      await deployGeneratedAgent(generatedAgent, template);
    } catch (error: any) {
      logger.error(
        "Failed to generate agent from template via API",
        {
          templateId: template.id,
          error: error.message,
          status: error.response?.status,
          userId: user.id,
        },
        "MiniApp.createAgentFromTemplate"
      );

      console.error("Error generating agent:", error);
      setStep("templates");

      let errorMessage = "Failed to generate agent configuration";
      if (error.response?.status === 401) {
        errorMessage = "Authentication expired. Please sign in again.";
      } else if (error.response?.data?.message) {
        errorMessage = `Generation failed: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Generation failed: ${error.message}`;
      }

      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deployGeneratedAgent = async (
    agentData: Agent,
    template: AgentTemplate
  ) => {
    try {
      logger.info(
        "Deploying generated agent",
        {
          agentName: agentData.name,
          templateId: template.id,
          userId: user?.id,
        },
        "MiniApp.deployGeneratedAgent"
      );

      // Deploy the agent using the API
      const deployedAgent = await apiClient.createAgent(agentData);

      logger.info(
        "Agent deployed successfully",
        {
          agentId: deployedAgent.id,
          agentName: deployedAgent.name,
          templateId: template.id,
          userId: user?.id,
        },
        "MiniApp.deployGeneratedAgent"
      );

      setCreatedAgent(deployedAgent);
      setStep("chat");
      showToast.success(`Agent "${deployedAgent.name}" deployed successfully!`);
    } catch (error: any) {
      logger.error(
        "Failed to deploy agent",
        {
          agentName: agentData.name,
          templateId: template.id,
          error: error.message,
          status: error.response?.status,
          userId: user?.id,
        },
        "MiniApp.deployGeneratedAgent"
      );

      console.error("Error deploying agent:", error);
      setStep("templates");

      let errorMessage = "Failed to deploy agent";
      if (error.response?.status === 401) {
        errorMessage = "Authentication expired. Please sign in again.";
      } else if (error.response?.data?.message) {
        errorMessage = `Deployment failed: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Deployment failed: ${error.message}`;
      }

      showToast.error(errorMessage);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      logger.warn(
        "Auth form submitted with missing fields",
        {
          hasEmail: !!email,
          hasPassword: !!password,
        },
        "MiniApp.handleAuth"
      );
      showToast.error("Please fill in all fields");
      return;
    }

    logger.info(
      "Auth attempt from mini-app",
      { email, isSignUp },
      "MiniApp.handleAuth"
    );

    try {
      if (isSignUp) {
        await signUp(email, password);
        logger.info(
          "Sign up successful in mini-app",
          { email },
          "MiniApp.handleAuth"
        );
        showToast.success(
          "Account created! Please check your email for verification."
        );
      } else {
        await signIn(email, password);
        logger.info(
          "Sign in successful in mini-app",
          { email },
          "MiniApp.handleAuth"
        );
        showToast.success("Signed in successfully!");
      }

      setShowAuthModal(false);
      setEmail("");
      setPassword("");

      // After successful auth, create the agent if template is selected
      if (selectedTemplate) {
        logger.info(
          "Creating agent after successful auth",
          { templateId: selectedTemplate.id },
          "MiniApp.handleAuth"
        );
        createAgentFromTemplate(selectedTemplate);
      }
    } catch (error: any) {
      logger.error(
        "Authentication error in mini-app",
        {
          email,
          isSignUp,
          error: error.message,
        },
        "MiniApp.handleAuth"
      );
      showToast.error(error.message || "Authentication failed");
    }
  };

  const handleBackToTemplates = () => {
    logger.info(
      "Navigating back to templates",
      {
        currentStep: step,
        agentId: createdAgent?.id,
      },
      "MiniApp.handleBackToTemplates"
    );
    setStep("templates");
    setSelectedTemplate(null);
    setCreatedAgent(null);
  };

  const handleGoToMainApp = () => {
    logger.info(
      "Navigating to main app",
      {
        agentId: createdAgent?.id,
      },
      "MiniApp.handleGoToMainApp"
    );
    router.push("/");
  };

  const renderTemplateStep = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3 sm:p-4 text-center flex-shrink-0">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#c9d1d9] mb-2">
            Quick Agent Creator
          </h1>
          <p className="text-sm sm:text-base text-[#8b949e]">
            Choose a template to instantly create and chat with an agent
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 pt-0">
        <div className="space-y-3">
          {AGENT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              disabled={loading}
              className="w-full p-3 sm:p-4 bg-[#161b22] border border-[#30363d] rounded-lg hover:bg-[#21262d] hover:border-[#58a6ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="flex items-start space-x-3">
                <span className="text-xl sm:text-2xl flex-shrink-0">
                  {template.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#c9d1d9] mb-1 text-sm sm:text-base">
                    {template.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8b949e] mb-2 line-clamp-2">
                    {template.description}
                  </p>
                  <span className="inline-block px-2 py-1 bg-[#0d1117] text-xs text-[#58a6ff] rounded">
                    {template.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCreatingStep = () => (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#58a6ff] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-[#c9d1d9] mb-2">
            Generating & Deploying Agent
          </h2>
          <p className="text-[#8b949e]">
            Setting up {selectedTemplate?.name}...
          </p>
        </div>
      </div>
    </div>
  );

  const renderChatStep = () => (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="p-2 sm:p-3 border-b border-[#30363d] flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[#c9d1d9] truncate text-sm sm:text-base">
            {createdAgent?.name}
          </h2>
          <p className="text-xs text-[#8b949e] truncate">
            {selectedTemplate?.name} Template
          </p>
        </div>
        <div className="flex space-x-2 flex-shrink-0">
          <button
            onClick={handleBackToTemplates}
            className="text-xs py-1 px-2 sm:py-1.5 sm:px-3 bg-[#21262d] text-[#c9d1d9] rounded border border-[#30363d] hover:bg-[#30363d] whitespace-nowrap"
          >
            New Agent
          </button>
          <button
            onClick={handleGoToMainApp}
            className="text-xs py-1 px-2 sm:py-1.5 sm:px-3 bg-[#0969da] text-white rounded hover:bg-[#0550ae] whitespace-nowrap"
          >
            Full App
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden min-h-0">
        {createdAgent && (
          <ChatInterface
            baseUrl={DEFAULT_BASE_URL}
            agentName={createdAgent.id!}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[#0d1117] flex flex-col overflow-hidden">
      <Head>
        <title>Quick Agent Creator</title>
        <meta
          name="description"
          content="Create and chat with agents instantly"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>

      {/* Header */}
      <Header
        title="Quick Creator"
        showBaseUrl={false}
        rightActions={
          step === "chat" ? (
            <button
              onClick={handleGoToMainApp}
              className="text-sm py-1.5 px-3 bg-[#238636] text-white rounded hover:bg-[#2ea043]"
            >
              Full App
            </button>
          ) : undefined
        }
      />

      {/* Main content - takes up remaining space */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        {step === "templates" && renderTemplateStep()}
        {step === "creating" && renderCreatingStep()}
        {step === "chat" && renderChatStep()}
      </main>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 sm:p-6 w-full max-w-sm mx-2">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-[#c9d1d9]">
                {isSignUp ? "Create Account" : "Sign In"}
              </h2>
              <button
                onClick={() => {
                  logger.debug(
                    "Auth modal closed",
                    {},
                    "MiniApp.closeAuthModal"
                  );
                  setShowAuthModal(false);
                }}
                className="text-[#8b949e] hover:text-[#c9d1d9] text-xl"
              >
                ×
              </button>
            </div>

            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-[#0969da]/10 border border-[#0969da]/20 rounded">
              <p className="text-[#58a6ff] text-xs sm:text-sm">
                Sign in to create and chat with your {selectedTemplate?.name}{" "}
                agent
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#c9d1d9] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 sm:p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] text-sm focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff]"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#c9d1d9] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 sm:p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] text-sm focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff]"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 sm:py-2 px-4 bg-[#238636] text-white rounded hover:bg-[#2ea043] transition-colors font-medium"
              >
                {isSignUp ? "Create Account" : "Sign In"}
              </button>
            </form>

            <div className="mt-3 sm:mt-4 text-center">
              <button
                onClick={() => {
                  logger.debug(
                    "Auth mode toggled in mini-app",
                    {
                      newMode: !isSignUp ? "signUp" : "signIn",
                    },
                    "MiniApp.toggleAuthMode"
                  );
                  setIsSignUp(!isSignUp);
                }}
                className="text-xs sm:text-sm text-[#58a6ff] hover:underline"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer - sticky to bottom */}
      <Footer baseUrl={DEFAULT_BASE_URL} showConnectionStatus={true} />
    </div>
  );
};

export default MiniApp;
