// src/components/files/FileUpload.tsx
import { useState, useEffect } from 'react';
import { groupsAPI } from '../../api/groups';
import { filesAPI } from '../../api/files';
import toast from 'react-hot-toast';
import {
  X,
  Upload,
  Globe,
  Lock,
  Key,
  AlertCircle,
} from 'lucide-react';

interface FileUploadProps {
  onSuccess: () => void;
  onClose: () => void;
}

const FileUpload = ({ onSuccess, onClose }: FileUploadProps) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'password'>('public');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load all groups
  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      try {
        const res = await groupsAPI.getMyGroups();
        setGroups(res.data || []);
      } catch (err) {
        toast.error('Failed to load groups');
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await groupsAPI.createGroup({ title: newGroupName.trim() });
      setGroups([...groups, res.data]);
      setSelectedGroupId(res.data._id);
      setNewGroupName('');
      setIsCreatingNewGroup(false);
      toast.success('Group created!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return toast.error('Please select a file');
    if (!selectedGroupId) return toast.error('Please select or create a group');
    if (!description.trim()) return toast.error('Description is required');

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', title || selectedFile.name);
    formData.append('description', description);
    formData.append('groupId', selectedGroupId);
    formData.append('visibility', visibility);
    if (visibility === 'password' && password) formData.append('password', password);

    try {
      await filesAPI.uploadFile(formData);
      toast.success('File uploaded successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-6 h-6" />
            Upload File
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* File Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer"
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-600">
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <select
                value={selectedGroupId}
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  setIsCreatingNewGroup(false);
                  setNewGroupName('');
                }}
                className="flex-1 input-field"
                disabled={loading}
              >
                <option value="">{loading ? 'Loading groups...' : 'Select a group'}</option>
                {groups.map((g) => (
                  <option key={g._id} value={g._id}>
                    {g.title} ({g.fileCount || 0} files)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsCreatingNewGroup(!isCreatingNewGroup)}
                className="px-4 py-2 btn-secondary whitespace-nowrap"
              >
                {isCreatingNewGroup ? 'Cancel' : '+ New Group'}
              </button>
            </div>

            {isCreatingNewGroup && (
              <div className="mt-4 flex gap-3">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="flex-1 input-field"
                />
                <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                  Create
                </Button>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank to use file name"
              className="input-field w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe your file..."
              className="input-field w-full resize-none"
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  visibility === 'public'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Globe className="w-6 h-6" />
                <span className="font-medium">Public</span>
                <span className="text-xs text-gray-600">Everyone can see</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  visibility === 'private'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Lock className="w-6 h-6" />
                <span className="font-medium">Private</span>
                <span className="text-xs text-gray-600">Only you</span>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('password')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  visibility === 'password'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Key className="w-6 h-6" />
                <span className="font-medium">Password</span>
                <span className="text-xs text-gray-600">Password protected</span>
              </button>
            </div>

            {visibility === 'password' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="input-field w-full"
                />
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Anyone with this password can view & download
                </p>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !selectedGroupId || !description.trim()}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                'Upload File'
              )}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;