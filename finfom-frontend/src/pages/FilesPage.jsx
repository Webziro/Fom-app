import { useState, useContext, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAPI } from '../api/files';
import Layout from '../components/layout/Layout';
import FileUpload from '../components/files/FileUpload';
import { AuthContext } from '../context/AuthContext';
import {
  Upload,
  Search,
  Filter,
  FileText,
  Download,
  Trash2,
  MoreVertical,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';

const FilesPage = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['myFiles', searchTerm],
    queryFn: () => filesAPI.getMyFiles({ search: searchTerm, limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: filesAPI.deleteFile,
    onSuccess: () => {
      toast.success('File deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['myFiles'] });
      setOpenMenuId(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete file');
    },
  });

  const files = data?.data?.data || [];

  const handleDownload = async (fileId) => {
    try {
      const response = await filesAPI.downloadFile(fileId);
      window.open(response.data.data.downloadUrl, '_blank');
      toast.success('Download started');
      setOpenMenuId(null);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleDelete = (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate(fileId);
    }
  };

  const toggleMenu = (fileId) => {
    setOpenMenuId(openMenuId === fileId ? null : fileId);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Files</h1>
          <Button onClick={() => setShowUpload(true)} className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload File
          </Button>
        </div>

        {/* Search Bar */}
        <div className="card">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <button className="btn-secondary flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter
            </button>
          </div>
        </div>

        {/* Files Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No files found</p>
            <Button onClick={() => setShowUpload(true)}>Upload Your First File</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => {
              const isOwner = user?.id === file.uploaderId?._id;
              const isMenuOpen = openMenuId === file._id;

              return (
                <div key={file._id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <FileText className="w-8 h-8 text-primary-600" />
                    <div className="relative" ref={isMenuOpen ? menuRef : null}>
                      <button
                        onClick={() => toggleMenu(file._id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                          <button
                            onClick={() => handleDownload(file._id)}
                            className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left rounded-t-lg"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <button
                            onClick={() => handleDelete(file._id)}
                            className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left text-red-600 rounded-b-lg"
                            disabled={!isOwner}
                            style={{ opacity: isOwner ? 1 : 0.5, cursor: isOwner ? 'pointer' : 'not-allowed' }}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1 truncate">{file.title}</h3>
                  {file.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{file.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <span>{formatBytes(file.size)}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${file.visibility === 'public'
                        ? 'bg-green-100 text-green-700'
                        : file.visibility === 'password'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {file.visibility}
                    </span>
                  </div>

                  {!isOwner && file.uploaderId && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <User className="w-3 h-3" />
                      <span>Uploaded by {file.uploaderId.username}</span>
                    </div>
                  )}

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

      {/* Upload Modal */}
      {showUpload && (
        <FileUpload
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['myFiles'] })}
          onClose={() => setShowUpload(false)}
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

export default FilesPage;