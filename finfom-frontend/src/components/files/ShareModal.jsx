import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAPI } from '../../api/files';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Copy, Check, Globe, Lock, Share2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Button from '../common/Button';

const ShareModal = ({ file, onClose }) => {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState(file.visibility === 'public' ? 'public' : file.visibility === 'password' ? 'password' : 'private');
  const [isUpdating, setIsUpdating] = useState(false);

  const shareUrl = `${window.location.origin}/public/${file._id}`;

  const updateMutation = useMutation({
    mutationFn: (data) => filesAPI.updateFile(file._id, data),
    onSuccess: () => {
      toast.success('Share settings updated!');
      queryClient.invalidateQueries({ queryKey: ['myFiles'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update');
    },
    onSettled: () => setIsUpdating(false),
  });

  const handleSave = () => {
    if (isUpdating) return;
    setIsUpdating(true);

    const data = {
      visibility: mode === 'private' ? 'private' : mode === 'public' ? 'public' : 'password',
    };
    if (mode === 'password' && password) {
      data.password = password;
    }

    updateMutation.mutate(data);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const isShareable = mode === 'public' || mode === 'password';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Share "{file.title}"</h2>
        </div>

        {/* Sharing Mode Selection */}
        <div className="space-y-4 mb-6">
          <div className="border rounded-lg overflow-hidden">
            <label className={`flex items-center justify-between p-4 cursor-pointer transition ${mode === 'private' ? 'bg-gray-50' : ''}`}>
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">Private</p>
                  <p className="text-sm text-gray-600">Only you can access</p>
                </div>
              </div>
              <input type="radio" name="mode" value="private" checked={mode === 'private'} onChange={() => setMode('private')} className="w-5 h-5 text-primary-600" />
            </label>

            <label className={`flex items-center justify-between p-4 border-t cursor-pointer transition ${mode === 'password' ? 'bg-gray-50' : ''}`}>
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Password Protected</p>
                  <p className="text-sm text-gray-600">Anyone with password can access</p>
                </div>
              </div>
              <input type="radio" name="mode" value="password" checked={mode === 'password'} onChange={() => setMode('password')} className="w-5 h-5 text-primary-600" />
            </label>

            <label className={`flex items-center justify-between p-4 border-t cursor-pointer transition ${mode === 'public' ? 'bg-gray-50' : ''}`}>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Public</p>
                  <p className="text-sm text-gray-600">Anyone with link can access</p>
                </div>
              </div>
              <input type="radio" name="mode" value="public" checked={mode === 'public'} onChange={() => setMode('public')} className="w-5 h-5 text-primary-600" />
            </label>
          </div>

          {/* Password Input */}
          {mode === 'password' && (
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (leave blank to remove)"
                className="w-full px-4 py-3 border rounded-lg pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isUpdating}
          className="w-full mb-4"
          size="lg"
        >
          {isUpdating ? 'Saving...' : 'Save Settings'}
        </Button>

        {/* Share Link (Only if shareable) */}
        {isShareable && (
          <div className="space-y-4 border-t pt-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 mb-3">
                {mode === 'password' ? 'Password-protected link' : 'Public link'}
              </p>
              <div className="flex gap-2">
                <input readOnly value={shareUrl} className="flex-1 px-3 py-2 border rounded-md text-sm bg-white truncate" />
                <Button onClick={handleCopy} size="sm">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-center p-4 bg-white rounded-lg border">
              <QRCodeCanvas value={shareUrl} size={160} level="H" includeMargin />
            </div>

            <p className="text-xs text-gray-500 text-center">
              {mode === 'password' ? 'Recipients must enter the password to access' : 'Anyone with this link can download'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default ShareModal;