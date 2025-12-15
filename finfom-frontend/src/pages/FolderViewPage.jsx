import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { filesAPI } from '../api/files';
import Layout from '../components/layout/Layout';
import { ArrowLeft } from 'lucide-react';

const FolderViewPage = () => {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['folderFiles', id],
    queryFn: () => filesAPI.getMyFiles({ folderId: id }),
  });

  const files = data?.data?.data || [];

  const { data: folderData } = useQuery({
    queryKey: ['folder', id],
    queryFn: () => filesAPI.getFolder(id),  // Optional: get folder name
  });

  const folder = folderData?.data;

  if (isLoading) return <Layout><div className="text-center py-20">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6">
        <Link to="/files" className="flex items-center gap-2 text-primary-600 hover:underline mb-6">
          <ArrowLeft className="w-5 h-5" />
          Back to Files
        </Link>

        <h1 className="text-3xl font-bold mb-8">
          {folder?.title || 'Folder'}
        </h1>

        {files.length === 0 ? (
          <p className="text-center text-gray-500 py-20">This folder is empty</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Reuse your file card component or simple list */}
            {files.map(file => (
              <div key={file._id} className="bg-white rounded-xl shadow p-6">
                <FileText className="w-12 h-12 text-primary-600 mb-4" />
                <h3 className="font-medium">{file.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{file.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FolderViewPage;