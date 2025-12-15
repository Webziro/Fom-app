import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { filesAPI } from '../api/files';
import Layout from '../components/layout/Layout';
import { ArrowLeft, FolderOpen, FileText, Download, Trash2, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import FilePreviewModal from '../components/files/FilePreviewModal';
import { useEffect, useState, useRef } from 'react';  

const FolderViewPage = () => {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['folderFiles', id],
    queryFn: () => filesAPI.getMyFiles({ folderId: id }),
  });

  const files = data?.data?.data || [];

  const { data: folderData } = useQuery({
    queryKey: ['folder', id],
    queryFn: () => filesAPI.getFolder(id),
  });

  const folder = folderData?.data;

  const [openMenuId, setOpenMenuId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const menuRef = useRef(null);

  // Close menu outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (fileId) => {
    setOpenMenuId(openMenuId === fileId ? null : fileId);
  };

  const handleDownload = async (fileId) => {
    try {
      const response = await filesAPI.downloadFile(fileId);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'download';
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
      setOpenMenuId(null);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleDelete = (fileId) => {
    if (window.confirm('Are you sure?')) {
      // Your delete mutation here
      toast.success('File deleted');
      setOpenMenuId(null);
    }
  };

  if (isLoading) return <Layout><div className="text-center py-20">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumb */}
        <Link to="/files" className="flex items-center gap-2 text-primary-600 hover:underline mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back to My Files
        </Link>

        <h1 className="text-gray-900 dark:text-white text-3xl font-bold mb-8 flex items-center gap-3">
          <FolderOpen className="w-10 h-10 text-primary-600" />
          {folder?.title || 'Folder'}
        </h1>

        {files.length === 0 ? (
          <p className="text-center text-gray-500 py-20 text-gray-600 dark:text-gray-300">This folder is empty</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => {
              const isMenuOpen = openMenuId === file._id;
              return (
                <div key={file._id} className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg p-6 cursor-pointer" onClick={() => setPreviewFile(file)}>
                  <div className="flex items-start justify-between mb-3">
                    <FileText className="w-8 h-8 text-primary-600" />
                    <div className="relative" ref={isMenuOpen ? menuRef : null} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleMenu(file._id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                          <button onClick={() => handleDownload(file._id)} className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left rounded-t-lg">
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <button onClick={() => handleDelete(file._id)} className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left text-red-600 rounded-b-lg border-t">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:bg-gray-800 mb-1 truncate">{file.title}</h3>
                  {file.description && <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 ">{file.description}</p>}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <span>{formatBytes(file.size)}</span>
                    <span className={`px-2 py-1 rounded text-xs ${file.visibility === 'public' ? 'bg-green-100 text-green-700' : file.visibility === 'password' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {file.visibility}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    <span>{file.downloads} downloads</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
        />
      )}
    </Layout>
  );
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default FolderViewPage;

