import ShareModal from '../components/files/ShareModal'; 
import { Share2 } from 'lucide-react';  
import { useState, useContext, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAPI } from '../api/files';
import Layout from '../components/layout/Layout';
import FileUpload from '../components/files/FileUpload';
import FilePreviewModal from '../components/files/FilePreviewModal';
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
  FolderPlus,
  FolderOpen,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import FolderCreateModal from '../components/folders/FolderCreateModal';
import MoveToFolderModal from '../components/folders/MoveToFolderModal';
import FolderOptionsModal from '../components/folders/FolderOptionsModal';


//All the usestate and useeffect hooks and other logic
const FilesPage = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);
  const menuRef = useRef(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [moveFile, setMoveFile] = useState(null);
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [selectedFolder, setSelectedFolder] = useState(null);
  


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

// Fetch files with react-query
const { data, isLoading } = useQuery({
  queryKey: ['myFiles', searchTerm],
  queryFn: () => filesAPI.getMyFiles({ search: searchTerm, limit: 50, folderId: null }),
});

// const { data, isLoading } = useQuery({
//   queryKey: ['accessibleFiles', searchTerm],
//   queryFn: () => filesAPI.getAllAccessibleFiles({ search: searchTerm, limit: 50, folderId: null }),
// });

// Fetch folders with react-query
const { data: foldersData } = useQuery({
  queryKey: ['folders'],
  queryFn: filesAPI.getMyFolders,
});
const folders = foldersData?.data?.data || [];

// Delete mutation for files
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

// New state for Share Modal
const [shareFile, setShareFile] = useState(null);  // New

const handleDownload = async (fileId) => {
  try {
    console.log(`[Download] Starting for: ${fileId}`);
    const response = await filesAPI.downloadFile(fileId);
    if (!response || !response.data) throw new Error('Invalid response');
    
    console.log('[Download] Response status:', response.status);
    console.log('[Download] Response data type:', typeof response.data, response.data instanceof Blob);
    
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'download';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        try {
          fileName = decodeURIComponent(match[1]);
        } catch (e) {
          fileName = match[1];
        }
      }
    }
    
    console.log('[Download] Type:', contentType, 'Name:', fileName);
    console.log('[Download] Blob size:', response.data.size, 'bytes');
    
    // Check if blob has content
    if (!response.data || response.data.size === 0) {
      throw new Error('File is empty or not received from server');
    }
    
    // Ensure blob has correct MIME type
    let blob = response.data;
    if (blob.type !== contentType) {
      console.log('[Download] Re-creating blob with correct type:', contentType);
      blob = new Blob([blob], { type: contentType });
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    console.log('[Download] Triggering browser download...');
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('[Download] Complete');
    }, 100);
    
    toast.success('Download started');
    setOpenMenuId(null);
  } catch (error) {
    console.error('[Download] Error:', error.message);
    let msg = 'Failed to download file';
    if (error.response?.status === 403) msg = 'No permission to download this file';
    else if (error.response?.status === 404) msg = 'File not found on server';
    else if (error.message?.includes('empty')) msg = 'File is empty or corrupted';
    toast.error(msg);
  }
};

// Delete handler
const handleDelete = (fileId) => {
  if (window.confirm('Are you sure you want to delete this file?')) {
    deleteMutation.mutate(fileId);
  }
};

//toggle menu
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
        <div className="card dark:bg-gray-800 p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative ">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search files... Title, description, uploader, etc."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field  h-20 w-full pl-10 rounded-lg "
              />
            </div>
            <button className="btn-secondary flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter
            </button>
          </div>
        </div>

{/* Folders Section */}
{folders.length > 0 && (
  <div className="mb-8">
    <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">My Folders</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {folders.map((folder) => (
        <div
          key={folder._id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow p-6 border border-gray-200 hover:border-primary-300 relative group"
        >
          {/* Three-Dots Button */}
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent navigating to folder view
                setSelectedFolder(folder);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>

      {/* Card Content - Click to open folder */}
      <div
        className="h-full cursor-pointer"
        onClick={() => navigate(`/folders/${folder._id}`)}
      >
        <div className="flex items-center gap-3 mb-3">
          <FolderOpen className="w-10 h-10 text-primary-600" />
          <h3 className="font-medium text-gray-700 dark:text-gray-100">{folder.title}</h3>
        </div>
        {folder.description && <p className="text-sm text-gray-600 dark:text-gray-100">{folder.description}</p>}
        <p className="text-xs text-gray-500 mt-3 dark:text-gray-100">
          Created {new Date(folder.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  ))}
</div>
</div>
)}

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
        <div key={file._id} className="card hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800" 
          onClick={async () => {
          await queryClient.invalidateQueries({ 
            queryKey: ['myFiles'] 
          });
            setTimeout(() => setPreviewFile(file), 100);
          }}
        >
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
  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border z-10">
    {/* Share Button */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (file.visibility === 'public' || isOwner) {
          setShareFile(file);
        } else {
          toast.error('Only the owner can share private files');
        }
        setOpenMenuId(null);
      }}
      className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-500 text-left rounded-t-lg text-gray-800 dark:text-gray-200"
      disabled={file.visibility !== 'public' && !isOwner}
      style={{ opacity: (file.visibility !== 'public' && !isOwner) ? 0.5 : 1 }}
    >
      <Share2 className="w-4 h-4" />
      Share
    </button>

    {/* Move to Folder*/}
    <button
      onClick={(e) => {
        e.stopPropagation();
        setMoveFile(file);
        setOpenMenuId(null);
      }}
      className="flex items-center gap-2 w-full px-4 py-2  hover:bg-gray-500 text-left rounded-t-lg text-gray-800 dark:text-gray-200"
    >
      <FolderOpen className="w-4 h-4" />
        Move to Folder
    </button>

    {moveFile && (
      <MoveToFolderModal
        file={moveFile}
        folders={folders}
        onClose={() => setMoveFile(null)}
      />
    )}  

    {/* Download */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleDownload(file._id);
      }}
      className="flex items-center gap-2 w-full px-4 py-2  hover:bg-gray-500 text-left rounded-t-lg text-gray-800 dark:text-gray-200"
    >
      <Download className="w-4 h-4" />
      Download
    </button>

    {/* Delete */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleDelete(file._id);
      }}
      className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left text-red-600 rounded-b-lg border-t"
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

    <h3 className="font-semibold text-gray-900 mb-1 truncate dark:text-gray-100">{file.title}</h3>
    {file.description && (
      <p className="text-sm text-gray-600 mb-3 line-clamp-2 dark:text-gray-100">{file.description}</p>
    )}

    <div className="flex items-center justify-between text-sm text-gray-500 mb-2 dark:text-gray-100">
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
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 dark:text-gray-100">
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

      {showCreateFolder && (
        <FolderCreateModal onClose={() => setShowCreateFolder(false)} />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 text-gray-600 dark:text-gray-300">My Files</h1>
        <div className="flex gap-3 text-gray-600 dark:text-gray-300">
          <Button
            onClick={() => setShowCreateFolder(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FolderPlus className="w-5 h-5 " />
            New Folder
          </Button>
          <Button onClick={() => setShowUpload(true)} className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload File
          </Button>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
          currentUserId={user?.id}
        />
      )}

      {/* New Share Modal */}
      {shareFile && (
        <ShareModal
          file={shareFile}
          onClose={() => setShareFile(null)}
        />
      )}

      {/* Folder Options Modal */}
      {selectedFolder && (
        <FolderOptionsModal
          folder={selectedFolder}
          onClose={() => setSelectedFolder(null)}
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
