import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { UserRole } from "../../lib/types";
import { SpinnerIcon, CheckCircleIcon } from "../ui/icons";
import { usePrivyAuth } from "../../context/wallet-context";
import { useWallets } from "@privy-io/react-auth";
import { useAppContext } from "../../context/app-provider";

interface SignupFormData {
  // Step 1: Basic info
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;

  // Step 2: Profile details
  username: string;
  institution: string;
  department: string;
  researchInterests: string;
  bio: string;

  // Step 3: Optional references
  website: string;
  orcid: string;
  twitter: string;
  github: string;
}

export const SignupModal = ({ onClose }: { onClose: () => void }) => {
  const [signupStep, setSignupStep] = useState(1);
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    email: "",
    role: UserRole.Researcher,
    username: "",
    institution: "",
    department: "",
    researchInterests: "",
    bio: "",
    website: "",
    orcid: "",
    twitter: "",
    github: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const privyAuth = usePrivyAuth();
  const { wallets } = useWallets();
  const { handleLoginSuccess } = useAppContext();

  // Handle form field changes
  const updateField = (field: keyof SignupFormData, value: string | UserRole) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Trigger Privy authentication after all data is collected
  const handleTriggerPrivyAuth = () => {
    if (!privyAuth.isReady) {
      setSubmitError("Authentication system not ready. Please try again.");
      return;
    }

    // Move to authentication step
    setSignupStep(3);

    // Trigger Privy login modal
    privyAuth.login();
  };

  // Handle successful Privy authentication and backend signup
  useEffect(() => {
    const completeSignup = async () => {
      // Only proceed if we're on step 3 (auth step) and Privy auth is complete
      if (signupStep !== 3 || !privyAuth.isAuthenticated || !privyAuth.user || isSubmitting) {
        return;
      }

      // Get wallet address from Privy
      const privyWallet = wallets?.[0];
      if (!privyWallet?.address) {
        // Wait for wallet to be ready
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        // Prepare research interests as array
        const interestsArray = formData.researchInterests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        // Map frontend role to backend role
        const backendRole =
          formData.role === UserRole.Researcher ? "researcher" : "funder";

        // Call backend signup endpoint
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const response = await fetch(`${API_BASE}/api/v1/users/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            privyId: privyAuth.user.id,
            address: privyWallet.address,
            email: formData.email,
            username: formData.username,
            role: backendRole,
            profile: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              institution: formData.institution,
              department: formData.department,
              researchInterests: interestsArray,
              bio: formData.bio,
              website: formData.website || undefined,
              orcid_id: formData.orcid || undefined,
              twitter: formData.twitter || undefined,
            },
            // Add github separately if provided
            ...(formData.github && { githubUsername: formData.github }),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Signup failed");
        }

        const data = await response.json();

        // Show success state
        setSignupSuccess(true);

        // Update app context with user data
        handleLoginSuccess(data.data.user);

        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } catch (error) {
        console.error("❌ Signup failed:", error);
        setSubmitError(
          error instanceof Error ? error.message : "Signup failed. Please try again."
        );
        // Logout from Privy on error so user can try again
        await privyAuth.logout();
        setSignupStep(2); // Go back to form
      } finally {
        setIsSubmitting(false);
      }
    };

    completeSignup();
  }, [
    signupStep,
    privyAuth.isAuthenticated,
    privyAuth.user,
    wallets,
    isSubmitting,
    formData,
  ]);

  // Render Step 1: Basic Information
  const renderStep1 = () => (
    <div className="border border-gray-700 rounded-2xl bg-gray-800 p-10 space-y-6 shadow-lg">
      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Full Name
        </label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
          required
          placeholder="First Name"
          className="w-full px-4 py-2 mb-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
        />
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
          required
          placeholder="Last Name"
          className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">
          I am a...
        </label>
        <div className="flex gap-4">
          <label
            className={`flex-1 flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
              formData.role === UserRole.Researcher
                ? "bg-blue-600/30 border-blue-400"
                : "border-gray-600"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={UserRole.Researcher}
              checked={formData.role === UserRole.Researcher}
              onChange={() => updateField("role", UserRole.Researcher)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-400"
            />
            <span className="ml-3 text-sm font-medium text-white">
              Researcher
            </span>
          </label>
          <label
            className={`flex-1 flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
              formData.role === UserRole.Funder
                ? "bg-blue-600/30 border-blue-400"
                : "border-gray-600"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={UserRole.Funder}
              checked={formData.role === UserRole.Funder}
              onChange={() => updateField("role", UserRole.Funder)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-400"
            />
            <span className="ml-3 text-sm font-medium text-white">
              Funder
            </span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
        />
      </div>

      <button
        type="button"
        onClick={() => setSignupStep(2)}
        disabled={!formData.firstName || !formData.lastName || !formData.email}
        className="w-full bg-blue-600 text-white font-semibold py-3 px-5 rounded-xl hover:bg-blue-500 transition-all duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );

  // Render Step 2: Profile Details
  const renderStep2 = () => (
    <div className="border border-gray-700 rounded-2xl bg-gray-800 p-10 space-y-6 shadow-lg">
      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Username
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => updateField("username", e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Institution
        </label>
        <input
          type="text"
          value={formData.institution}
          onChange={(e) => updateField("institution", e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Department
        </label>
        <input
          type="text"
          value={formData.department}
          onChange={(e) => updateField("department", e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Research Interests (comma-separated)
        </label>
        <input
          type="text"
          value={formData.researchInterests}
          onChange={(e) => updateField("researchInterests", e.target.value)}
          required
          placeholder="e.g., Machine Learning, NLP"
          className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">
          Bio
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => updateField("bio", e.target.value)}
          required
          rows={3}
          className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-1">
          References (Optional)
        </label>
        <div className="space-y-2">
          <input
            type="url"
            placeholder="Website"
            value={formData.website}
            onChange={(e) => updateField("website", e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
          <input
            type="text"
            placeholder="ORCID"
            value={formData.orcid}
            onChange={(e) => updateField("orcid", e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
          <input
            type="text"
            placeholder="Twitter"
            value={formData.twitter}
            onChange={(e) => updateField("twitter", e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
          <input
            type="text"
            placeholder="GitHub"
            value={formData.github}
            onChange={(e) => updateField("github", e.target.value)}
            className="w-full px-4 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
      </div>

      {submitError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setSignupStep(1)}
          className="flex-1 bg-gray-700 text-white font-semibold py-3 px-5 rounded-xl hover:bg-gray-600 transition-all duration-300"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleTriggerPrivyAuth}
          disabled={
            !formData.username ||
            !formData.institution ||
            !formData.department ||
            !formData.researchInterests ||
            !formData.bio
          }
          className="flex-1 bg-blue-600 text-white font-semibold py-3 px-5 rounded-xl hover:bg-blue-500 transition-all duration-300 disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          Continue to Authentication
        </button>
      </div>
    </div>
  );

  // Render Step 3: Privy Authentication & Backend Signup
  const renderStep3 = () => {
    if (signupSuccess) {
      return (
        <div className="text-center p-8">
          <CheckCircleIcon className="w-16 h-16 text-status-success mx-auto" />
          <h3 className="text-2xl font-bold mt-4 text-white">
            Welcome to CAIRN!
          </h3>
          <p className="mt-2 text-gray-300">
            Your account has been created successfully. Redirecting...
          </p>
        </div>
      );
    }

    if (submitError) {
      return (
        <div className="text-center p-8 space-y-4">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
          </div>
          <button
            onClick={() => {
              setSubmitError(null);
              handleTriggerPrivyAuth();
            }}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-5 rounded-xl hover:bg-blue-500 transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <SpinnerIcon className="animate-spin w-12 h-12 text-blue-600" />
        <div className="text-center">
          <p className="text-lg font-semibold text-white">
            {isSubmitting ? "Creating your account..." : "Authenticate with Privy"}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {isSubmitting
              ? "Please wait while we set up your profile"
              : "Complete authentication to finish signup"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Modal
      onClose={onClose}
      title={
        signupStep === 1
          ? "Create Your Account (1/2)"
          : signupStep === 2
          ? "Complete Your Profile (2/2)"
          : "Authentication"
      }
    >
      <div className="w-full max-w-3xl mx-auto">
        {signupStep === 1 && renderStep1()}
        {signupStep === 2 && renderStep2()}
        {signupStep === 3 && renderStep3()}
      </div>
    </Modal>
  );
};
