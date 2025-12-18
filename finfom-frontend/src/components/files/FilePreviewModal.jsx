import { X, Download, FileText, Calendar, User as UserIcon, HardDrive, History, Lock } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import VersionHistoryModal from './VersionHistoryModal';
import { filesAPI } from '../../api/files';

const FilePreviewModal = ({ file, onClose, onDownload, currentUserId }) => {
  const [imageError, setImageError] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Password state
  const [password, setPassword] = useState('');
  const [submittedPassword, setSubmittedPassword] = useState(false);
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);

  if (!file) return null;

  const isOwner = file.uploaderId?._id === currentUserId;
  const needsPassword = file.visibility === 'password' && !isOwner && !isPasswordCorrect;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error('Password is required');
      return;
    }

    setCheckingPassword(true);
    try {
      const response = await filesAPI.verifyFilePassword(file._id, { password });

      if (response.data.success) {
        setIsPasswordCorrect(true);
        toast.success('Password correct! Enjoy the file');
      } else {
        toast.error('Incorrect password');
      }
    } catch (error) {
      toast.error('Failed to verify password');
    } finally {
      setCheckingPassword(false);
      setSubmittedPassword(true);
    }
  };

  const getFileType = () => {
    const fileType = file.fileType?.toLowerCase() || '';
    if (fileType.startsWith('image/')) return 'image';
    if (fileType === 'application/pdf') return 'pdf';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    if (fileType.startsWith('text/') || fileType === 'application/json') return 'text';
    return 'other';
  };

  const fileType = getFileType();

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderPreview = () => {
    switch (fileType) {
      case 'image':
        return (
          <div className="dark:bg-gray-800 flex items-center justify-center bg-gray-100 rounded-lg p-4 min-h-[400px]">
            {imageError ? (
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Unable to load image preview</p>
              </div>
            ) : (
              <img
                src={file.secureUrl}
                alt={file.title}
                className="max-w-full max-h-[600px] object-contain rounded"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        );

      case 'pdf':
        return (
          <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '600px' }}>
            <iframe
              src={file.secureUrl}
              className="w-full h-full"
              title={file.title}
            />
          </div>
        );

      case 'video':
        return (
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              src={file.secureUrl}
              controls
              className="w-full max-h-[600px]"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8 min-h-[200px]">
            <div className="w-full max-w-md">
              <div className="text-center mb-4">
                <FileText className="w-16 h-16 text-primary-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">{file.title}</p>
              </div>
              <audio
                src={file.secureUrl}
                controls
                className="w-full"
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="bg-gray-100 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-auto">
            <iframe
              src={file.secureUrl}
              className="w-full h-full min-h-[400px]"
              title={file.title}
            />
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center bg-gray-100 rounded-lg p-12 min-h-[400px]">
            <div className="text-center">
              <FileText className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">{file.title}</p>
              <p className="text-sm text-gray-600 mb-4">Preview not available for this file type</p>
              <button
                onClick={() => onDownload(file._id)}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <Download className="w-4 h-4" />
                Download to view
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
              {file.title}
              {file.visibility === 'password' && <Lock className="w-5 h-5 text-yellow-600" />}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {file.fileType} • {formatBytes(file.size)}
              {file.currentVersion > 1 && (
                <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                  v{file.currentVersion}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Version History */}
            {file.currentVersion > 1 && (
              <button
                onClick={() => setShowVersionHistory(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                title="Version History"
              >
                <History className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}

            {/* Download (disabled if password needed) */}
            <button
              onClick={() => onDownload(file._id)}
              disabled={needsPassword}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {needsPassword ? (
            // Password Prompt
            <div className="p-12 text-center">
              <Lock className="w-20 h-20 text-yellow-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-3">This file is password protected</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Enter the password to view or download the file
              </p>
              <form onSubmit={handlePasswordSubmit} className="max-w-sm mx-auto space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={checkingPassword}
                  className="w-full btn-primary py-3"
                >
                  {checkingPassword ? 'Checking...' : 'Unlock File'}
                </button>
              </form>
              {submittedPassword && !isPasswordCorrect && (
                <p className="text-red-600 mt-4">Incorrect password. Please try again.</p>
              )}
            </div>
          ) : (
            // Normal Preview
            <>
              <div className="p-4">{renderPreview()}</div>

              {/* Footer */}
              <div className="border-t p-4 bg-gray-50 dark:bg-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {file.uploaderId && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <UserIcon className="w-4 h-4" />
                      <span>Uploaded by {file.uploaderId.username || 'Unknown'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <HardDrive className="w-4 h-4" />
                    <span>{file.downloads || 0} downloads</span>
                  </div>
                </div>
                {file.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 pt-3 border-t">
                    {file.description}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Version History Modal */}
        {showVersionHistory && (
          <VersionHistoryModal
            file={file}
            onClose={() => setShowVersionHistory(false)}
          />
        )}
      </div>
    </div>
  );
};

export default FilePreviewModal;