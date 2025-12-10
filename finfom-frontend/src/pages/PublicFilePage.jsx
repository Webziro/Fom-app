import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { filesAPI } from '../api/files';
import { Download, FileText, User, Calendar, DownloadCloud, AlertCircle, Lock } from 'lucide-react';
import PublicLayout from '../components/layout/PublicLayout';
import Button from '../components/common/Button';
import { Document, Page, pdfjs } from 'react-pdf';
import { useState, useEffect } from 'react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const PublicFilePage = () => {
  const { id } = useParams();
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [password, setPassword] = useState('');
  const [submittedPassword, setSubmittedPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: fileData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['publicFile', id, submittedPassword],
    queryFn: () => filesAPI.getPublicFile(id, submittedPassword),
    retry: false,
    enabled: false, // Disable auto-run
  });

  const file = fileData?.data;

  // Reset isSubmitting when fetching ends
  useEffect(() => {
    if (!isFetching && isSubmitting) {
      setIsSubmitting(false);
    }
  }, [isFetching, isSubmitting]);

  // Initial load
  useEffect(() => {
    refetch();
  }, [id, refetch]);

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const handleDownload = async () => {
    try {
      const { data } = await filesAPI.downloadPublicFile(id);
      const url = URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = file.title || 'file';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed');
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError('Please enter a password');
      return;
    }
    setPasswordError('');
    setIsSubmitting(true);
    setSubmittedPassword(password);
    refetch();
  };

  // Loading
  if (isLoading || isFetching) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">Unlocking file...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Password required or incorrect
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    const isWrongPassword = error.response?.data?.message?.includes('Incorrect') ||
                            error.response?.data?.message?.includes('denied') ||
                            error.response?.data?.message?.includes('password');

    return (
      <PublicLayout>
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Lock className="w-16 h-16 text-yellow-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">
              {isWrongPassword ? 'Incorrect Password' : 'Password Required'}
            </h2>
            <p className="text-gray-600 mb-8">
              {isWrongPassword
                ? 'The password you entered is incorrect. Please try again.'
                : 'This file is protected with a password.'}
            </p>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
                required
              />
              {passwordError && <p className="text-red-600 mb-4">{passwordError}</p>}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Unlocking...' : 'Unlock File'}
              </Button>
            </form>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // File not found or not accessible
  if (!file) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600">This file is not public or does not exist.</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // File loaded successfully
  const isPDF = file.fileType === 'application/pdf';

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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

          {isPDF ? (
            <div className="bg-gray-100 p-8">
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                  <p className="text-sm">Page {pageNumber} of {numPages || '...'}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                      disabled={pageNumber <= 1}
                      className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
                      disabled={pageNumber >= (numPages || 1)}
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