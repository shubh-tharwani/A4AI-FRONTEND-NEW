import { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '../../components/layout/Navigation';
import {
  Cog6ToothIcon,
  BellIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <Navigation>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center space-x-3 mb-8">
              <Cog6ToothIcon className="w-8 h-8 text-gray-400" />
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>

            <div className="space-y-8">
              {/* Appearance */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Dark Mode</h3>
                      <p className="text-sm text-gray-500">Toggle dark mode on or off</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={darkMode}
                        onChange={(e) => setDarkMode(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </section>

              {/* Notifications */}
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <BellIcon className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Push Notifications</h3>
                      <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </section>

              {/* Language & Region */}
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <GlobeAltIcon className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Language & Region</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Language</label>
                    <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time Zone</label>
                    <select className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Privacy & Security */}
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Privacy & Security</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                      Enable
                    </button>
                  </div>
                </div>
              </section>

              {/* Password */}
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <KeyIcon className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">Password</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                      type="password"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    />
                  </div>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    Update Password
                  </button>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </div>
    </Navigation>
  );
}
