import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { filesAPI } from '../api/files';
import { Download, FileText, User, Calendar, DownloadCloud } from 'lucide-react';
// import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import PublicLayout from '../components/layout/PublicLayout';

// Add the function directly here (copy-paste from FilesPage.jsx)
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const PublicFilePage = () => {
  const { id } = useParams();

  const { data: fileData, isLoading, error } = useQuery({
    queryKey: ['publicFile', id],
    queryFn: () => filesAPI.getFile(id),
  });

  const file = fileData?.data;

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading file...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !file || file.visibility !== 'public') {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">File Not Found</h2>
            <p className="text-gray-600 mb-4">This file may be private or doesn't exist.</p>
            <Button as="a" href="/files">
              Back to Files
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !file || file.visibility !== 'public') {
  return (
    <PublicLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">This file is not public</h2>
          <p className="text-gray-600 mb-4">The owner needs to make it public to share.</p>
          <a href="/" className="text-primary-600 hover:underline">← Back to Finfom</a>
        </div>
      </div>
    </PublicLayout>
  );
}

// Check for link expiration
if (error?.response?.status === 410 || fileData?.data?.message === 'This link has expired') {
  return (
    <PublicLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h2>
          <p className="text-gray-600 mb-4">This share link is no longer valid.</p>
          <a href="/" className="text-primary-600 hover:underline">← Back to Finfom</a>
        </div>
      </div>
    </PublicLayout>
  );
}

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
      alert('Download failed – try again');
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <FileText className="w-20 h-20 text-primary-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{file.title}</h1>
          {file.description && <p className="text-gray-600 mb-6">{file.description}</p>}

          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-500 mb-8">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-6 h-6 text-gray-400 mb-2" />
              <span>{new Date(file.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <User className="w-6 h-6 text-gray-400 mb-2" />
              <span>By {file.uploaderId?.username || 'Anonymous'}</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
              <DownloadCloud className="w-6 h-6 text-gray-400 mb-2" />
              <span>{file.downloads} downloads</span>
            </div>
          </div>

        <p className="text-xs text-gray-500 mt-4">
            The owner will be notified when this file is downloaded.
        </p>

          <Button onClick={handleDownload} size="lg" className="flex items-center gap-3 mx-auto mb-4">
            <Download className="w-5 h-5" />
            Download {formatBytes(file.size)}
          </Button>

          <p className="text-xs text-gray-500">Publicly shared file</p>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PublicFilePage;