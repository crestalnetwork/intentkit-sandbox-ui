import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  GenerationsListResponse,
  ConversationProject,
  ConversationMessage,
} from "../lib/types";

interface ConversationHistoryProps {
  baseUrl: string;
  onProjectSelect?: (projectId: string) => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  baseUrl,
  onProjectSelect,
}) => {
  const [projects, setProjects] = useState<ConversationProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  useEffect(() => {
    fetchConversationHistory();
  }, [baseUrl]);

  const fetchConversationHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = baseUrl.replace("localhost", "127.0.0.1");
      const response = await axios.get<GenerationsListResponse>(
        `${apiBaseUrl}/agent/generations?limit=20`
      );

      setProjects(response.data.projects);
    } catch (err) {
      console.error("Error fetching conversation history:", err);
      setError("Failed to fetch conversation history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        " " +
        date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      return dateString;
    }
  };

  const getProjectTitle = (project: ConversationProject) => {
    if (project.first_message?.content) {
      // Extract first 50 characters of first user message
      return (
        project.first_message.content.slice(0, 50) +
        (project.first_message.content.length > 50 ? "..." : "")
      );
    }
    return `Conversation ${project.project_id.slice(0, 8)}`;
  };

  const toggleExpanded = (projectId: string) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  const selectProject = (projectId: string) => {
    setSelectedProject(projectId);
    if (onProjectSelect) {
      onProjectSelect(projectId);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[#30363d] rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-12 bg-[#30363d] rounded"></div>
            <div className="h-12 bg-[#30363d] rounded"></div>
            <div className="h-12 bg-[#30363d] rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
        <div className="text-center">
          <div className="text-red-400 mb-2">⚠️ {error}</div>
          <button
            onClick={fetchConversationHistory}
            className="text-sm py-1.5 px-3 bg-[#21262d] text-[#c9d1d9] rounded border border-[#30363d] hover:bg-[#30363d]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] rounded-xl border border-[#30363d] h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-[#30363d] p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#c9d1d9]">
            📝 Conversation History
          </h2>
          <button
            onClick={fetchConversationHistory}
            className="text-sm py-1.5 px-3 bg-[#21262d] text-[#c9d1d9] rounded border border-[#30363d] hover:bg-[#30363d]"
          >
            Refresh
          </button>
        </div>
        <p className="text-sm text-[#8b949e] mt-1">
          Your agent creation conversations
        </p>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-4">
        {projects.length === 0 ? (
          <div className="text-center text-[#8b949e] py-8">
            <div className="text-4xl mb-4">🤖</div>
            <div className="text-lg mb-2">No conversations yet</div>
            <div className="text-sm">
              Start creating agents to see your conversation history here
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.project_id}
                className={`border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff] transition-colors cursor-pointer ${
                  selectedProject === project.project_id
                    ? "border-[#58a6ff] bg-[#0d1117]"
                    : ""
                }`}
                onClick={() => selectProject(project.project_id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-[#c9d1d9] font-medium text-sm">
                      {getProjectTitle(project)}
                    </h3>
                    <div className="text-xs text-[#8b949e] mt-1 space-x-4">
                      <span>Messages: {project.message_count}</span>
                      <span>
                        Last: {formatDate(project.last_activity || "")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(project.project_id);
                    }}
                    className="text-[#8b949e] hover:text-[#c9d1d9] p-1"
                  >
                    {expandedProject === project.project_id ? "−" : "+"}
                  </button>
                </div>

                {expandedProject === project.project_id &&
                  project.conversation_history && (
                    <div className="mt-3 pt-3 border-t border-[#30363d]">
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {project.conversation_history
                          .slice(0, 6)
                          .map((message, idx) => (
                            <div key={idx} className="text-xs">
                              <span
                                className={`font-medium ${
                                  message.role === "user"
                                    ? "text-[#58a6ff]"
                                    : "text-[#85e89d]"
                                }`}
                              >
                                {message.role === "user" ? "You" : "Assistant"}:
                              </span>
                              <span className="text-[#c9d1d9] ml-2">
                                {message.content.slice(0, 100)}
                                {message.content.length > 100 ? "..." : ""}
                              </span>
                            </div>
                          ))}
                        {project.conversation_history.length > 6 && (
                          <div className="text-xs text-[#8b949e] italic">
                            ... {project.conversation_history.length - 6} more
                            messages
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationHistory;
