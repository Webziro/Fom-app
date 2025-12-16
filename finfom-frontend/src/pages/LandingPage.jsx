import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CloudUpload, 
  Share2, 
  FolderOpen, 
  BarChart3, 
  Shield, 
  Zap, 
  ArrowRight, 
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWaitlist = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Use Web3Forms (free) — get your key at https://web3forms.com
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: '19902ca7-234e-484b-bbab-91a4d15b14f0',  // Replace with your key
          email,
          subject: 'Finfom Waitlist Signup',
          message: `New waitlist signup: ${email}`,
        }),
      });

      toast.success('Welcome to the waitlist! 🚀 We\'ll notify you soon.');
      setEmail('');
    } catch (err) {
      toast.error('Something went wrong. Try again.');
    }
    setLoading(false);
  };

  const features = [
    { icon: CloudUpload, title: 'Secure Uploads', desc: 'Fast, encrypted uploads with duplicate detection' },
    { icon: Share2, title: 'Smart Sharing', desc: 'Public links, password protection & download notifications' },
    { icon: FolderOpen, title: 'Folder Organization', desc: 'Create, rename, delete folders and move files' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track downloads and file performance' },
    { icon: Shield, title: 'Privacy First', desc: 'Private by default, full visibility control' },
    { icon: Zap, title: 'Lightning Fast', desc: 'Instant previews and CDN-powered downloads' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero */}
      <section className="pt-16 pb-20 px-4 sm:pt-24 lg:pt-32">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">Finfom</h1>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            The Modern Way to Share Files
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto">
            Secure, organized, and beautiful. Finfom combines powerful sharing with smart organization.
          </p>

          {/* Waitlist Form */}
          <form onSubmit={handleWaitlist} className="max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500"
                required
              />
              <Button type="submit" disabled={loading} className="px-8 py-4 rounded-full">
                {loading ? 'Joining...' : 'Join Waitlist'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </form>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Be the first to know when we launch
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12 sm:mb-16">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
                <feature.icon className="w-12 h-12 text-primary-600 mb-6" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center bg-primary-600 rounded-3xl p-10 sm:p-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to simplify your file sharing?
          </h2>
          <p className="text-lg sm:text-xl text-primary-100 mb-10">
            Join the waitlist and be the first to experience Finfom
          </p>
          <form onSubmit={handleWaitlist} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-6 py-4 rounded-full bg-white text-gray-900 focus:outline-none"
                required
              />
              <Button type="submit" disabled={loading} variant="secondary">
                Join Waitlist
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 dark:bg-black">
        <div className="max-w-6xl mx-auto text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Finfom. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;