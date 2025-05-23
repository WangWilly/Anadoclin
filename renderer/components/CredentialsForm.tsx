import React from "react";

interface CredentialsFormProps {
  apiKey: string;
  setApiKey: (value: string) => void;
  accountEmail: string;
  setAccountEmail: (value: string) => void;
  workspaceId: string;
  setWorkspaceId: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const CredentialsForm: React.FC<CredentialsFormProps> = ({
  apiKey,
  setApiKey,
  accountEmail,
  setAccountEmail,
  workspaceId,
  setWorkspaceId,
  isLoading,
  onSubmit,
}) => {
  return (
    <form className="mt-8 space-y-6" onSubmit={onSubmit}>
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
  );
};

export default CredentialsForm;
