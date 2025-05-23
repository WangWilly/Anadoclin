import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ErrorMessage from "../components/ErrorMessage";
import CredentialsForm from "../components/CredentialsForm";
import HintTooltip from "../components/HintTooltip";

////////////////////////////////////////////////////////////////////////////////

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

    if (savedApiKey) setApiKey(savedApiKey);
    if (savedEmail) setAccountEmail(savedEmail);
    if (savedWorkspaceId) setWorkspaceId(savedWorkspaceId);
  }, []);

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

        // Add a slight delay before navigation to allow animation to begin
        setTimeout(() => {
          router.push("/home");
        }, 50);
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
            <div className="flex justify-center items-center">
              <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                Welcome to Anadoclin
              </h2>
              <HintTooltip
                content={
                  <div>
                    <p>
                      Anadoclin helps you convert long URLs in your PDF
                      documents into short links using Linkly service.
                    </p>
                    <p className="mt-1">
                      First, you need to enter your Linkly credentials to
                      proceed.
                    </p>
                  </div>
                }
                position="right"
                className="ml-2"
              />
            </div>
            <div className="mt-2 text-center text-sm text-gray-600 flex items-center justify-center">
              <p>Please enter your Linkly credentials to continue</p>
              <HintTooltip
                content={
                  <div>
                    <p>
                      You can find your API key and workspace ID in your Linkly
                      account settings.
                    </p>
                    <p className="mt-1">
                      After submitting valid credentials, you'll be able to
                      upload PDFs and create short links.
                    </p>
                  </div>
                }
                position="bottom"
                className="ml-1"
              />
            </div>
          </div>

          <ErrorMessage message={error} />

          <CredentialsForm
            apiKey={apiKey}
            setApiKey={setApiKey}
            accountEmail={accountEmail}
            setAccountEmail={setAccountEmail}
            workspaceId={workspaceId}
            setWorkspaceId={setWorkspaceId}
            isLoading={isLoading}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </React.Fragment>
  );
}
