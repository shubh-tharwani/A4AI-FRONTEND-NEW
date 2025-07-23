import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { LoginRequest } from '../../types';
import { validateEmail } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (error: any) {
      if (error.response?.data?.message) {
        setError('root', { message: error.response.data.message });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to A4AI</h1>
          <p className="text-gray-600">Sign in to continue your learning journey</p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  validate: (value) => validateEmail(value) || 'Please enter a valid email address',
                })}
                type="email"
                id="email"
                className="input-field"
                placeholder="Enter your email"
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters long',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="input-field pr-12"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Error Message */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{errors.root.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Demo Credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200"
        >
          <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Accounts:</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Student:</span>
              <span>student@demo.com / password123</span>
            </div>
            <div className="flex justify-between">
              <span>Teacher:</span>
              <span>teacher@demo.com / password123</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
