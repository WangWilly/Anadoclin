import React from "react";
import { PdfLink } from "../types";

interface LinksTableProps {
  links: PdfLink[];
  onCopyShortUrl: (url: string) => void;
}

const LinksTable: React.FC<LinksTableProps> = ({ links, onCopyShortUrl }) => {
  return (
    <div className="max-h-80 overflow-y-auto border rounded-md p-3 bg-gray-50">
      <table className="min-w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Page</th>
            <th className="text-left py-2">Original URL</th>
            <th className="text-left py-2">Short URL</th>
            <th className="text-left py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {links.map((link, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="py-2">{link.page}</td>
              <td className="py-2">
                <a
                  href={link.urlDetail.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate block max-w-md"
                  title={link.urlDetail.url}
                >
                  {link.urlDetail.url}
                </a>
              </td>
              <td className="py-2">
                {link.urlDetail.shortUrl ? (
                  <div className="flex items-center space-x-2">
                    <a
                      href={link.urlDetail.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:underline"
                    >
                      {link.urlDetail.shortUrl}
                    </a>
                    <button
                      onClick={() => onCopyShortUrl(link.urlDetail.shortUrl!)}
                      className="text-gray-500 hover:text-gray-700"
                      title="Copy to clipboard"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                ) : link.status === "failed" ? (
                  <span className="text-red-500">Failed</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="py-2">
                {link.status === "success" && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Success
                  </span>
                )}
                {link.status === "failed" && (
                  <span
                    className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs"
                    title={link.error}
                  >
                    Failed
                  </span>
                )}
                {!link.status && <span className="text-gray-400">-</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LinksTable;
