import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAPI } from '../../api/files';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import { FolderPlus, X } from 'lucide-react';

const FolderCreateModal = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => filesAPI.createFolder(data),
    onSuccess: () => {
      toast.success('Folder created successfully');
      queryClient.invalidateQueries({ queryKey: ['myFolders'] });
      queryClient.invalidateQueries({ queryKey: ['myFiles'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create folder');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Folder name is required');
      return;
    }
    mutation.mutate({ title: title.trim(), description: description.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <FolderPlus className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold">Create New Folder</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Documents"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this folder for?"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? 'Creating...' : 'Create Folder'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FolderCreateModal;
