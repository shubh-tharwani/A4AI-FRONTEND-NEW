import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { SignupRequest } from '../../types';
import { validateEmail, validatePassword } from '../../lib/utils';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup, loading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<SignupRequest & { confirmPassword: string }>();

  const password = watch('password');

  const onSubmit = async (data: SignupRequest & { confirmPassword: string }) => {
    try {
      const { confirmPassword, ...signupData } = data;
      await signup(signupData);
      navigate('/dashboard');
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
            className="w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join A4AI</h1>
          <p className="text-gray-600">Create your account to start learning with AI</p>
        </div>

        {/* Register Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Display Name Field */}
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                {...register('display_name', {
                  required: 'Full name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters long',
                  },
                })}
                type="text"
                id="display_name"
                className="input-field"
                placeholder="Enter your full name"
                disabled={loading}
              />
              {errors.display_name && (
                <p className="text-red-500 text-sm mt-1">{errors.display_name.message}</p>
              )}
            </div>

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

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                I am a...
              </label>
              <select
                {...register('role')}
                id="role"
                className="input-field"
                disabled={loading}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
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
                    validate: (value) => {
                      const validation = validatePassword(value);
                      return validation.isValid || validation.message;
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="input-field pr-12"
                  placeholder="Create a strong password"
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

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className="input-field pr-12"
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
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
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" className="mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
