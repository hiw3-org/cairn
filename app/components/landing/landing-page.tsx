"use client";

import {
  BeakerIcon,
  ChartBarIcon,
  LinkIcon,
  SearchIcon,
  UsersGroupIcon,
  TwitterIcon,
  DiscordIcon,
  GitHubIcon,
  IpfsIcon,
} from "../ui/icons";
import { LandingHeaderLogo } from "../ui/logo";
import React from "react";
import { useState, useEffect } from "react";
import { useAppContext } from "../../context/app-provider";

const LandingHeader = ({
  onNavigate,
}: {
  onNavigate: (page: "howitworks") => void;
}) => {
  const { currentUser, setCurrentUser } = useAppContext();
  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleConnectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const address = accounts[0];

        // Prompt for name/org
        const name = window.prompt("Enter your full name");
        if (!name) return;

        const organization = window.prompt(
          "Enter your organization (optional)"
        );

        // Update global context
        setCurrentUser({
          walletAddress: address,
          name,
          organization,
          porContributedCount: 3, // or fetch actual data if available
        });
      } catch (err) {
        console.error("User rejected wallet connection", err);
      }
    } else {
      alert("Please install MetaMask.");
    }
  };

  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          const address = accounts[0];

          // Only set currentUser if not already set (avoid overwriting)
          if (!currentUser.walletAddress) {
            setCurrentUser({
              walletAddress: address,
              name: "Unnamed User", // fallback
              porContributedCount: 0,
            });
          }
        }
      }
    };

    checkWalletConnection();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-cairn-gray-950/80 backdrop-blur-lg">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
        <LandingHeaderLogo />
        <div className="hidden lg:flex items-center space-x-8">
          <a
            href="#features-researchers"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("features-researchers");
            }}
            className="text-sm font-semibold text-cairn-gray-600 hover:text-cairn-blue-600 dark:text-cairn-gray-300 dark:hover:text-cairn-blue-400 transition-colors"
          >
            For Researchers
          </a>
          <a
            href="#features-funders"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("features-funders");
            }}
            className="text-sm font-semibold text-cairn-gray-600 hover:text-cairn-blue-600 dark:text-cairn-gray-300 dark:hover:text-cairn-blue-400 transition-colors"
          >
            For Funders
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("howitworks");
            }}
            className="text-sm font-semibold text-cairn-gray-600 hover:text-cairn-blue-600 dark:text-cairn-gray-300 dark:hover:text-cairn-blue-400 transition-colors"
          >
            How It Works
          </a>
        </div>
        {currentUser ? (
          <div className="hidden lg:block text-sm font-semibold text-cairn-blue-700 dark:text-cairn-blue-300">
            {currentUser.walletAddress.substring(0, 6)}...
            {currentUser.walletAddress.slice(-4)}
          </div>
        ) : (
          <button
            onClick={handleConnectWallet}
            className="hidden lg:block bg-cairn-blue-600 text-white font-semibold text-sm py-2 px-4 rounded-lg hover:bg-cairn-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            Connect Wallet
          </button>
        )}
        <div className="lg:hidden">{/* Mobile menu button */}</div>
      </nav>
    </header>
  );
};

const HeroSection = ({ onEnter }: { onEnter: () => void }) => (
  <section className="relative text-center py-32 sm:py-40 lg:py-48 bg-white dark:bg-cairn-gray-950 from-white to-cairn-gray-50 dark:from-cairn-gray-950 dark:to-cairn-gray-900 bg-gradient-to-b">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cairn-blue-600 to-cairn-deep-blue dark:from-cairn-blue-400 dark:to-cairn-light-blue">
        Reproducible Research,
        <br />
        Retroactively Rewarded
      </h1>
      <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-cairn-gray-600 dark:text-cairn-gray-400">
        A Web3 platform empowering Embodied AI researchers and funders through
        transparent Proof-of-Reproducibility and impact tracking.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onEnter}
          className="w-full sm:w-auto bg-cairn-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-cairn-blue-700 transition-transform hover:scale-105 shadow-lg"
        >
          Start a Research Project
        </button>
        <button
          onClick={onEnter}
          className="w-full sm:w-auto bg-transparent text-cairn-blue-600 dark:text-cairn-blue-400 font-semibold py-3 px-8 rounded-lg ring-2 ring-cairn-blue-200 dark:ring-cairn-blue-800 hover:bg-cairn-blue-50 dark:hover:bg-cairn-blue-900/50 transition-colors"
        >
          Explore Fundable Projects
        </button>
      </div>
    </div>
  </section>
);

