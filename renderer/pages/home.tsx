import React, { useState, useCallback, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { PdfInfo, PdfLink, PdfLinkDetail, ShortLinkResult } from '../types'

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isShorteningLinks, setIsShorteningLinks] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null)
  const [linkPrefix, setLinkPrefix] = useState('');
  const router = useRouter()
  
  useEffect(() => {
    // Check if all required credentials exist
    const apiKey = localStorage.getItem('linkly_api_key');
    const accountEmail = localStorage.getItem('linkly_account_email');
    const workspaceId = localStorage.getItem('linkly_workspace_id');
    
    if (!apiKey || !accountEmail || !workspaceId) {
      router.push('/');
    }
  }, [router])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0]
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile)
        setError(null)
        processPdfFile(selectedFile)
      } else {
        setError('Please select a PDF file')
        setFile(null)
      }
    }
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const droppedFile = event.dataTransfer.files[0]
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile)
        setError(null)
        processPdfFile(droppedFile)
      } else {
        setError('Please drop a PDF file')
        setFile(null)
      }
    }
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const processPdfFile = async (pdfFile: File) => {
    try {
      setIsLoading(true)
      
      // Convert file to array buffer
      const arrayBuffer = await pdfFile.arrayBuffer()
      
      // Send to main process for processing
      const result = await window.ipc.invoke('process-pdf', arrayBuffer)
      setPdfInfo(result)
      
    } catch (err) {
      setError('Error processing PDF: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('linkly_api_key');
    localStorage.removeItem('linkly_account_email');
    localStorage.removeItem('linkly_workspace_id');
    router.push('/');
  }

  const handleShortenLinks = async () => {
    if (!pdfInfo || !pdfInfo.links || pdfInfo.links.length === 0) {
      setError('No links found to shorten');
      return;
    }

    try {
      setIsShorteningLinks(true);
      setError(null);

      // Get credentials from localStorage
      const apiKey = localStorage.getItem('linkly_api_key') || '';
      const accountEmail = localStorage.getItem('linkly_account_email') || '';
      const workspaceId = Number(localStorage.getItem('linkly_workspace_id') || '0');

      // Extract just the URLs from PDF links
      const links = pdfInfo.links.map(link => link.urlDetail);

      // Create short links using the main process
      const results: ShortLinkResult[] = await window.ipc.invoke('create-short-links', {
        links,
        credentials: { apiKey, accountEmail, workspaceId },
        prefix: linkPrefix.trim() // Pass the prefix to the main process
      });

      // Update PDF info with shortened links
      const updatedLinks = pdfInfo.links.map((link): PdfLink => {
        const result = results.find(r => r.urlDetail.url === link.urlDetail.url);
        if (result) {
          const newLink = { ...link };
          newLink.urlDetail.shortUrl = result.urlDetail.shortUrl
          newLink.error = result.error
        }
        return link;
      });

      setPdfInfo({
        ...pdfInfo,
        links: updatedLinks
      });
    } catch (err) {
      setError('Error shortening links: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsShorteningLinks(false);
    }
  };

  const handleGenerateModifiedPdf = async () => {
    if (!pdfInfo || !file || !pdfInfo.links) {
      setError('No PDF file or links available');
      return;
    }

    // Check if we have any shortened links
    const hasShortLinks = pdfInfo.links.some(link => link.urlDetail.shortUrl);
    if (!hasShortLinks) {
      setError('Please shorten at least one link before generating a new PDF');
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setError(null);

      // Get original file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Send to main process to generate modified PDF
      const modifiedPdfBuffer = await window.ipc.invoke('generate-modified-pdf', {
        originalPdf: arrayBuffer,
        links: pdfInfo.links,
      });
      
      // Create a blob from the returned array buffer
      const blob = new Blob([modifiedPdfBuffer], { type: 'application/pdf' });
      
      // Create a download link and trigger click
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace('.pdf', '')}_with_short_links.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      setError('Error generating PDF: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyShortUrl = (shortUrl: string) => {
    navigator.clipboard.writeText(shortUrl)
      .then(() => {
        alert('Short URL copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy URL:', err);
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
          
          <div 
            className="border-2 border-dashed p-10 rounded-lg text-center mb-6 cursor-pointer hover:bg-gray-50 bg-white"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input 
              type="file" 
              id="fileInput" 
              className="hidden" 
              accept=".pdf" 
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                {file ? file.name : 'Drag & drop your PDF file or click to select'}
              </p>
            </div>
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <p>Processing PDF...</p>
            </div>
          )}

          {isShorteningLinks && (
            <div className="text-center py-4">
              <p>Creating short links...</p>
            </div>
          )}

          {isGeneratingPdf && (
            <div className="text-center py-4">
              <p>Generating PDF with shortened links...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <p>{error}</p>
            </div>
          )}

          {pdfInfo && !isLoading && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">PDF Information</h2>
              <div className="space-y-2 text-gray-800">
                <p><span className="font-medium">Pages:</span> {pdfInfo.pageCount}</p>
                <p><span className="font-medium">Title:</span> {pdfInfo.title || 'N/A'}</p>
                <p><span className="font-medium">Author:</span> {pdfInfo.author || 'N/A'}</p>
                <p><span className="font-medium">Creation Date:</span> {pdfInfo.creationDate || 'N/A'}</p>
                
                {pdfInfo.links && pdfInfo.links.length > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900">Links in Document</h3>
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
                          disabled={isShorteningLinks || isGeneratingPdf}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-200 text-sm shadow-sm"
                        >
                          {isShorteningLinks ? 'Processing...' : 'Apply Linkly to All Links'}
                        </button>
                      </div>
                    </div>
                    
                    {/* PDF Generation Button - Now with extreme contrast for visibility */}
                    {pdfInfo.links.some(link => link.urlDetail.shortUrl) && (
                      <div className="relative mt-6 mb-6 p-6 bg-yellow-50 border-2 border-orange-400 rounded-lg flex flex-col items-center">
                        <p className="mb-3 text-lg font-semibold text-gray-900">Ready to create your PDF with shortened links?</p>
                        <button
                          onClick={handleGenerateModifiedPdf}
                          disabled={isGeneratingPdf || isShorteningLinks}
                          className="relative px-8 py-4 bg-red-600 bg-blue-600 text-white text-lg font-extrabold rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:text-gray-200 shadow-lg transform transition-all hover:-translate-y-1 active:translate-y-0 active:shadow-md"
                          style={{
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.6)'
                          }}
                        >
                          {isGeneratingPdf ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-white">Generating...</span>
                            </span>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 inline text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span className="text-white tracking-wide">GENERATE PDF WITH SHORT LINKS</span>
                            </>
                          )}
                        </button>
                        
                        {/* Visual indicators to draw attention */}
                        <div className="absolute -top-3 -right-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                          FINAL STEP
                        </div>
                        
                        {/* Decorative elements to make the button area stand out */}
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-500 rounded-full"></div>
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-orange-500 rounded-full"></div>
                        <div className="absolute -top-2 -left-2 w-4 h-4 bg-orange-500 rounded-full"></div>
                      </div>
                    )}
                    
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
                          {pdfInfo.links.map((link, index) => (
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
                                      onClick={() => handleCopyShortUrl(link.urlDetail.shortUrl!)}
                                      className="text-gray-500 hover:text-gray-700"
                                      title="Copy to clipboard"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : link.status === 'failed' ? (
                                  <span className="text-red-500">Failed</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-2">
                                {link.status === 'success' && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Success</span>
                                )}
                                {link.status === 'failed' && (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs" title={link.error}>Failed</span>
                                )}
                                {!link.status && (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(!pdfInfo.links || pdfInfo.links.length === 0) && (
                  <p className="mt-2 text-gray-500 italic">No links found in this document</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  )
}
