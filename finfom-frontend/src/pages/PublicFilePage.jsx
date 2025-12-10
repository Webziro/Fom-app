import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { filesAPI } from '../api/files';
import { Download, FileText, User, Calendar, DownloadCloud, AlertCircle } from 'lucide-react';
import PublicLayout from '../components/layout/PublicLayout';
import Button from '../components/common/Button';
import { Document, Page, pdfjs } from 'react-pdf';
import { useState } from 'react';

// Set worker src (required for react-pdf)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PublicFilePage = () => {
  const { id } = useParams();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const { data: fileData, isLoading, error } = useQuery({
    queryKey: ['publicFile', id],
    queryFn: () => filesAPI.getFile(id),
  });

  const file = fileData?.data;

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const handleDownload = async () => {
    try {
      const response = await filesAPI.downloadFile(id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.title || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed');
    }
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !file || file.visibility !== 'public') {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">This file is not public or does not exist.</p>
            <a href="/" className="text-primary-600 hover:underline">← Back to Finfom</a>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const isPDF = file.fileType === 'application/pdf';

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* File Info Header */}
          <div className="p-8 text-center border-b">
            <FileText className="w-20 h-20 text-primary-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{file.title}</h1>
            {file.description && <p className="text-gray-600 mb-6 max-w-2xl mx-auto">{file.description}</p>}

            <div className="grid grid-cols-3 gap-4 text-sm text-gray-500 mb-8">
              <div className="p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <span>{new Date(file.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <User className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <span>By {file.uploaderId?.username || 'Anonymous'}</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <DownloadCloud className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <span>{file.downloads} downloads</span>
              </div>
            </div>

            <Button onClick={handleDownload} size="lg" className="flex items-center gap-3 mx-auto">
              <Download className="w-5 h-5" />
              Download File
            </Button>
          </div>

          {/* PDF Preview */}
          {isPDF ? (
            <div className="bg-gray-100 p-8">
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                  <p className="text-sm">Page {pageNumber} of {numPages}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                      disabled={pageNumber <= 1}
                      className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                      disabled={pageNumber >= numPages}
                      className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="p-4 overflow-auto max-h-screen">
                  <Document
                    file={file.secureUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="text-center py-20">Loading PDF...</div>}
                    error={<div className="text-center py-20 text-red-500">Failed to load PDF</div>}
                  >
                    <Page pageNumber={pageNumber} width={800} />
                  </Document>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-gray-500">
              <FileText className="w-24 h-24 mx-auto mb-4 text-gray-300" />
              <p>Preview not available for this file type</p>
              <p className="text-sm mt-2">Download to view</p>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default PublicFilePage;