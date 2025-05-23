import React, { useState, useCallback, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { PdfInfo } from '../types'

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfInfo, setPdfInfo] = useState<PdfInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  return (
    <React.Fragment>
      <Head>
        <title>Upload PDF file</title>
      </Head>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">PDF Processor</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            Change Credentials
          </button>
        </div>
        
        <div 
          className="border-2 border-dashed p-10 rounded-lg text-center mb-6 cursor-pointer hover:bg-gray-50"
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

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        {pdfInfo && !isLoading && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">PDF Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Pages:</span> {pdfInfo.pageCount}</p>
              <p><span className="font-medium">Title:</span> {pdfInfo.title || 'N/A'}</p>
              <p><span className="font-medium">Author:</span> {pdfInfo.author || 'N/A'}</p>
              <p><span className="font-medium">Creation Date:</span> {pdfInfo.creationDate || 'N/A'}</p>
              
              {pdfInfo.links && pdfInfo.links.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Links in Document</h3>
                  <div className="max-h-60 overflow-y-auto border rounded-md p-3">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Page</th>
                          <th className="text-left py-2">URL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pdfInfo.links.map((link, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="py-2">{link.page}</td>
                            <td className="py-2">
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate block max-w-md"
                                title={link.url}
                              >
                                {link.url}
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {pdfInfo.links.length === 0 && (
                      <p className="text-gray-500 italic">No links found in this document</p>
                    )}
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
    </React.Fragment>
  )
}
