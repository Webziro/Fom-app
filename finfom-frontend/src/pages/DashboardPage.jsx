import { useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesAPI } from '../api/files';
import { groupsAPI } from '../api/groups';
import Layout from '../components/layout/Layout';
import { AuthContext } from '../context/AuthContext';
import { FileText, FolderOpen, Download, TrendingUp, MoreVertical, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  const { data: filesData } = useQuery({
    queryKey: ['myFiles'],
    queryFn: () => filesAPI.getMyFiles({ limit: 5 }),
  });

  const { data: groupsData } = useQuery({
    queryKey: ['myGroups'],
    queryFn: () => groupsAPI.getMyGroups(),
  });

  const deleteMutation = useMutation({
    mutationFn: filesAPI.deleteFile,
    onSuccess: () => {
      toast.success('File deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['myFiles'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete file');
    },
  });

  const files = filesData?.data?.data || [];
  const groups = groupsData?.data?.data || [];

  const handleDownload = async (fileId) => {
    try {
      const response = await filesAPI.downloadFile(fileId);
      window.open(response.data.data.downloadUrl, '_blank');
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleDelete = (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate(fileId);
    }
  };

  const stats = [
    {
      label: 'Total Files',
      value: filesData?.data?.pagination?.total || 0,
      icon: FileText,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Total Groups',
      value: groups.length,
      icon: FolderOpen,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Total Downloads',
      value: files.reduce((sum, file) => sum + (file.downloads || 0), 0),
      icon: Download,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: 'Storage Used',
      value: formatBytes(files.reduce((sum, file) => sum + (file.size || 0), 0)),
      icon: TrendingUp,
      color: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Files */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Files</h2>
            <Link to="/files" className="hover:bg-[#1d4ed8] hover:text-primary-700 text-sm">
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            {files.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No files yet. Upload your first file!</p>
            ) : (
              files.map((file) => {
                const isOwner = user?._id === file.uploaderId?._id;
                return (
                  <div
                    key={file._id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{file.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatBytes(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${file.visibility === 'public'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {file.visibility}
            )}
                    </div>
                  </div>

        {/* Recent Groups */ }
                <div className="card">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Your Groups</h2>
                    <Link to="/groups" className="hover:bg-[#1d4ed8] hover:text-primary-700 text-sm">
                      View All →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {groups.length === 0 ? (
                      <p className="text-gray-500 col-span-3 text-center py-4">
                        No groups yet. Create your first group!
                      </p>
                    ) : (
                      groups.slice(0, 3).map((group) => (
                        <div key={group._id} className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <FolderOpen className="w-5 h-5 hover:bg-[#1d4ed8]" />
                            <h3 className="font-medium">{group.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600">{group.fileCount || 0} files</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
      </div>
        </Layout>
        );
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

        export default DashboardPage;