const KeyFeaturesSection = () => {
  const scientistFeatures = [
    {
      name: "Reproducible Experiments",
      description:
        "Ensure your experiments are easily reproducible with detailed logs and version control.",
      icon: BeakerIcon,
    },
    {
      name: "Secure Data Management",
      description:
        "Manage your research data securely on IPFS with blockchain-based provenance.",
      icon: IpfsIcon,
    },
    {
      name: "Collaborative Tools",
      description:
        "Collaborate effectively with peers and funders through integrated communication tools.",
      icon: UsersGroupIcon,
    },
  ];

  const funderFeatures = [
    {
      name: "Transparent Project Tracking",
      description:
        "Monitor the progress of funded projects with real-time updates and transparent logs.",
      icon: SearchIcon,
    },
    {
      name: "Impact Evaluation",
      description:
        "Access comprehensive reports and data analysis to evaluate research outcomes.",
      icon: ChartBarIcon,
    },
    {
      name: "Direct Engagement",
      description:
        "Engage directly with scientists, provide feedback, and foster collaboration.",
      icon: LinkIcon,
    },
  ];

  const FeatureCard = ({
    icon: Icon,
    name,
    description,
  }: {
    icon: React.FC<any>;
    name: string;
    description: string;
  }) => (
    <div className="bg-white dark:bg-cairn-gray-800/50 rounded-2xl p-8 text-left border border-cairn-gray-200 dark:border-cairn-gray-800 shadow-sm hover:shadow-xl hover:border-cairn-blue-300 dark:hover:border-cairn-blue-700 transition-all duration-300 transform hover:-translate-y-1">
      <div className="mb-4">
        <Icon className="h-8 w-8 text-cairn-blue-600 dark:text-cairn-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-cairn-gray-900 dark:text-white">
        {name}
      </h3>
      <p className="mt-1 text-base text-cairn-gray-600 dark:text-cairn-gray-400">
        {description}
      </p>
    </div>
  );

  return (
    <section className="py-24 sm:py-32 bg-cairn-gray-50 dark:bg-cairn-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        <div id="features-researchers">
          <div className="text-left max-w-3xl">
            <h2 className="text-base font-semibold leading-7 text-cairn-blue-600 dark:text-cairn-blue-400">
              For Researchers
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-cairn-gray-900 dark:text-white sm:text-4xl">
              Tools for Transparent Science
            </p>
            <p className="mt-6 text-lg leading-8 text-cairn-gray-600 dark:text-cairn-gray-400">
              Explore the features designed to enhance your research workflow.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {scientistFeatures.map((feature) => (
              <FeatureCard key={feature.name} {...feature} />
            ))}
          </div>
        </div>

        <div id="features-funders">
          <div className="text-left max-w-3xl">
            <h2 className="text-base font-semibold leading-7 text-cairn-blue-600 dark:text-cairn-blue-400">
              For Funders
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-cairn-gray-900 dark:text-white sm:text-4xl">
              Invest with Confidence
            </p>
            <p className="mt-6 text-lg leading-8 text-cairn-gray-600 dark:text-cairn-gray-400">
              Discover how CAIRN helps you manage and support research projects
              effectively.
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

const CtaSection = ({
  onEnter,
  showLearnMore = true,
  onNavigate,
}: {
  onEnter: () => void;
  showLearnMore?: boolean;
  onNavigate: (page: "howitworks") => void;
}) => (
  <section className="bg-gradient-to-r from-cairn-blue-700 to-cairn-deep-blue">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <div className="relative isolate overflow-hidden text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to Pioneer the Future of Research?
        </h2>
        <p className="mt-6 text-lg leading-8 text-cairn-blue-200">
          Join CAIRN today. Start a project, fund groundbreaking science, and be
          part of the DeSci revolution.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <button
            onClick={onEnter}
            className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-cairn-blue-700 shadow-lg hover:bg-cairn-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-transform hover:scale-105"
          >
            Enter the Platform
          </button>
          {showLearnMore && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("howitworks");
              }}
              className="text-sm font-semibold leading-6 text-white hover:text-cairn-blue-100 transition-colors"
            >
              Learn more <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      </div>
    </div>
  </section>
);

const LandingFooter = () => (
  <footer className="bg-cairn-gray-900 text-cairn-gray-400">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-white">Platform</h3>
          <ul className="mt-4 space-y-2">
            <li>
              <a href="#" className="hover:text-white">
                For Researchers
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white">
                For Funders
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Resources</h3>
          <ul className="mt-4 space-y-2">
            <li>
              <a href="#" className="hover:text-white">
                Documentation
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white">
                How It Works
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Community</h3>
          <ul className="mt-4 space-y-2">
            <li>
              <a href="#" className="hover:text-white">
                DAO Governance
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white">
                Contact
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Legal</h3>
          <ul className="mt-4 space-y-2">
            <li>
              <a href="#" className="hover:text-white">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white">
                Terms of Service
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-12 pt-8 border-t border-cairn-gray-800 flex flex-col sm:flex-row justify-between items-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} CAIRN Protocol. All rights reserved.
        </p>
        <div className="flex space-x-6 mt-4 sm:mt-0">
          <a href="#" className="hover:text-white">
            <TwitterIcon className="h-6 w-6" />
          </a>
          <a href="#" className="hover:text-white">
            <DiscordIcon className="h-6 w-6" />
          </a>
          <a href="#" className="hover:text-white">
            <GitHubIcon className="h-6 w-6" />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export const LandingPage = ({
  onEnter,
  onNavigate,
}: {
  onEnter: () => void;
  onNavigate: (page: "howitworks") => void;
}) => {
  return (
    <div className="bg-white dark:bg-cairn-gray-950 text-cairn-gray-800 dark:text-cairn-gray-200 font-sans">
      <LandingHeader onNavigate={onNavigate} />
      <main>
        <HeroSection onEnter={onEnter} />
        <KeyFeaturesSection />
        <CtaSection onEnter={onEnter} onNavigate={onNavigate} />
      </main>
      <LandingFooter />
    </div>
  );
};
