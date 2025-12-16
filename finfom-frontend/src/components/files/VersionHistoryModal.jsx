import { X, Download, Clock } from 'lucide-react';

const VersionHistoryModal = ({ file, onClose }) => {
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
                <button
                  onClick={() => handleDownloadVersion(version.secureUrl)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;