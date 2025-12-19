import { X, Download, Clock, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { filesAPI } from '../../api/files';
import { useQueryClient } from '@tanstack/react-query';

// Utility function to format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// VersionHistoryModal Component
const VersionHistoryModal = ({ file, onClose }) => {
  const [restoring, setRestoring] = useState(false);
  const queryClient = useQueryClient();

  const versions = file.versions || [];
  const currentVersion = file.currentVersion || 1;

  const allVersions = [
    ...versions,
    {
      versionNumber: currentVersion,
      uploadedAt: file.updatedAt,
      uploadedBy: file.uploaderId,
      secureUrl: file.secureUrl,
      size: file.size,
    },
  ].sort((a, b) => b.versionNumber - a.versionNumber);

  const handleDownloadVersion = (url) => {
    window.open(url, '_blank');
  };

  // Handle restoring a version
  const handleRestore = async (versionNumber) => {
    if (!window.confirm(`Restore version ${versionNumber}? This will make it the current version.`)) {
      return;
    }

    setRestoring(true);
    try {
      const response = await filesAPI.restoreFileVersion(file._id, { versionNumber });

      toast.success(response.data.message || 'Version restored!');
      onClose();
      // Refresh file list
      queryClient.invalidateQueries({ queryKey: ['myFiles'] });
    } catch (error) {
      toast.error('Failed to restore version');
    } finally {
      setRestoring(false);
    }
  };

  // Render modal for version history
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Version History - {file.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {allVersions.map((version) => (
            <div key={version.versionNumber} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary-100 dark:bg-primary-900/30 rounded-lg p-3">
                    <Clock className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      Version {version.versionNumber}
                      {version.versionNumber === currentVersion && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Current</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Uploaded {new Date(version.uploadedAt).toLocaleDateString()}
                      {version.uploadedBy?.username && ` by ${version.uploadedBy.username}`}
                    </p>
                    <p className="text-xs text-gray-500">{formatBytes(version.size || file.size)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {version.versionNumber !== currentVersion && (
                    <button
                      onClick={() => handleRestore(version.versionNumber)}
                      disabled={restoring}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {restoring ? 'Restoring...' : 'Restore'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadVersion(version.secureUrl)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Download className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;