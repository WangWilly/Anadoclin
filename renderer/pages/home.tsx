import React, { useState, useCallback, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PdfInfo, PdfLink, ShortLinkResult } from "../types";
import ErrorMessage from "../components/ErrorMessage";
import LoadingIndicator from "../components/LoadingIndicator";
import DropZone from "../components/DropZone";
import LinksTable from "../components/LinksTable";
import GeneratePdfButton from "../components/GeneratePdfButton";
import HintTooltip from "../components/HintTooltip";

////////////////////////////////////////////////////////////////////////////////

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isShorteningLinks, setIsShorteningLinks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkPrefix, setLinkPrefix] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Check if all required credentials exist
    const apiKey = localStorage.getItem("linkly_api_key");
    const accountEmail = localStorage.getItem("linkly_account_email");
    const workspaceId = localStorage.getItem("linkly_workspace_id");

    if (!apiKey || !accountEmail || !workspaceId) {
      router.push("/");
    }
  }, [router]);

  const handleFileDrop = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    processPdfFile(selectedFile);
  }, []);

  const processPdfFile = async (pdfFile: File) => {
    try {
      setIsLoading(true);

      // Convert file to array buffer
      const arrayBuffer = await pdfFile.arrayBuffer();

      // Use the specific method instead of generic invoke
      const result = await window.api.processPdf(arrayBuffer);
      setPdfInfo(result);
    } catch (err) {
      setError(
        "Error processing PDF: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Add slight delay before navigation to allow animation to begin
    setTimeout(() => {
      router.push("/");
    }, 50);
  };

  const handleShortenLinks = async () => {
    if (!pdfInfo || !pdfInfo.links || pdfInfo.links.length === 0) {
      setError("No links found to shorten");
      return;
    }

    try {
      setIsShorteningLinks(true);
      setError(null);

      // Get credentials from localStorage
      const apiKey = localStorage.getItem("linkly_api_key") || "";
      const accountEmail = localStorage.getItem("linkly_account_email") || "";
      const workspaceId = Number(
        localStorage.getItem("linkly_workspace_id") || "0"
      );

      // Extract just the URLs from PDF links
      const links = pdfInfo.links.map((link) => link.urlDetail);

      // Create short links using the main process
      const results: ShortLinkResult[] = await window.api.createShortLinks({
        links,
        credentials: { apiKey, accountEmail, workspaceId },
        prefix: linkPrefix.trim(), // Pass the prefix to the main process
      });

      // Update PDF info with shortened links
      const updatedLinks = pdfInfo.links.map((link): PdfLink => {
        const result = results.find(
          (r) => r.urlDetail.url === link.urlDetail.url
        );
        if (result) {
          const newLink = { ...link };
          newLink.urlDetail.shortUrl = result.urlDetail.shortUrl;
          newLink.error = result.error;
        }
        return link;
      });

      setPdfInfo({
        ...pdfInfo,
        links: updatedLinks,
      });
    } catch (err) {
      setError(
        "Error shortening links: " +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsShorteningLinks(false);
    }
  };

  const handleGenerateModifiedPdf = async () => {
    if (!pdfInfo || !file || !pdfInfo.links) {
      setError("No PDF file or links available");
      return;
    }

    // Check if we have any shortened links
    const hasShortLinks = pdfInfo.links.some((link) => link.urlDetail.shortUrl);
    if (!hasShortLinks) {
      setError("Please shorten at least one link before generating a new PDF");
      return;
    }

    try {
      setError(null);

      // Get original file as array buffer
      const arrayBuffer = await file.arrayBuffer();

      // Send to main process to generate modified PDF
      const modifiedPdfBuffer = await window.api.generateModifiedPdf({
        originalPdf: arrayBuffer,
        links: pdfInfo.links,
      });

      // Create a blob from the returned array buffer
      const blob = new Blob([modifiedPdfBuffer], { type: "application/pdf" });

      // Create a download link and trigger click
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${file.name.replace(".pdf", "")}_with_short_links.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        "Error generating PDF: " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  };

  const handleCopyShortUrl = (shortUrl: string) => {
    navigator.clipboard
      .writeText(shortUrl)
      .then(() => {
        alert("Short URL copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy URL:", err);
      });
  };

  return (
    <React.Fragment>
      <Head>
        <title>Upload PDF file</title>
      </Head>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">PDF Processor</h1>
              <HintTooltip
                content={
                  <div>
                    <p>Welcome to PDF Processor!</p>
                    <p className="mt-1">
                      Here you can upload PDFs, extract links, and convert them to
                      short URLs.
                    </p>
                    <p className="mt-1">
                      Start by dropping a PDF file in the upload area below.
                    </p>
                  </div>
                }
                position="right"
                className="ml-2"
              />
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md shadow-sm"
            >
              Change Credentials
            </button>
          </div>

          <div className="relative">
            <DropZone
              onFileDrop={handleFileDrop}
              currentFileName={file?.name}
            />
            <div className="absolute top-0 right-0 p-2">
              <HintTooltip
                content={
                  <div>
                    <p>Drop your PDF file here or click to select a file.</p>
                    <p className="mt-1">
                      We'll extract all links from your PDF for processing.
                    </p>
                  </div>
                }
                position="left"
              />
            </div>
          </div>

          {isLoading && <LoadingIndicator message="Processing PDF..." />}
          {isShorteningLinks && (
            <LoadingIndicator message="Creating short links..." />
          )}

          <ErrorMessage message={error} />

          {pdfInfo && !isLoading && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  PDF Information
                </h2>
                <div className="mb-4 ml-2">
                  <HintTooltip
                    content={
                      <div>
                        <p>Here you can see details about your PDF document.</p>
                        <p className="mt-1">
                          All links found in your document will be displayed below.
                        </p>
                      </div>
                    }
                    position="right"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                  <h3 className="text-md font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">Document Details</h3>
                  <div className="space-y-2 text-gray-800">
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Title:</span>{" "}
                      <span className="ml-1 text-blue-700">{pdfInfo.title || "Untitled Document"}</span>
                    </p>
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Author:</span>{" "}
                      <span className="ml-1">{pdfInfo.author || "Unknown"}</span>
                    </p>
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Creation Date:</span>{" "}
                      <span className="ml-1">{pdfInfo.creationDate || "Unknown"}</span>
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                  <h3 className="text-md font-medium text-gray-700 mb-2 border-b border-gray-200 pb-1">Document Stats</h3>
                  <div className="space-y-2 text-gray-800">
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7zm3 3a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Pages:</span>{" "}
                      <span className="ml-1">{pdfInfo.pageCount}</span>
                    </p>
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Links Found:</span>{" "}
                      <span className="ml-1">{pdfInfo.links?.length || 0}</span>
                    </p>
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">File Name:</span>{" "}
                      <span className="ml-1 truncate max-w-xs">{file?.name || "Unknown"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {pdfInfo.links && pdfInfo.links.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        Links in Document
                      </h3>
                      <HintTooltip
                        content={
                          <div>
                            <p>These are all the links found in your PDF.</p>
                            <p className="mt-1">
                              Click "Apply Linkly to All Links" to shorten them.
                            </p>
                            <p className="mt-1">
                              You can add an optional prefix to your short links.
                            </p>
                          </div>
                        }
                        position="bottom"
                        className="ml-2"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <div className="flex items-center mr-2">
                        <input
                          id="link-prefix"
                          type="text"
                          className="border border-gray-300 rounded-md p-1 text-sm"
                          value={linkPrefix}
                          onChange={(e) => setLinkPrefix(e.target.value)}
                          disabled={isShorteningLinks}
                          placeholder="Label prefix (optional)"
                        />
                        <HintTooltip
                          content="Add a custom prefix to the shortened links for better organization"
                          position="top"
                          className="ml-1"
                        />
                      </div>
                      <button
                        onClick={handleShortenLinks}
                        disabled={isShorteningLinks}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-200 text-sm shadow-sm"
                      >
                        {isShorteningLinks
                          ? "Processing..."
                          : "Apply Linkly to All Links"}
                      </button>
                    </div>
                  </div>

                  {/* PDF Generation Button */}
                  {pdfInfo.links.some((link) => link.urlDetail.shortUrl) && (
                    <div className="flex items-center justify-center w-full my-4">
                      <GeneratePdfButton
                        onClick={handleGenerateModifiedPdf}
                        isGenerating={false}
                        disabled={isShorteningLinks}
                      />
                      <HintTooltip
                        content={
                          <div>
                            <p>Generate a new PDF with shortened links.</p>
                            <p className="mt-1">
                              This will replace all long URLs with the shortened
                              versions.
                            </p>
                            <p className="mt-1">
                              The new PDF will be downloaded automatically.
                            </p>
                          </div>
                        }
                        position="right"
                        className="ml-2"
                      />
                    </div>
                  )}

                  <LinksTable
                    links={pdfInfo.links}
                    onCopyShortUrl={handleCopyShortUrl}
                  />
                </div>
              )}

              {(!pdfInfo.links || pdfInfo.links.length === 0) && (
                <p className="mt-2 text-gray-500 italic">
                  No links found in this document
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}
