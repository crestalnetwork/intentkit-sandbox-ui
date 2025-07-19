import React, { useState, useEffect } from "react";
import { SettingsProps, StatusMessage } from "../lib/types";
import {
  STORAGE_KEYS,
  DEFAULT_CONFIG,
  DEFAULT_BASE_URL,
} from "../lib/utils/config";
import apiClient from "../lib/utils/apiClient";
import { showToast } from "../lib/utils/toast";
import logger from "../lib/utils/logger";
import theme from "../lib/utils/theme";

const Settings: React.FC<SettingsProps> = ({ baseUrl, onBaseUrlChange }) => {
  const [url, setUrl] = useState<string>(baseUrl);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  logger.component("mounted", "Settings", { baseUrl });

  useEffect(() => {
    logger.debug(
      "Base URL prop changed",
      { oldUrl: url, newUrl: baseUrl },
      "Settings.useEffect"
    );
    setUrl(baseUrl);
  }, [baseUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logger.info(
      "Settings form submitted",
      { url, originalUrl: baseUrl },
      "Settings.handleSubmit"
    );

    // Validate URL
    try {
      // Add protocol if missing
      let validUrl = url;
      if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
        validUrl = `http://${validUrl}`;
        logger.debug(
          "Added protocol to URL",
          { originalUrl: url, validUrl },
          "Settings.handleSubmit"
        );
      }

      // Check if it's a valid URL
      new URL(validUrl);

      // Remove trailing slash if present
      if (validUrl.endsWith("/")) {
        validUrl = validUrl.slice(0, -1);
        logger.debug(
          "Removed trailing slash from URL",
          { validUrl },
          "Settings.handleSubmit"
        );
      }

      logger.info(
        "URL validated successfully",
        { validUrl },
        "Settings.handleSubmit"
      );
      onBaseUrlChange(validUrl);
      setStatus({ type: "success", message: "Settings saved successfully" });
      showToast.success("Base URL updated!");

      // Auto-close after success
      setTimeout(() => {
        logger.debug(
          "Auto-closing settings panel",
          {},
          "Settings.handleSubmit"
        );
        setIsOpen(false);
        setStatus(null);
      }, 1500);
    } catch (error) {
      logger.error(
        "Invalid URL format",
        { url, error },
        "Settings.handleSubmit"
      );
      setStatus({ type: "error", message: "Invalid URL format" });
      showToast.error("Invalid URL format");
    }
  };

  const handleReset = () => {
    logger.info(
      "Resetting to default URL",
      { currentUrl: url, defaultUrl: DEFAULT_CONFIG.BASE_URL },
      "Settings.handleReset"
    );
    setUrl(DEFAULT_CONFIG.BASE_URL);
    localStorage.setItem(STORAGE_KEYS.BASE_URL, DEFAULT_CONFIG.BASE_URL);
    apiClient.updateBaseUrl(DEFAULT_CONFIG.BASE_URL);
    onBaseUrlChange(DEFAULT_CONFIG.BASE_URL);
    setStatus({ type: "success", message: "Reset to default URL" });
    showToast.info("Base URL reset to default.");
  };

  const togglePanel = () => {
    const newState = !isOpen;
    logger.debug(
      "Settings panel toggled",
      { isOpen: newState },
      "Settings.togglePanel"
    );
    setIsOpen(newState);
    setStatus(null);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    logger.debug(
      "URL input changed",
      { newUrl, length: newUrl.length },
      "Settings.handleUrlChange"
    );
    setUrl(newUrl);
  };

  return (
    <div className="relative">
      {/* Settings button */}
      <button
        onClick={togglePanel}
        className="p-1.5 rounded-full bg-[#21262d] hover:bg-[#30363d] focus:outline-none focus:ring-1 focus:ring-[#58a6ff]"
        aria-label="Settings"
      >
        <svg
          className="h-5 w-5 text-[#c9d1d9]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Settings panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#161b22] border border-[#30363d] rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#c9d1d9]">Settings</h3>
              <button
                onClick={() => {
                  logger.debug(
                    "Settings panel closed via X button",
                    {},
                    "Settings.closeButton"
                  );
                  setIsOpen(false);
                }}
                className="text-[#8b949e] hover:text-[#c9d1d9]"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="baseUrl"
                  className="block text-sm font-medium text-[#c9d1d9] mb-2"
                >
                  API Base URL
                </label>
                <input
                  id="baseUrl"
                  type="text"
                  value={url}
                  onChange={handleUrlChange}
                  className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] text-sm focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff]"
                  placeholder="Enter API base URL"
                />
                <p className="text-xs text-[#8b949e] mt-1">
                  Default: {DEFAULT_BASE_URL}
                </p>
              </div>

              {status && (
                <div
                  className={`p-3 rounded text-sm ${
                    status.type === "success"
                      ? "bg-[#238636]/10 border border-[#238636]/20 text-[#238636]"
                      : "bg-[#f85149]/10 border border-[#f85149]/20 text-[#f85149]"
                  }`}
                >
                  {status.message}
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-[#238636] text-white rounded hover:bg-[#2ea043] transition-colors text-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2 px-3 bg-[#21262d] text-[#c9d1d9] rounded border border-[#30363d] hover:bg-[#30363d] transition-colors text-sm"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
