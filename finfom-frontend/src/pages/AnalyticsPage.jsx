import { useQuery } from '@tanstack/react-query';
import { filesAPI } from '../api/files';
import { TrendingUp, Download, Clock, Activity, BarChart3 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import Button from '../components/common/Button';
import { useIsFetching } from '@tanstack/react-query';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AnalyticsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: filesAPI.getAnalytics,
  });

  const analytics = data?.data || {};

  const chartData = analytics.downloadsByDate?.map(d => ({
    date: new Date(d._id).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    downloads: d.downloads,
  })) || [];

  const pieData = analytics.fileTypes?.map(t => ({
    name: t._id.split('/')[1]?.toUpperCase() || t._id.split('/')[0].toUpperCase(),
    value: t.count,
    size: Math.round(t.size / 1024 / 1024), // MB
  })) || [];

  // Invalidate queries for auto-refresh and focus refresh
  const queryClient = useQueryClient();

   const topFiles = analytics.topFiles || [];

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [queryClient]);

  // Refresh when tab/window comes into focus (e.g., after download in another tab)
  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryClient]);

 

  if (isLoading) return <Layout><div className="text-center py-20">Loading advanced analytics...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-primary-600" />
            Advanced Analytics
          </h1>

          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['analytics'] })}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${useIsFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <p className="text-gray-600">Deep insights into your file activity</p>
        </div>

        {/* Advanced Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Downloads Over Time */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <h2 className="text-xl font-bold">Downloads Over Time</h2>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="downloads" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No download activity yet</p>
              </div>
            )}
          </div>

          {/* File Type Distribution + Storage */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-8 h-8 text-purple-600" />
              <h2 className="text-xl font-bold">File Types & Storage</h2>
            </div>
            {pieData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} files`} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">Storage by Type</h3>
                  {pieData.map((type, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        <span>{type.name}</span>
                      </div>
                      <span className="font-medium">{type.size} MB</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500">
                <p>No files uploaded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Heatmap (Simple Bar for Recent Days) */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-8 h-8 text-green-600" />
            <h2 className="text-xl font-bold">Recent Activity (Last 7 Days)</h2>
          </div>
          {chartData.slice(-7).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="downloads" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">No recent activity</p>
          )}
        </div>

        {/* Top 10 Most Downloaded Files */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-6">
            <Download className="w-8 h-8 text-orange-600" />
            <h2 className="text-xl font-bold">Top 10 Most Downloaded Files</h2>
          </div>
          {topFiles.length > 0 ? (
            <div className="space-y-4">
              {topFiles.map((file, i) => (
                <div key={file._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-400 w-12 text-center">#{i + 1}</span>
                    <div>
                      <p className="font-medium">{file.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(file.createdAt).toLocaleDateString()} • {file.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">{file.downloads}</p>
                    <p className="text-sm text-gray-500">downloads</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No downloads recorded yet</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;