import { useQuery } from '@tanstack/react-query';
import { filesAPI } from '../../api/files'; // Adjust if needed

const GroupFiles = ({ groupId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['groupFiles', groupId],
    queryFn: () => filesAPI.getGroupFiles(groupId),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Files in Group</h2>
      {data?.data?.map(file => (
        <div key={file._id}>
          <p>{file.title}</p>
          {/* Add more file details */}
        </div>
      ))}
    </div>
  );
};

export default GroupFiles;