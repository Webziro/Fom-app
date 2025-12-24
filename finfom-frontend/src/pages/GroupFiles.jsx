import { useQuery } from '@tanstack/react-query';
import { filesAPI } from '../../api/files';

const GroupFiles = ({ groupId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['groupFiles', groupId],
    queryFn: () => filesAPI.getGroupFiles(groupId),
    enabled: !!groupId,
  });
  

  if (isLoading) return <div>Loading files...</div>;
  if (error) return <div>Error loading files: {error.message}</div>;

  return (
    <div>
      <h2>Files in Group</h2>
      {data?.data?.length === 0 ? (
        <p>No files in this group yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map(file => (
            <div key={file._id} className="border p-4 rounded-lg">
              <h3>{file.title}</h3>
              <p>{file.description}</p>
              {/* Add preview/download */}
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupFiles;