"use client";

import {
  BeakerIcon,
  ChartBarIcon,
  LinkIcon,
  SearchIcon,
  UsersGroupIcon,
  XIcon,
  GitHubIcon,
  WalletIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  MenuIcon,
  CloseIcon,
  GvelIcon,
  GoogleIcon,
  SparklesIcon,
  MetaMaskIcon,
  OpenIdIcon,
  SpinnerIcon,
  HuggingFaceIcon,
  CheckCircleIcon,
} from "../ui/icons";
import { LandingHeaderLogo, AppLogo } from "../ui/logo";
import React, { useState } from "react";
import { useAppContext } from "../../context/app-provider";
import { useContract } from "../../context/contract-context";
import { UserRole } from "../../lib/types";
import { Modal } from "../ui/modal";

const AuthModal = ({
  onClose,
  initialMode = "login",
}: {
  onClose: () => void;
  initialMode?: "login" | "signup";
}) => {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const { login, signUp } = useAppContext();

  // Signup state
  const [signupStep, setSignupStep] = useState(1);

  // Step 1 state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 state
  const [username, setUsername] = useState("");
  const [address, setAddress] = useState("");
  const [institution, setInstitution] = useState("");
  const [department, setDepartment] = useState("");
  const [researchInterests, setResearchInterests] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [orcid, setOrcid] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleHuggingFaceLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login("huggingface");
    onClose();
  };

  const handleMetaMaskLogin = () => {
    login("metamask");
    onClose();
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Prepare research interests as array
    const interestsArray = researchInterests
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await signUp({
      email,
      username,
      password,
      address,
      profile: {
        firstName,
        lastName,
        institution,
        department,
        researchInterests: interestsArray,
        bio,
        website,
        orcid,
        twitter,
        github,
      },
    });
    setIsSubmitting(false);
    setSignupSuccess(true);
  };

  const renderSignupForm = () => (
    <form
      onSubmit={
        signupStep === 2
          ? handleSignupSubmit
          : (e) => {
              e.preventDefault();
              setSignupStep(2);
            }
      }
      className="space-y-4"
    >
      <p className="text-sm text-center text-text-secondary dark:text-text-dark-secondary">
        Submit your application to join the CAIRN platform. Your application will be manually reviewed.
      </p>
      {signupStep === 1 ? (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => setSignupStep(2)}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-5 rounded-xl hover:bg-blue-500 transition-all duration-300"
          >
            Continue
          </button>
          <p className="text-center text-sm">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="font-semibold text-primary hover:underline"
            >
              Log In
            </button>
          </p>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Wallet Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Institution</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Research Interests (comma-separated)</label>
            <input
              type="text"
              value={researchInterests}
              onChange={(e) => setResearchInterests(e.target.value)}
              required
              placeholder="e.g., Machine Learning, NLP"
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ORCID</label>
            <input
              type="text"
              value={orcid}
              onChange={(e) => setOrcid(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Twitter</label>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">GitHub</label>
            <input
              type="text"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-transparent focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white font-semibold py-3 px-5 rounded-xl hover:bg-blue-500 transition-all duration-300 disabled:bg-blue-400"
          >
            {isSubmitting ? (
              <SpinnerIcon className="animate-spin w-5 h-5" />
            ) : (
              <span>Submit Application</span>
            )}
          </button>
          <p className="text-center text-sm">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="font-semibold text-primary hover:underline"
            >
              Log In
            </button>
          </p>
        </>
      )}
    </form>
  );

  const renderLoginOptions = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-center text-text dark:text-text-dark">
          Log in to your account
        </h3>
        <p className="text-sm text-center text-text-secondary dark:text-text-dark-secondary">
          Authentication options coming soon.
        </p>
      </div>
      <div className="space-y-4">
        <button
          disabled
          className="w-full flex items-center space-x-4 p-4 border border-border dark:border-border-dark rounded-xl bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-60"
        >
          <HuggingFaceIcon className="w-8 h-8 text-gray-400" />
          <div className="text-left">
            <p className="font-semibold text-gray-500 dark:text-gray-400">
              Continue as Researcher
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Hugging Face login - Coming Soon
            </p>
          </div>
        </button>
        <button
          disabled
          className="w-full flex items-center space-x-4 p-4 border border-border dark:border-border-dark rounded-xl bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-60"
        >
          <MetaMaskIcon className="w-8 h-8 text-gray-400" />
          <div className="text-left">
            <p className="font-semibold text-gray-500 dark:text-gray-400">
              Continue as Funder
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              MetaMask login - Coming Soon
            </p>
          </div>
        </button>
      </div>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        {/* Don't have an account?{" "} */}
        <span className="font-semibold text-gray-400 cursor-not-allowed">
          Registration coming soon
        </span>
      </p>
    </div>
  );

  // const renderLoginOptions = () => (
  //   <div className="space-y-6">
  //     <div>
  //       <h3 className="text-lg font-semibold text-center text-text dark:text-text-dark">
  //         Log in to your account
  //       </h3>
  //       <p className="text-sm text-center text-text-secondary dark:text-text-dark-secondary">
  //         Connect with your preferred account to continue.
  //       </p>
  //     </div>
  //     <div className="space-y-4">
  //       <button
  //         onClick={handleHuggingFaceLogin}
  //         className="w-full flex items-center space-x-4 p-4 border border-border dark:border-border-dark rounded-xl hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 transition-colors"
  //       >
  //         <HuggingFaceIcon className="w-8 h-8 text-yellow-500" />
  //         <div className="text-left">
  //           <p className="font-semibold text-text dark:text-text-dark">
  //             Continue as Researcher
  //           </p>
  //           <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
  //             Login with Hugging Face
  //           </p>
  //         </div>
  //       </button>
  //       <button
  //         onClick={handleMetaMaskLogin}
  //         className="w-full flex items-center space-x-4 p-4 border border-border dark:border-border-dark rounded-xl hover:bg-hf-gray-100 dark:hover:bg-hf-gray-800 transition-colors"
  //       >
  //         <MetaMaskIcon className="w-8 h-8" />
  //         <div className="text-left">
  //           <p className="font-semibold text-text dark:text-text-dark">
  //             Continue as Funder
  //           </p>
  //           <p className="text-sm text-text-secondary dark:text-text-dark-secondary">
  //             Login with MetaMask
  //           </p>
  //         </div>
  //       </button>
  //     </div>
  //     <p className="text-center text-sm">
  //       Don't have an account?{" "}
  //       <button
  //         onClick={() => setMode("signup")}
  //         className="font-semibold text-primary hover:underline"
  //       >
  //         Apply to join
  //       </button>
  //     </p>
  //   </div>
  // );

  const renderSignupSuccess = () => (
    <div className="text-center p-8">
      <CheckCircleIcon className="w-16 h-16 text-status-success mx-auto" />
      <h3 className="text-2xl font-bold mt-4 text-text dark:text-text-dark">
        Application Submitted!
      </h3>
      <p className="mt-2 text-text-secondary dark:text-text-dark-secondary">
        Thanks for applying. We'll review your application and get back to you
        soon.
      </p>
      <button
        onClick={onClose}
        className="mt-6 w-full bg-primary text-white font-semibold py-3 px-5 rounded-xl hover:bg-primary-hover"
      >
        Close
      </button>
    </div>
  );

  return (
    <Modal
      onClose={onClose}
      title={
        mode === "login"
          ? "Log In"
          : signupSuccess
          ? "Application Received"
          : "Apply to CAIRN"
      }
    >
      <div className="w-full max-w-md mx-auto">
        {signupSuccess
          ? renderSignupSuccess()
          : mode === "login"
          ? renderLoginOptions()
          : renderSignupForm()}
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
  const { isAuthenticated, enterApp } = useAppContext();
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

  const handleConnectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const TARGET_CHAIN_ID = "0x4cb2f"; // Filecoin Calibration = 0x13a (decimal 314159)

        const currentChainId = await window.ethereum.request({
          method: "eth_chainId",
        });

        console.log("Current chain ID:", currentChainId);

        if (currentChainId !== TARGET_CHAIN_ID) {
          try {
            // Try to switch to Filecoin Calibration
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: TARGET_CHAIN_ID }],
            });
          } catch (switchError: any) {
            // If the chain is not added to MetaMask, add it
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: "wallet_addEthereumChain",
                  params: [
                    {
                      chainId: TARGET_CHAIN_ID,
                      chainName: "Filecoin Calibration",
                      nativeCurrency: {
                        name: "tFIL",
                        symbol: "tFIL",
                        decimals: 18,
                      },
                      rpcUrls: [
                        "https://filecoin-calibration.chainup.net/rpc/v1",
                      ],
                      blockExplorerUrls: ["https://calibration.filfox.info/en"],
                    },
                  ],
                });
              } catch (addError) {
                console.error("Failed to add chain:", addError);
                return;
              }
            } else {
              console.error("Failed to switch chain:", switchError);
              return;
            }
          }
        }

        // ✅ Connect wallet
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const address = accounts[0];

        await initWithWallet(address);
        const porCount = await getUserPoRCount(address);

        setCurrentUser({
          walletAddress: address,
          porContributedCount: porCount,
          role: UserRole.Scientist,
        });

        setUserRole(UserRole.Scientist);
        setConnectedWallet(address);
        console.log("User connected:", address, "Role:", UserRole.Scientist);
        console.log("PoR Count:", porCount);
      } catch (err) {
        console.error("User rejected wallet connection or chain switch:", err);
      }
    } else {
      alert("Please install MetaMask.");
    }
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
  <footer className="bg-background-light dark:bg-cairn-gray-950 text-text-secondary dark:text-cairn-gray-400 border-t border-border dark:border-cairn-gray-800">
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
          <a
            href="#"
            className="text-sm font-medium hover:text-text dark:hover:text-white transition-colors"
          >
            Docs
          </a>
          <a
            href="#"
            className="text-sm font-medium hover:text-text dark:hover:text-white transition-colors"
          >
            FAQ
          </a>
          <a
            href="https://x.com/cairn_platform"
            className="hover:text-text dark:hover:text-white transition-colors"
            aria-label="Twitter"
          >
            <XIcon className="h-5 w-5" />
          </a>
          <a
            href="#"
            className="hover:text-text dark:hover:text-white transition-colors"
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
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authModalMode, setAuthModalMode] = React.useState<"login" | "signup">(
    "login"
  );

  const openAuthModal = (mode: "login" | "signup") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="bg-cairn-gray-950 font-sans">
      <LandingHeader
        onNavigate={onNavigate}
        onLoginClick={() => openAuthModal("login")}
        onSignupClick={() => openAuthModal("signup")}
      />
      <main>
        <HeroSection
          onLoginClick={() => openAuthModal("login")}
          onSignupClick={() => openAuthModal("signup")}
        />
        <FeaturesSection />
      </main>
      <AppFooter />
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      )}
    </div>
  );
};
