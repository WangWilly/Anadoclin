import React from "react";

interface DropZoneProps {
  onFileDrop: (file: File) => void;
  currentFileName?: string | null;
}

const DropZone: React.FC<DropZoneProps> = ({ onFileDrop, currentFileName }) => {
  const handleFileChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
        const selectedFile = event.target.files[0];
        if (selectedFile.type === "application/pdf") {
          onFileDrop(selectedFile);
        }
      }
    },
    [onFileDrop]
  );

  const handleDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.dataTransfer.files && event.dataTransfer.files[0]) {
        const droppedFile = event.dataTransfer.files[0];
        if (droppedFile.type === "application/pdf") {
          onFileDrop(droppedFile);
        }
      }
    },
    [onFileDrop]
  );

  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  return (
    <div
      className="border-2 border-dashed p-10 rounded-lg text-center mb-6 cursor-pointer hover:bg-gray-50 bg-white"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => document.getElementById("fileInput")?.click()}
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        accept=".pdf"
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center justify-center">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">
          {currentFileName
            ? currentFileName
            : "Drag & drop your PDF file or click to select"}
        </p>
      </div>
    </div>
  );
};

export default DropZone;
