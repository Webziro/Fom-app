import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { FileText, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await authAPI.forgotPassword(email);
            setEmailSent(true);
            toast.success('Email sent successfully!');
        } catch (error) {
            console.error('Forgot Password Error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to send email';
            toast.error(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
            <div className="card max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <FileText className="w-12 h-12 text-primary-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Forgot Password</h2>
                    <p className="text-gray-600 mt-2">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                {!emailSent ? (
                    <form onSubmit={handleSubmit}>
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full"
                            disabled={!email.match(/^\S+@\S+\.\S+$/)}
                        >
                            Send Reset Link
                        </Button>
                    </form>
                ) : (
                    <div className="text-center">
                        <div className="bg-green-50 text-green-800 p-4 rounded-lg mb-6">
                            <p>Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.</p>
                        </div>
                        <Button onClick={() => setEmailSent(false)} variant="outline" className="w-full">
                            Try another email
                        </Button>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500 flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
