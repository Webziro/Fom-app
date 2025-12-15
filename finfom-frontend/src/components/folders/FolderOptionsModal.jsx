import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAPI } from '../../api/files';
import toast from 'react-hot-toast';
import { Edit2, Trash2, X } from 'lucide-react';
import Button from '../common/Button';

const FolderOptionsModal = ({ folder, onClose }) => {
  const [title, setTitle] = useState(folder.title);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: () => filesAPI.updateFolder(folder._id, { title }),
    onSuccess: () => {
      toast.success('Folder renamed successfully');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['myFiles'] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => filesAPI.deleteFolder(folder._id),
    onSuccess: () => {
      toast.success('Folder deleted');
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['myFiles'] });
      onClose();
    },
  });

  const handleRename = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Folder name is required');
      return;
    }
    updateMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm('Delete this folder and all files inside? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-600 dark:text-gray-300">Folder Options</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Rename Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Edit2 className="w-5 h-5 "  />
              Rename Folder
            </h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleRename} className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Name'}
              </Button>
            </form>
          ) : (
            <p className="text-gray-700 pl-7">{folder.title}</p>
          )}
        </div>

        {/* Delete Section */}
        <div className="pt-6 border-t">
          <h3 className="font-medium flex items-center gap-2 text-red-600 mb-3">
            <Trash2 className="w-5 h-5" />
            Delete Folder
          </h3>
          <p className="text-sm text-gray-600 mb-4  text-gray-900 dark:text-white">
            This will delete the folder and all files inside. This action cannot be undone.
          </p>
          <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Folder'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FolderOptionsModal;