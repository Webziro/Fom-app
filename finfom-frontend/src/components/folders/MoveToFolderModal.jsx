import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAPI } from '../../api/files';
import toast from 'react-hot-toast';
import { FolderOpen, X } from 'lucide-react';
import Button from '../common/Button';

const MoveToFolderModal = ({ file, folders, onClose }) => {
  const [selectedFolder, setSelectedFolder] = useState('');
  const queryClient = useQueryClient();

  const moveMutation = useMutation({
    mutationFn: () => filesAPI.updateFile(file._id, { folderId: selectedFolder || null }),
    onSuccess: () => {
      toast.success('File moved successfully!');
      queryClient.invalidateQueries({ queryKey: ['myFiles'] });
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to move file');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    moveMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-primary-600" />
            Move "{file.title}" to Folder
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-700 dark:text-gray-300 block text-sm font-medium text-gray-700 mb-2">
              Select Folder
            </label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Root (No Folder)</option>
              {folders.map((folder) => (
                <option key={folder._id} value={folder._id}>
                  {folder.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={moveMutation.isPending}
              className="flex-1"
            >
              {moveMutation.isPending ? 'Moving...' : 'Move File'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MoveToFolderModal;