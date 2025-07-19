import React, { useState } from "react";
import { AgentDetailProps } from "../lib/types";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import axios from "axios";
import theme from "../lib/utils/theme";

const AgentDetail: React.FC<AgentDetailProps> = ({ agent }) => {
  const [showRawConfig, setShowRawConfig] = useState<boolean>(false);
  const [showEditMode, setShowEditMode] = useState<boolean>(false);
  const [editedConfig, setEditedConfig] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [username, setUsername] = useState<string>(
    localStorage.getItem("intentkit_username") || ""
  );
  const [password, setPassword] = useState<string>(
    localStorage.getItem("intentkit_password") || ""
  );

  if (!agent) {
    return <div>No agent selected</div>;
  }

  // Helper to format skill data
  const formatSkillData = (skill: any) => {
    if (!skill) return null;

    return (
      <div className="mt-2 ml-2">
        <div className="flex items-center">
          <span className="text-xs text-[#8b949e]">Status:</span>
          <span
            className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
              skill.enabled
                ? "bg-[#132e21] text-[#56d364]"
                : "bg-[#21262d] text-[#8b949e]"
            }`}
          >
            {skill.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        {skill.api_key && (
          <div className="mt-1 text-xs">
            <span className="text-[#8b949e]">API Key:</span>
            <span className="ml-1 text-[#c9d1d9]">●●●●●●●●●●●●●●●●</span>
          </div>
        )}
        {skill.api_key_provider && (
          <div className="mt-1 text-xs">
            <span className="text-[#8b949e]">Provider:</span>
            <span className="ml-1 text-[#c9d1d9]">
              {skill.api_key_provider}
            </span>
          </div>
        )}
        {skill.states && Object.keys(skill.states).length > 0 && (
          <div className="mt-2">
            <span className="text-xs font-medium text-[#8b949e]">States:</span>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {Object.entries(skill.states).map(([stateName, stateValue]) => (
                <div
                  key={stateName}
                  className="text-[9px] bg-[#0d1117] p-1 rounded border border-[#30363d]"
                >
                  <span className="text-[#8b949e]">{stateName}:</span>
                  <span className="ml-1 text-[#c9d1d9]">
                    {String(stateValue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleEditClick = () => {
    setEditedConfig(JSON.stringify(agent, null, 2));
    setShowEditMode(true);
    setShowRawConfig(false);
    setSaveResult(null);
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedConfig(e.target.value);
  };

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      setSaveResult(null);

      // Validate JSON
      let configObj;
      try {
        configObj = JSON.parse(editedConfig);
      } catch (err) {
        setSaveResult({
          success: false,
          message: "Invalid JSON format. Please check your configuration.",
        });
        setIsSaving(false);
        return;
      }

      // Get base URL from localStorage
      const baseUrl =
        localStorage.getItem("intentkit_base_url") || "http://127.0.0.1:8000";
      const apiBaseUrl = baseUrl.replace("localhost", "127.0.0.1");

      // Set auth headers if credentials are available
      const config: any = {};
      if (username && password) {
        config.auth = {
          username: username,
          password: password,
        };
      }

      // Send PATCH request to update the agent
      const response = await axios.patch(
        `${apiBaseUrl}/agents/${agent.id}`,
        configObj,
        config
      );

      setSaveResult({
        success: true,
        message: "Agent updated successfully!",
      });

      // Refresh the agents list using the global function
      if (typeof window !== "undefined" && (window as any).refreshAgentsList) {
        (window as any).refreshAgentsList();
      }

      // Add a small delay to show the success message
      setTimeout(() => {
        setShowEditMode(false);
      }, 1500);
    } catch (error) {
      console.error("Error updating agent:", error);

      let errorMessage = "Failed to update agent.";

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage =
            "Authentication failed. Please check your credentials.";
        } else if (error.response?.status === 400) {
          errorMessage = `Bad request: ${
            error.response.data?.detail || "Invalid data"
          }`;
        } else if (error.response?.status === 404) {
          errorMessage = "Agent not found.";
        } else if (error.response?.data?.detail) {
          errorMessage = `Error: ${error.response.data.detail}`;
        }
      }

      setSaveResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#161b22] rounded-xl border border-[#30363d] h-full flex flex-col overflow-hidden">
      <div className="p-2 bg-[#161b22] text-[#c9d1d9] border-b border-[#30363d] flex justify-between items-center">
        <h2 className="text-sm font-semibold">Agent Details</h2>
        <div className="flex items-center space-x-2">
          {!showEditMode && (
            <button
              onClick={handleEditClick}
              className="text-xs text-[#58a6ff] hover:underline flex items-center py-0.5 px-2 bg-[#0d1117] rounded-md border border-[#30363d]"
            >
              <svg
                className="mr-1 h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
          )}
          {!showEditMode && (
            <button
              onClick={() => setShowRawConfig(!showRawConfig)}
              className="text-xs text-[#58a6ff] hover:underline flex items-center py-0.5 px-2 bg-[#0d1117] rounded-md border border-[#30363d]"
            >
              {showRawConfig ? "Hide" : "JSON"}
              <svg
                className={`ml-1 h-3 w-3 transition-transform ${
                  showRawConfig ? "transform rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-2 flex-1 overflow-y-auto bg-[#0d1117]">
        {showEditMode ? (
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
            <div className="bg-[#21262d] px-2 py-1 text-xs font-medium text-[#c9d1d9] border-b border-[#30363d] flex justify-between items-center">
              <span>Edit Agent Configuration</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => setShowEditMode(false)}
                  className="text-[10px] text-[#c9d1d9] hover:underline py-0.5 px-1.5 bg-[#21262d] rounded border border-[#30363d]"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  className={`text-[10px] text-white py-0.5 px-1.5 rounded border ${
                    isSaving
                      ? "bg-[#30363d] cursor-not-allowed"
                      : "bg-[#238636] hover:bg-[#2ea043] border-[#238636]"
                  }`}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {saveResult && (
              <div
                className={`px-2 py-1 text-xs ${
                  saveResult.success
                    ? "bg-[#132e21] text-[#56d364] border-b border-[#238636]"
                    : "bg-[#3b1a1a] text-[#f85149] border-b border-[#f85149]"
                }`}
              >
                {saveResult.message}
              </div>
            )}

            <textarea
              value={editedConfig}
              onChange={handleConfigChange}
              className="w-full h-full p-2 bg-[#0d1117] text-[#c9d1d9] font-mono text-xs focus:outline-none"
              style={{ minHeight: "calc(100vh - 200px)", resize: "none" }}
              spellCheck="false"
              disabled={isSaving}
            />
          </div>
        ) : showRawConfig ? (
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
            <div className="bg-[#21262d] px-2 py-1 text-[10px] font-medium text-[#c9d1d9] border-b border-[#30363d] flex justify-between items-center">
              <span>JSON Configuration</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(agent, null, 2));
                  // Refocus the input after copying
                  setTimeout(
                    () => document.getElementById("search-agents")?.focus(),
                    50
                  );
                }}
                className="text-[10px] text-[#58a6ff] hover:underline py-0.5 px-1 bg-[#0d1117] rounded border border-[#30363d]"
              >
                Copy
              </button>
            </div>
            <SyntaxHighlighter
              language="json"
              style={materialDark}
              customStyle={{
                margin: 0,
                padding: "0.75rem",
                maxHeight: "calc(100vh - 200px)",
                overflowY: "auto",
                background: "#0d1117",
                borderRadius: 0,
                fontSize: "0.7rem",
              }}
            >
              {JSON.stringify(agent, null, 2)}
            </SyntaxHighlighter>
          </div>
        ) : (
          <>
            <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-2">
              <h3 className="text-sm font-medium text-[#c9d1d9]">
                {agent.name || agent.id}
              </h3>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#0d1117] text-[#58a6ff] border border-[#30363d]">
                  ID: {agent.id}
                </span>
                {agent.model && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#0d1117] text-[#58a6ff] border border-[#30363d]">
                    Model: {agent.model}
                  </span>
                )}
              </div>

              {agent.purpose && (
                <div className="mt-2">
                  <h4 className="text-xs font-medium text-[#8b949e]">
                    Purpose
                  </h4>
                  <p className="mt-1 text-xs text-[#c9d1d9] bg-[#0d1117] p-1.5 rounded border border-[#30363d]">
                    {agent.purpose}
                  </p>
                </div>
              )}

              {agent.personality && (
                <div className="mt-2">
                  <h4 className="text-xs font-medium text-[#8b949e]">
                    Personality
                  </h4>
                  <p className="mt-1 text-xs text-[#c9d1d9] bg-[#0d1117] p-1.5 rounded border border-[#30363d]">
                    {agent.personality}
                  </p>
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-2 text-[9px] text-[#8b949e]">
                {agent.created_at && (
                  <div className="bg-[#0d1117] px-1.5 py-1 rounded border border-[#30363d]">
                    Created: {new Date(agent.created_at).toLocaleString()}
                  </div>
                )}

                {agent.updated_at && agent.updated_at !== agent.created_at && (
                  <div className="bg-[#0d1117] px-1.5 py-1 rounded border border-[#30363d]">
                    Updated: {new Date(agent.updated_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {agent.skills && Object.keys(agent.skills).length > 0 && (
              <div className="mt-2 bg-[#161b22] rounded-lg border border-[#30363d] p-2">
                <h4 className="text-sm font-medium text-[#c9d1d9]">Skills</h4>

                <div className="mt-2 space-y-2">
                  {Object.entries(agent.skills).map(
                    ([skillName, skillData]) => (
                      <div
                        key={skillName}
                        className="border-t border-[#30363d] pt-2"
                      >
                        <h5 className="text-xs font-medium text-[#c9d1d9] capitalize">
                          {skillName}
                        </h5>
                        {formatSkillData(skillData)}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AgentDetail;
