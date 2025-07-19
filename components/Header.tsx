import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { showToast } from "../lib/utils/toast";
import logger from "../lib/utils/logger";
import theme from "../lib/utils/theme";
import Settings from "./Settings";

interface HeaderProps {
  title: string;
  backLink?: {
    href: string;
    label: string;
  };
  rightActions?: React.ReactNode;
  showBaseUrl?: boolean;
  baseUrl?: string;
  onBaseUrlChange?: (newUrl: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  backLink,
  rightActions,
  showBaseUrl = false,
  baseUrl = "",
  onBaseUrlChange,
}) => {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    signIn,
    signUp,
    signOut,
    error: authError,
  } = useSupabaseAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  logger.component("rendered", "Header", {
    title,
    isAuthenticated,
    authLoading,
    userEmail: user?.email,
    showBaseUrl,
    baseUrl,
  });

  const getUserDisplayName = () => {
    if (!user) return "";
    return user.email || user.user_metadata?.name || "User";
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      logger.warn(
        "Auth form submitted with missing fields",
        { hasEmail: !!email, hasPassword: !!password },
        "Header.handleAuth"
      );
      showToast.error("Please fill in all fields");
      return;
    }

    logger.info(
      "Auth form submitted",
      { email, isSignUp },
      "Header.handleAuth"
    );

    try {
      if (isSignUp) {
        await signUp(email, password);
        logger.info(
          "Sign up completed from header",
          { email },
          "Header.handleAuth"
        );
        showToast.success(
          "Account created! Please check your email for verification."
        );
      } else {
        await signIn(email, password);
        logger.info(
          "Sign in completed from header",
          { email },
          "Header.handleAuth"
        );
        showToast.success("Signed in successfully!");
      }
      setShowAuthModal(false);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      logger.error(
        "Auth error from header",
        { email, isSignUp, error: error.message },
        "Header.handleAuth"
      );
      showToast.error(error.message || "Authentication failed");
    }
  };

  const handleSignOut = async () => {
    logger.info(
      "Sign out initiated from header",
      { userEmail: user?.email },
      "Header.handleSignOut"
    );
    try {
      await signOut();
      logger.info("Sign out completed from header", {}, "Header.handleSignOut");
      showToast.success("Signed out successfully");
    } catch (error: any) {
      logger.error(
        "Sign out error from header",
        { error: error.message },
        "Header.handleSignOut"
      );
      showToast.error("Error signing out");
    }
  };

  const handleShowAuthModal = () => {
    logger.debug("Auth modal opened", {}, "Header.handleShowAuthModal");
    setShowAuthModal(true);
  };

  const handleCloseAuthModal = () => {
    logger.debug("Auth modal closed", {}, "Header.handleCloseAuthModal");
    setShowAuthModal(false);
  };

  const handleToggleSignUp = () => {
    logger.debug(
      "Auth mode toggled",
      { newMode: !isSignUp ? "signUp" : "signIn" },
      "Header.handleToggleSignUp"
    );
    setIsSignUp(!isSignUp);
  };

  const handleGetApiKey = () => {
    logger.info("API key button clicked", {}, "Header.handleGetApiKey");
    showToast.info("🔑 API Key functionality coming soon!");
    setShowProfileDropdown(false);
  };

  const handleProfileSignOut = async () => {
    logger.info("Profile sign out clicked", {}, "Header.handleProfileSignOut");
    try {
      await signOut();
      setShowProfileDropdown(false);
    } catch (error: any) {
      logger.error(
        "Sign out failed",
        { error: error.message },
        "Header.handleProfileSignOut"
      );
    }
  };

  return (
    <>
      <header
        className={`bg-[${theme.colors.background.primary}] border-b border-[${theme.colors.border.primary}] py-2 sm:py-4 flex-shrink-0 shadow-lg`}
      >
        <div className="max-w-full mx-auto px-3 sm:px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-6">
            {backLink && (
              <Link
                href={backLink.href}
                className={`inline-flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-4 bg-[${theme.colors.background.tertiary}] text-[${theme.colors.primary.main}] rounded-lg border border-[${theme.colors.primary.border}] hover:bg-[${theme.colors.primary.light}] hover:border-[${theme.colors.primary.borderHover}] transition-all duration-200`}
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="hidden sm:inline">{backLink.label}</span>
                <span className="sm:hidden">←</span>
              </Link>
            )}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-16 sm:h-16 bg-transparent rounded-lg flex items-center justify-center p-1">
                <img
                  src="/images/logo.png"
                  alt="IntentKit Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Custom right actions */}
            <div className="hidden sm:block">{rightActions}</div>

            {/* Authentication Status */}
            {authLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-[#d0ff16]/30 border-t-[#d0ff16]"></div>
                <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">
                  Loading...
                </span>
              </div>
            ) : isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 sm:space-x-3 bg-black/30 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-[#d0ff16]/20 hover:bg-black/50 hover:border-[#d0ff16]/40 transition-all duration-200"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#d0ff16]/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4 text-[#d0ff16]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-white hidden sm:inline truncate max-w-24 sm:max-w-none">
                    {getUserDisplayName()}
                  </span>
                  <svg
                    className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-200 ${
                      showProfileDropdown ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-black border border-[#d0ff16]/30 rounded-lg shadow-xl z-50">
                    <div className="py-2">
                      {/* Profile Info Section */}
                      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-[#d0ff16]/20">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#d0ff16]/20 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5 text-[#d0ff16]"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-white truncate">
                              {getUserDisplayName()}
                            </p>
                            <p className="text-xs text-[#8b949e]">
                              Authenticated User
                            </p>
                          </div>
                        </div>
                      </div>
                      <Link
                        href="/mini-app"
                        onClick={() => setShowProfileDropdown(false)}
                        className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white hover:bg-[#d0ff16]/10 transition-colors"
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-[#d0ff16]"
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
                        <span>Quick Creator</span>
                      </Link>
                      <button
                        onClick={handleGetApiKey}
                        className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white hover:bg-[#d0ff16]/10 transition-colors"
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-[#d0ff16]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"
                          />
                        </svg>
                        <span>Get API Key</span>
                      </button>
                      {onBaseUrlChange && (
                        <button
                          onClick={() => {
                            // Toggle settings functionality - for now just show toast
                            showToast.info("Settings panel coming soon!");
                            setShowProfileDropdown(false);
                          }}
                          className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white hover:bg-[#d0ff16]/10 transition-colors"
                        >
                          <svg
                            className="w-3 h-3 sm:w-4 sm:h-4 text-[#d0ff16]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
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
                          <span>Settings</span>
                        </button>
                      )}
                      <hr className="border-[#d0ff16]/20 my-1" />
                      <button
                        onClick={handleProfileSignOut}
                        className="w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-red-400 hover:bg-red-600/10 transition-colors"
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleShowAuthModal}
                className="inline-flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm py-1.5 sm:py-2.5 px-3 sm:px-6 bg-[#d0ff16] text-black font-semibold rounded-lg hover:bg-[#d0ff16]/90 hover:shadow-lg hover:shadow-[#d0ff16]/20 transition-all duration-200"
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile right actions */}
            <div className="sm:hidden">{rightActions}</div>
          </div>
        </div>
      </header>

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black border border-[#d0ff16]/30 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h2>
              <button
                onClick={handleCloseAuthModal}
                className="text-gray-400 hover:text-[#d0ff16] text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm">{authError}</p>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-black/50 border border-[#d0ff16]/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#d0ff16]/50 focus:border-[#d0ff16] transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-black/50 border border-[#d0ff16]/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#d0ff16]/50 focus:border-[#d0ff16] transition-all"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#d0ff16] text-black font-semibold rounded-lg hover:bg-[#d0ff16]/90 hover:shadow-lg hover:shadow-[#d0ff16]/20 transition-all duration-200"
              >
                {isSignUp ? "Create Account" : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={handleToggleSignUp}
                className="text-sm text-[#d0ff16] hover:text-[#d0ff16]/80 transition-colors"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
