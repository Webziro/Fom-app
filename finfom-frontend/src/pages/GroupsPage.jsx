import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsAPI } from '../api/groups';
import Layout from '../components/layout/Layout';
import { FolderOpen, Plus, Trash2, Edit, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const GroupsPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['myGroups'],
    queryFn: groupsAPI.getMyGroups,
  });

  const createMutation = useMutation({
    mutationFn: groupsAPI.createGroup,
    onSuccess: () => {
      toast.success('Group created successfully');
      queryClient.invalidateQueries(['myGroups']);
      setShowCreate(false);
      setFormData({ title: '', description: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create group');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: groupsAPI.deleteGroup,
    onSuccess: () => {
      toast.success('Group deleted successfully');
      queryClient.invalidateQueries(['myGroups']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    },
  });

  const groups = data?.data?.data || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = (groupId) => {
    if (window.confirm('Are you sure? This will unlink all files from this group.')) {
      deleteMutation.mutate(groupId);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Group
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="card text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No groups yet</p>
            <Button onClick={() => setShowCreate(true)}>Create Your First Group</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div key={group._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-8 h-8 hover:bg-[#1d4ed8]" />
                    <h3 className="font-semibold text-gray-900">{group.title}</h3>
                  </div>
                  <button
                    onClick={() => handleDelete(group._id)}
                    className="p-1 hover:bg-red-50 rounded text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {group.description && (
                  <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="w-4 h-4" />
                  <span>{group.fileCount || 0} files</span>
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create Group</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Group Name"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Work Documents"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description..."
                  className="input-field"
                  rows="3"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" loading={createMutation.isLoading} className="flex-1">
                  Create Group
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default GroupsPage;