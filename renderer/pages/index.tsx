import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

export default function ApiCredentialsPage() {
  const [apiKey, setApiKey] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if credentials already exist
    const savedApiKey = localStorage.getItem("linkly_api_key");
    const savedEmail = localStorage.getItem("linkly_account_email");
    const savedWorkspaceId = localStorage.getItem("linkly_workspace_id");

    if (savedApiKey && savedEmail && savedWorkspaceId) {
      router.push("/home");
    } else {
      // If we have partial credentials, fill the form
      if (savedApiKey) setApiKey(savedApiKey);
      if (savedEmail) setAccountEmail(savedEmail);
      if (savedWorkspaceId) setWorkspaceId(savedWorkspaceId);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields
    if (!apiKey.trim()) {
      setError("Please enter an API key");
      return;
    }

    if (!accountEmail.trim()) {
      setError("Please enter an account email");
      return;
    }

    if (!workspaceId.trim() || isNaN(Number(workspaceId))) {
      setError("Please enter a valid workspace ID (numeric)");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate the credentials by invoking the main process
      const isValid = await window.api.validateLinklyCredentials({
        apiKey,
        accountEmail,
        workspaceId: Number(workspaceId),
      });

      if (isValid) {
        // Store credentials in localStorage
        localStorage.setItem("linkly_api_key", apiKey);
        localStorage.setItem("linkly_account_email", accountEmail);
        localStorage.setItem("linkly_workspace_id", workspaceId);

        // Redirect to home/upload page
        router.push("/home");
      } else {
        setError("Invalid credentials. Please check and try again.");
      }
    } catch (err) {
      setError(
        "Error validating credentials: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <React.Fragment>
      <Head>
        <title>Linkly API Setup</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg space-y-8">
          <div>
            <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
              Welcome to Anadoclin
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please enter your Linkly credentials to continue
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p>{error}</p>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label
                  htmlFor="account-email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Account Email
                </label>
                <input
                  id="account-email"
                  name="account-email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="your@email.com"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="api-key"
                  className="block text-sm font-medium text-gray-700"
                >
                  API Key
                </label>
                <input
                  id="api-key"
                  name="api-key"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Your Linkly API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div>
                <label
                  htmlFor="workspace-id"
                  className="block text-sm font-medium text-gray-700"
                >
                  Workspace ID
                </label>
                <input
                  id="workspace-id"
                  name="workspace-id"
                  type="string"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Workspace ID number"
                  value={workspaceId}
                  onChange={(e) => setWorkspaceId(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {isLoading ? "Validating..." : "Continue to App"}
              </button>
            </div>

            <div className="text-sm text-center">
              <a
                href="https://linklyhq.com/support/api/"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Don't have Linkly credentials? Learn how to get them
              </a>
            </div>
          </form>
        </div>
      </div>
    </React.Fragment>
  );
}
