import { useQuery } from '@tanstack/react-query';
import { filesAPI } from '../api/files';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsPage = () => {
  const { data: filesData, isLoading } = useQuery({
    queryKey: ['myFiles'],
    queryFn: () => filesAPI.getMyFiles({ limit: 1000 }), // Get all files
  });

  const files = filesData?.data?.data || [];

  // Calculate everything client-side like Dashboard does
  const totalDownloads = files.reduce((sum, f) => sum + (f.downloads || 0), 0);
  const storageUsed = files.reduce((sum, f) => sum + f.size, 0);

  const downloadsByDate = files.reduce((acc, file) => {
    const date = new Date(file.updatedAt).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + (file.downloads || 0);
    return acc;
  }, {});

  const chartData = Object.keys(downloadsByDate)
    .map(date => ({
      date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      downloads: downloadsByDate[date],
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const fileTypes = files.reduce((acc, file) => {
    const type = file.fileType || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(fileTypes).map(type => ({
    name: type.split('/')[1]?.toUpperCase() || type,
    value: fileTypes[type],
  }));

  const topFiles = files
    .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
    .slice(0, 10);

  if (isLoading) return <Layout><div className="text-center py-20">Loading analytics...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="w-10 h-10 text-primary-600" />
          Advanced Analytics
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Downloads Over Time */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Downloads Over Time
            </h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="downloads" stroke="#2563eb" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-20">No download activity yet</p>
            )}
          </div>

          {/* File Types */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">File Types Distribution</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-20">No files yet</p>
            )}
          </div>
        </div>

        {/* Top Files */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Top 10 Most Downloaded Files</h2>
          {topFiles.length > 0 ? (
            <div className="space-y-4">
              {topFiles.map((file, i) => (
                <div key={file._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400">#{i + 1}</span>
                    <div>
                      <p className="font-medium">{file.title}</p>
                      <p className="text-sm text-gray-500">{new Date(file.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">{file.downloads || 0}</p>
                    <p className="text-sm text-gray-500">downloads</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No downloads yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;