import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { filesAPI } from '../api/files';
import Layout from '../components/layout/Layout';
import { Home, FolderOpen } from 'lucide-react';

const FolderViewPage = () => {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['folderFiles', id],
    queryFn: () => filesAPI.getMyFiles({ folderId: id }),
  });

  const files = data?.data?.data || [];

  const { data: folderData } = useQuery({
    queryKey: ['folder', id],
    queryFn: () => filesAPI.getFolder(id),  // We'll add this API next
  });

  const folder = folderData?.data;

  if (isLoading) return <Layout><div className="text-center py-20">Loading folder...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-600">
          <Link to="/files" className="flex items-center gap-2 hover:text-primary-600">
            <Home className="w-4 h-4" />
            My Files
          </Link>
          <span>/</span>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary-600" />
            <span className="font-medium text-gray-900">{folder?.title || 'Folder'}</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <FolderOpen className="w-10 h-10 text-primary-600" />
          {folder?.title || 'Folder Contents'}
        </h1>

        {files.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FolderOpen className="w-24 h-24 mx-auto mb-4 opacity-50" />
            <p>This folder is empty</p>
            <p className="text-sm mt-2">Move files here from My Files</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Reuse your file card from FilesPage */}
            {files.map((file) => (
              <div key={file._id} className="bg-white rounded-xl shadow hover:shadow-lg p-6 cursor-pointer">
                <FileText className="w-12 h-12 text-primary-600 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">{file.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{file.description}</p>
                <div className="text-xs text-gray-500">
                  <p>{formatBytes(file.size)}</p>
                  <p>{new Date(file.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FolderViewPage;