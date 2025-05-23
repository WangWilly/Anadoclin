import React from "react";
import Image from 'next/image';

interface LoadingIndicatorProps {
  message: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-gray-100 bg-opacity-80 z-50 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center max-w-md w-full">
        {/* Logo container with animation */}
        <div className="logo-bounce mb-6">
          <div className="w-20 h-20 relative mb-4">
            <Image
              src="/images/logo.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Status message */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Processing
          </h3>
          <p className="text-gray-600">{message}</p>
        </div>

        {/* Loading dots */}
        <div className="flex mt-4 space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-loading-dot-1"></div>
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-loading-dot-2"></div>
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-loading-dot-3"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
