import { X, Download, FileText, Calendar, User as UserIcon, HardDrive } from 'lucide-react';
import { useState } from 'react';

const FilePreviewModal = ({ file, onClose, onDownload }) => {
    const [imageError, setImageError] = useState(false);

    if (!file) return null;

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
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-semibold text-gray-900 truncate">{file.title}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {file.fileType} • {formatBytes(file.size)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <button
                            onClick={() => onDownload(file._id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Download"
                        >
                            <Download className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Close"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-auto p-4">
                    {renderPreview()}
                </div>

                {/* Footer with metadata */}
                <div className="border-t p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {file.uploaderId && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <UserIcon className="w-4 h-4" />
                                <span>Uploaded by {file.uploaderId.username || 'Unknown'}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                            <HardDrive className="w-4 h-4" />
                            <span>{file.downloads || 0} downloads</span>
                        </div>
                    </div>
                    {file.description && (
                        <p className="text-sm text-gray-600 mt-3 pt-3 border-t">
                            {file.description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
