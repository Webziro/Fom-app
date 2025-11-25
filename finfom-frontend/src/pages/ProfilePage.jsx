import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../api/auth';
import Layout from '../components/layout/Layout';
import { User, Mail, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const ProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.updateProfile(profileData);
      toast.success('Profile updated successfully');
      // Update local storage
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'border-primary-600 hover:bg-[#1d4ed8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'password'
                  ? 'border-primary-600 hover:bg-[#1d4ed8]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Change Password
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 hover:bg-[#1d4ed8]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user?.username}</h2>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <Input
                label="Username"
                value={profileData.username}
                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                placeholder="johndoe"
              />

              <Input
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="john@example.com"
              />

              <Button type="submit" loading={loading} className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                Save Changes
              </Button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold">Change Password</h2>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                placeholder="••••••••"
                required
              />

              <Input
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="••••••••"
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                placeholder="••••••••"
                required
              />

              <Button type="submit" loading={loading} className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Update Password
              </Button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;