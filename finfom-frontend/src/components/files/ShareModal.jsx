import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAPI } from '../../api/files';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Copy, Check, Globe, Lock, Share2, AlertCircle } from 'lucide-react';
import Button from '../common/Button';

const ShareModal = ({ file, onClose }) => {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(file.visibility === 'public');

  const shareUrl = `${window.location.origin}/public/${file._id}`;

  // Mutation to update visibility (reuse your existing API)
  const updateMutation = useMutation({
    mutationFn: (data) => filesAPI.updateFile(file._id, data),
    onSuccess: () => {
      setIsPublic(true);
      toast.success('File is now public and shareable!');
      queryClient.invalidateQueries({ queryKey: ['myFiles'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update file');
    },
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMakePublic = () => {
    if (updateMutation.isPending) return;
    updateMutation.mutate({ visibility: 'public' });
  };

  // Close on Escape or backdrop click
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Share "{file.title}"</h2>
          <p className="text-gray-600">{file.description?.substring(0, 100)}...</p>
        </div>

        {/* Toggle Public */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {isPublic ? <Globe className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-gray-500" />}
              <div>
                <p className="font-medium text-gray-900">Make Public</p>
                <p className="text-sm text-gray-600">Anyone with the link can view and download</p>
              </div>
            </div>
            <Button
              onClick={handleMakePublic}
              disabled={isPublic || updateMutation.isPending}
              variant="outline"
              size="sm"
              className={`${
                isPublic ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {updateMutation.isPending ? 'Updating...' : isPublic ? 'Public' : 'Make Public'}
            </Button>
          </div>

          {!isPublic && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
              <AlertCircle className="w-4 h-4" />
              <span>File must be public to share. This action is reversible.</span>
            </div>
          )}
        </div>

        {/* Share Link & QR (only if public) */}
        {isPublic && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                Shareable Link
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 truncate"
                />
                <Button
                  onClick={handleCopy}
                  size="sm"
                  className="px-4"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-lg border">
              <QRCodeCanvas value={shareUrl} size={160} />
            </div>

            <p className="text-xs text-gray-500 text-center">
              Anyone with this link can download the file ({formatBytes(file.size)})
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Reuse your formatBytes from FilesPage
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default ShareModal;