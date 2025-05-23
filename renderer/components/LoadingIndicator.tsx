import React from "react";

interface LoadingIndicatorProps {
  message: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
  return (
    <div className="text-center py-4">
      <p>{message}</p>
    </div>
  );
};

export default LoadingIndicator;
