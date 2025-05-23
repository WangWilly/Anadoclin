import React, { useState, useCallback, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { PdfInfo, PdfLink, ShortLinkResult } from "../types";
import ErrorMessage from "../components/ErrorMessage";
import LoadingIndicator from "../components/LoadingIndicator";
import DropZone from "../components/DropZone";
import LinksTable from "../components/LinksTable";
import GeneratePdfButton from "../components/GeneratePdfButton";

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
    localStorage.removeItem("linkly_api_key");
    localStorage.removeItem("linkly_account_email");
    localStorage.removeItem("linkly_workspace_id");
    router.push("/");
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
            <h1 className="text-2xl font-bold text-gray-900">PDF Processor</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md shadow-sm"
            >
              Change Credentials
            </button>
          </div>

          <DropZone onFileDrop={handleFileDrop} currentFileName={file?.name} />

          {isLoading && <LoadingIndicator message="Processing PDF..." />}
          {isShorteningLinks && (
            <LoadingIndicator message="Creating short links..." />
          )}

          <ErrorMessage message={error} />

          {pdfInfo && !isLoading && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                PDF Information
              </h2>
              <div className="space-y-2 text-gray-800">
                <p>
                  <span className="font-medium">Pages:</span>{" "}
                  {pdfInfo.pageCount}
                </p>
                <p>
                  <span className="font-medium">Title:</span>{" "}
                  {pdfInfo.title || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Author:</span>{" "}
                  {pdfInfo.author || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Creation Date:</span>{" "}
                  {pdfInfo.creationDate || "N/A"}
                </p>

                {pdfInfo.links && pdfInfo.links.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        Links in Document
                      </h3>
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
                      <GeneratePdfButton
                        onClick={handleGenerateModifiedPdf}
                        isGenerating={false}
                        disabled={isShorteningLinks}
                      />
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
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
}
