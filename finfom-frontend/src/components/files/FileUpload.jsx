import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { filesAPI } from '../../api/files';
import { groupsAPI } from '../../api/groups';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import Input from '../common/Input';
import { useQueryClient } from '@tanstack/react-query';

const FileUpload = ({ onSuccess, onClose }) => {
  const [file, setFile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const queryClient = useQueryClient(); 
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    visibility: 'private',
    password: '',
  });
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Load existing groups when component mounts

  useEffect(() => {
  const loadGroups = async () => {
    try {
      const response = await groupsAPI.getAllGroups();
      setGroups(response.data.data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Failed to load groups');
    }
  };
  loadGroups();
}, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (!formData.title) {
        setFormData({ ...formData, title: e.dataTransfer.files[0].name });
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!formData.title) {
        setFormData({ ...formData, title: e.target.files[0].name });
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const response = await groupsAPI.createOrGetGroup({ groupName: newGroupName.trim() });
      if (response.success) {
        const group = response.data;
        setGroups(prev => [...prev, group]);
        setSelectedGroupId(group._id);
        setNewGroupName('');
        setIsCreatingNewGroup(false);
        toast.success('Group created successfully');
      }
    } catch (error) {
      if (error.response?.data?.exists) {
        const group = error.response.data.data;
        setSelectedGroupId(group._id);
        setNewGroupName('');
        setIsCreatingNewGroup(false);
        toast.success('Group already exists and has been selected');
      } else {
        toast.error(error.response?.data?.message || 'Failed to create group');
      }
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!file) {
    return toast.error('Please select a file');
  }

  if (!selectedGroupId) {
    return toast.error('Please select or create a group');
  }

  if (!formData.description.trim()) {
    return toast.error('Description is required');
  }


  setUploading(true);
  const uploadData = new FormData();
  uploadData.append('file', file);
  uploadData.append('title', formData.title);
  uploadData.append('description', formData.description);
  uploadData.append('groupId', selectedGroupId);
  uploadData.append('visibility', formData.visibility);

  if (formData.visibility === 'password' && formData.password.trim()) {
    uploadData.append('password', formData.password);
  }

  try {
  const response = await filesAPI.uploadFile(uploadData);

  // Accept both 200 (version) and 201 (new file) as success

  if (response.status === 200 || response.status === 201) {
    if (response.data.isNewVersion) {
      toast.success(
        response.data.message || `New version uploaded (v${response.data.data.currentVersion})`
      );
    } else {
    toast.success(response.data.message || 'File uploaded successfully!');
  }
   queryClient.invalidateQueries({ queryKey: ['myFiles'] });

  // Reset form and close
  onSuccess?.(response.data.data);
  onClose();
}
  } catch (error) {
    toast.error(error.response?.data?.message || 'Upload failed');
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black  bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Upload File</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
            }`}
          >
            {file ? (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-green-500" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-gray-600">Drag & drop your file here</p>
                <p className="text-sm text-gray-500">or</p>
                <label className="btn-primary inline-block cursor-pointer">
                  Browse Files
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3 items-end">
              <select
                value={selectedGroupId}
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  setIsCreatingNewGroup(false);
                  setNewGroupName('');
                }}
                className="input-field flex-1"
                required
              >
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group._id} value={group._id}>
                    {group.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsCreatingNewGroup(!isCreatingNewGroup)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
              >
                {isCreatingNewGroup ? 'Cancel' : '+ New Group'}
              </button>
            </div>

            {isCreatingNewGroup && (
              <div className="mt-3 flex gap-3">
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter name for new group"
                  className="flex-1"
                />
                <Button type="button" onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                  Create Group
                </Button>
              </div>
            )}
          </div>

          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="My Document"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description is required..."
              className="input-field"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              className="input-field"
            >
              <option value="private">Private (Only you)</option>
              <option value="public">Public (Anyone can view)</option>
              <option value="password">Password Protected</option>
            </select>
          </div>

          {formData.visibility === 'password' && (
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
              required
            />
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={uploading} className="flex-1">
              {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileUpload;