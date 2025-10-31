"use client";

import {
  BeakerIcon,
  ChartBarIcon,
  LinkIcon,
  SearchIcon,
  UsersGroupIcon,
  XIcon,
  GitHubIcon,
  ChevronDownIcon,
  MenuIcon,
  CloseIcon,
  MetaMaskIcon,
  SpinnerIcon,
  HuggingFaceIcon,
  CheckCircleIcon,
} from "../ui/icons";
import { LandingHeaderLogo, AppLogo } from "../ui/logo";
import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/app-provider";
import { useApi } from "../../context/api-context";
import { UserRole } from "../../lib/types";
import { Modal } from "../ui/modal";
import { usePrivyAuth, useWalletConnection } from "../../context/wallet-context";
import { useWallets } from "@privy-io/react-auth";
import { SignupModal } from "./signup-modal";

const AuthModal = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const { handleLoginSuccess } = useAppContext();
  const privyAuth = usePrivyAuth();
  const { wallets } = useWallets();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Trigger Privy login immediately when modal opens
  useEffect(() => {
    if (!privyAuth.isAuthenticated && privyAuth.isReady) {
      privyAuth.login();
    }
  }, [privyAuth.isReady]);

  // Handle Privy authentication flow
  useEffect(() => {
    const handlePrivyAuth = async () => {
      // Only proceed if Privy authentication is complete and we have wallet
      if (!privyAuth.isAuthenticated || !privyAuth.user || isAuthenticating) {
        return;
      }

      // Get wallet address from Privy wallets
      const privyWallet = wallets?.[0];
      if (!privyWallet?.address) {
        return;
      }

      setIsAuthenticating(true);
      setAuthError(null);

      try {
        // Call backend Privy auth endpoint
        const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3000";
        const response = await fetch(`${API_BASE}/api/v1/users/privy-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            privyId: privyAuth.user.id,
            address: privyWallet.address,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Authentication failed');
        }

        const data = await response.json();

        // Update app context with user data
        handleLoginSuccess(data.data.user);
        onClose();
      } catch (error) {
        console.error('❌ Cairn authentication failed:', error);
        setAuthError(error instanceof Error ? error.message : 'Authentication failed');
        // Optionally logout from Privy if backend auth fails
        await privyAuth.logout();
      } finally {
        setIsAuthenticating(false);
      }
    };

    handlePrivyAuth();
  }, [privyAuth.isAuthenticated, privyAuth.user, wallets, isAuthenticating]);

  // Show loading/error state while authenticating
  return (
    <Modal onClose={onClose} title="Authenticating">
      <div className="w-full max-w-md mx-auto p-8">
        {authError ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
            </div>
            <button
              onClick={() => {
                setAuthError(null);
                privyAuth.login();
              }}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white font-semibold py-3 px-5 rounded-xl hover:bg-blue-500 transition-all duration-300"
            >
              <span>Try Again</span>
            </button>
          </div>
        ) : isAuthenticating ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <SpinnerIcon className="animate-spin w-8 h-8 text-blue-600" />
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
              Connecting to Cairn...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <SpinnerIcon className="animate-spin w-8 h-8 text-blue-600" />
            <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
              Opening authentication...
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};


const LandingHeader = ({
  onNavigate,
  onLoginClick,
  onSignupClick,
}: {
  onNavigate: (page: "howitworks") => void;
  onLoginClick: () => void;
  onSignupClick: () => void;
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const scrollToSection = (sectionId: string) => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsMobileMenuOpen(false);
  };

  const handleNavigate = (page: "howitworks") => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-cairn-gray-950/80 backdrop-blur-lg border-b border-cairn-gray-800">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <LandingHeaderLogo />

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <a
            href="#features-researchers"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("features-researchers");
            }}
            className="text-sm font-semibold text-cairn-gray-300 hover:text-white transition-colors"
          >
            For Researchers
          </a>
          <a
            href="#features-funders"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("features-funders");
            }}
            className="text-sm font-semibold text-cairn-gray-300 hover:text-white transition-colors"
          >
            For Funders
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("howitworks");
            }}
            className="text-sm font-semibold text-cairn-gray-300 hover:text-white transition-colors"
          >
            How It Works
          </a>
        </div>
        <div className="hidden md:flex items-center space-x-3">
          <button
            onClick={onLoginClick}
            className="font-semibold text-sm py-2.5 px-5 rounded-full hover:bg-cairn-gray-800 text-cairn-gray-200 hover:text-white transition-colors"
          >
            Log In
          </button>
          <button
            onClick={onSignupClick}
            className="bg-blue-600 text-white font-semibold text-sm py-2.5 px-5 rounded-full hover:bg-blue-500 transition-all duration-300"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-cairn-gray-300 hover:text-white hover:bg-cairn-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span className="sr-only">Open main menu</span>
            {isMobileMenuOpen ? (
              <CloseIcon className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <MenuIcon className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-cairn-gray-900 animate-fade-in"
          aria-modal="true"
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 h-full">
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-cairn-gray-700">
                <div className="space-y-2 py-6">
                  <a
                    href="#features-researchers"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("features-researchers");
                    }}
                    className="block rounded-lg py-3 px-4 text-base font-semibold leading-7 text-cairn-gray-200 hover:bg-cairn-gray-800"
                  >
                    For Researchers
                  </a>
                  <a
                    href="#features-funders"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection("features-funders");
                    }}
                    className="block rounded-lg py-3 px-4 text-base font-semibold leading-7 text-cairn-gray-200 hover:bg-cairn-gray-800"
                  >
                    For Funders
                  </a>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigate("howitworks");
                    }}
                    className="block rounded-lg py-3 px-4 text-base font-semibold leading-7 text-cairn-gray-200 hover:bg-cairn-gray-800"
                  >
                    How It Works
                  </a>
                </div>
                <div className="py-6 space-y-4">
                  <button
                    onClick={() => {
                      onLoginClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-cairn-gray-800 text-white font-semibold text-sm py-3 px-5 rounded-full"
                  >
                    <span>Log In</span>
                  </button>
                  <button
                    onClick={() => {
                      onSignupClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white font-semibold text-sm py-3 px-5 rounded-full hover:bg-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/40"
                  >
                    <span>Sign Up</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const HeroSection = ({
  onLoginClick,
  onSignupClick,
}: {
  onLoginClick: () => void;
  onSignupClick: () => void;
}) => {
  const { enterAppAsGuest } = useAppContext();
  return (
    <section className="relative overflow-hidden bg-cairn-gray-950 text-white min-h-screen flex items-center justify-center">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 60% 40%, rgba(29, 78, 216, 0.15), transparent 50%)",
        }}
      ></div>
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.1), transparent 40%)",
        }}
      ></div>

      <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight"
            style={{ lineHeight: 1.1 }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-white to-cairn-gray-300">
              Reproducible Research,
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-400 to-blue-500">
              Retroactively Rewarded
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-cairn-gray-300">
            A platform empowering researchers and funders with transparent
            reproducibility and impact tracking.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={onLoginClick}
                className="group inline-flex items-center justify-center space-x-3 px-12 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-in-out shadow-lg hover:shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-500/50 border border-transparent"
              >
                <span>Log In</span>
              </button>
              <button
                onClick={enterAppAsGuest}
                className="font-semibold py-4 px-8 text-lg rounded-full border border-cairn-gray-600 hover:border-cairn-gray-400 hover:bg-cairn-gray-900 transition-all"
              >
                Explore Community Outputs
              </button>
            </div>
            <p className="pt-4 text-sm text-cairn-gray-400">
              Don't have an account?{" "}
              <button
                onClick={onSignupClick}
                className="font-semibold text-white hover:underline"
              >
                Apply to join
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 hidden sm:block">
        <a
          href="#features-researchers"
          onClick={(e) => {
            e.preventDefault();
            document
              .getElementById("features-researchers")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="animate-bounce"
        >
          <ChevronDownIcon className="w-8 h-8 text-cairn-gray-600" />
        </a>
      </div>
    </section>
  );
};

const FeatureCard = ({
  icon: Icon,
  name,
  description,
}: {
  icon: React.FC<any>;
  name: string;
  description: string;
}) => (
  <div className="group relative bg-cairn-gray-900/40 backdrop-blur-md p-8 rounded-2xl border border-cairn-gray-800 transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/50 hover:bg-cairn-gray-900/80">
    <div className="absolute -inset-px bg-gradient-to-br from-blue-600/50 to-cairn-gray-800 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
    <div className="relative">
      <div className="mb-5 bg-cairn-gray-800/50 w-14 h-14 rounded-xl flex items-center justify-center border border-cairn-gray-700">
        <Icon className="h-7 w-7 text-blue-400 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-12deg]" />
      </div>
      <h3 className="text-xl font-semibold text-white">{name}</h3>
      <p className="mt-2 text-base text-cairn-gray-400">{description}</p>
    </div>
  </div>
);

const FeaturesSection = () => {
  const scientistFeatures = [
    {
      name: "Reproducible Experiments",
      description:
        "Ensure your experiments are easily reproducible with detailed logs and control.",
      icon: BeakerIcon,
    },
    {
      name: "Secure Data Management",
      description:
        "Store research data immutably on Filecoin and prove its origin with on-chain records.",
      icon: BeakerIcon,
    },
    {
      name: "Proof-Backed Collaboration",
      description:
        "Collaborate with peers and funders through reproducibility-driven workflows and transparent research validation.",
      icon: UsersGroupIcon,
    },
  ];
  const funderFeatures = [
    {
      name: "Verifiable Research",
      description:
        "Identify which projects are reproducible and valuable—so every funding decision is backed by evidence",
      icon: SearchIcon,
    },
    {
      name: "Impact Evaluation",
      description:
        "Explore research impact through community evaluation, reproducibility, and downstream metrics.",
      icon: ChartBarIcon,
    },
    {
      name: "Direct Engagement",
      description:
        "Fund researchers whose verified work aligns with your mission—without intermediaries.",
      icon: LinkIcon,
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-cairn-gray-950 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-grid-pattern opacity-5"
        style={{ backgroundSize: "40px 40px" }}
      ></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        <div id="features-researchers">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-base font-semibold leading-7 text-blue-400">
              For Researchers
            </h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Tools for Transparent Science
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {scientistFeatures.map((feature) => (
              <FeatureCard key={feature.name} {...feature} />
            ))}
          </div>
        </div>

        <div id="features-funders">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-base font-semibold leading-7 text-blue-400">
              For Funders
            </h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Invest with Confidence
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {funderFeatures.map((feature) => (
              <FeatureCard key={feature.name} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export const AppFooter = () => (
  <footer className="bg-cairn-gray-950 text-cairn-gray-400 border-t border-cairn-gray-800">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Left Side: Logo and Copyright */}
        <div className="flex flex-col sm:flex-row items-center gap-x-4 gap-y-2 text-center sm:text-left">
          <AppLogo />
          <p className="text-sm">
            &copy; {new Date().getFullYear()} CAIRN Protocol. All rights
            reserved.
          </p>
        </div>

        {/* Right Side: Navigation and Social Links */}
        <nav
          className="flex items-center gap-x-6"
          aria-label="Footer navigation"
        >
          {/* <a
            href="#"
            className="text-sm font-medium hover:text-white transition-colors"
          >
            Docs
          </a>
          <a
            href="#"
            className="text-sm font-medium hover:text-white transition-colors"
          >
            FAQ
          </a> */}
          <a
            href="https://x.com/cairn_platform"
            className="hover:text-white transition-colors"
            aria-label="Twitter"
          >
            <XIcon className="h-5 w-5" />
          </a>
          <a
            href="https://github.com/hiw3-org/cairn"
            className="hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <GitHubIcon className="h-5 w-5" />
          </a>
        </nav>
      </div>
    </div>
  </footer>
);

export const LandingPage = ({
  onNavigate,
}: {
  onNavigate: (page: "howitworks") => void;
}) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = React.useState(false);

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const openSignupModal = () => {
    setIsSignupModalOpen(true);
  };

  return (
    <div className="bg-cairn-gray-950 font-sans">
      <LandingHeader
        onNavigate={onNavigate}
        onLoginClick={openLoginModal}
        onSignupClick={openSignupModal}
      />
      <main>
        <HeroSection
          onLoginClick={openLoginModal}
          onSignupClick={openSignupModal}
        />
        <FeaturesSection />
      </main>
      <AppFooter />
      {isLoginModalOpen && (
        <AuthModal onClose={() => setIsLoginModalOpen(false)} />
      )}
      {isSignupModalOpen && (
        <SignupModal onClose={() => setIsSignupModalOpen(false)} />
      )}
    </div>
  );
};
