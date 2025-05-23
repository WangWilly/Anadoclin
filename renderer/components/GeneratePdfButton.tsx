import React from "react";

interface GeneratePdfButtonProps {
  onClick: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

const GeneratePdfButton: React.FC<GeneratePdfButtonProps> = ({
  onClick,
  isGenerating,
  disabled,
}) => {
  return (
    <div className="relative mt-6 mb-6 p-6 bg-yellow-50 border-2 border-orange-400 rounded-lg flex flex-col items-center">
      <p className="mb-3 text-lg font-semibold text-gray-900">
        Ready to create your PDF with shortened links?
      </p>
      <button
        onClick={onClick}
        disabled={isGenerating || disabled}
        className="relative px-8 py-4 bg-blue-600 text-white text-lg font-extrabold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-200 shadow-lg transform transition-all hover:-translate-y-1 active:translate-y-0 active:shadow-md"
        style={{
          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.6)",
        }}
      >
        {isGenerating ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-white">Generating...</span>
          </span>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2 inline text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="text-white tracking-wide">
              GENERATE PDF WITH SHORT LINKS
            </span>
          </>
        )}
      </button>

      {/* Visual indicators to draw attention */}
      <div className="absolute -top-3 -right-3 bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
        FINAL STEP
      </div>

      {/* Decorative elements */}
      <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-500 rounded-full"></div>
      <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-orange-500 rounded-full"></div>
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-orange-500 rounded-full"></div>
    </div>
  );
};

export default GeneratePdfButton;
