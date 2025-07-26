import { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '../../components/layout/Navigation';
import { useAuthStore } from '../../store/authStore';
import { UserCircleIcon, CameraIcon } from '@heroicons/react/24/outline';

export default function Profile() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Navigation>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                {false ? (
                  <img
                    src=""
                    alt={user?.display_name || 'User Profile'}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl border-4 border-white shadow-lg">
                    <UserCircleIcon className="w-16 h-16" />
                  </div>
                )}
                <button className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors">
                  <CameraIcon className="w-5 h-5" />
                </button>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mt-4">{user?.display_name || user?.email?.split('@')[0] || 'User'}</h1>
              <p className="text-gray-600">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student'}</p>
            </div>

            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      defaultValue={user?.display_name || user?.email?.split('@')[0] || 'User'}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      disabled
                      defaultValue={user?.email}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <input
                      type="text"
                      disabled
                      defaultValue={user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student'}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Language</label>
                    <select
                      disabled={!isEditing}
                      defaultValue="English"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive email updates about your activity</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Navigation>
  );
}
