import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const AuthDebugPanel: React.FC = () => {
  const { user, isAuthenticated, token, logout } = useAuthStore();
  const navigate = useNavigate();

  const testUrls = [
    { name: 'Landing Page', url: '/', public: true },
    { name: 'Login Page', url: '/login', public: true },
    { name: 'Register Page', url: '/register', public: true },
    { name: 'Dashboard', url: '/dashboard', public: false },
    { name: 'Assessment', url: '/assessment', public: false },
    { name: 'Activities', url: '/activities', public: false },
    { name: 'Planning', url: '/planning', public: false },
    { name: 'Voice Assistant', url: '/voice', public: false },
    { name: 'Visual Aids', url: '/visual-aids', public: false },
    { name: 'AR Scene', url: '/ar-scene', public: false },
  ];

  const handleNavigate = (url: string) => {
    navigate(url);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm z-50 border">
      <h3 className="font-bold text-sm mb-2">🔐 Auth Debug Panel</h3>
      
      <div className="text-xs mb-3 space-y-1">
        <div>Status: <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>
          {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
        </span></div>
        <div>User: {user?.display_name || user?.email || 'None'}</div>
        <div>Role: {user?.role || 'None'}</div>
        <div>Token: {token ? '✅ Present' : '❌ Missing'}</div>
      </div>

      <div className="space-y-1 mb-3">
        <div className="text-xs font-semibold text-gray-600">Quick Navigation:</div>
        {testUrls.map((item) => (
          <button
            key={item.url}
            onClick={() => handleNavigate(item.url)}
            className={`block w-full text-left text-xs px-2 py-1 rounded transition-colors ${
              item.public 
                ? 'bg-green-50 hover:bg-green-100 text-green-700'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
            }`}
          >
            {item.public ? '🌐' : '🔒'} {item.name}
          </button>
        ))}
      </div>

      {isAuthenticated && (
        <button
          onClick={handleLogout}
          className="w-full text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      )}
    </div>
  );
};

export default AuthDebugPanel;
