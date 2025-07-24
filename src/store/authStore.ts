import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import ApiService from '../services/apiService';
import { User, LoginRequest, SignupRequest } from '../types';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => void;
  verifyToken: () => Promise<boolean>;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,

      login: async (credentials: LoginRequest) => {
        try {
          set({ loading: true });
          const response = await ApiService.Auth.login(credentials);

          if (response.status === 'success' && response.user_data && response.tokens) {
            const user: User = {
              id: response.user_data.uid || response.user_data.id,
              email: response.user_data.email,
              display_name: response.user_data.display_name,
              role: response.user_data.custom_claims?.role || response.user_data.role || 'student',
            };

            // Backend returns id_token, not access_token
            const token = response.tokens.id_token || response.tokens.access_token;
            const refreshToken = response.tokens.refresh_token;

            // Store in localStorage for persistence
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user', JSON.stringify(user));
            if (refreshToken) {
              localStorage.setItem('refresh_token', refreshToken);
            }

            set({
              user,
              token,
              isAuthenticated: true,
              loading: false,
            });

            toast.success('Login successful!');
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error: any) {
          set({ loading: false });
          const errorMessage = error.response?.data?.message || error.message || 'Login failed';
          toast.error(errorMessage);
          throw error;
        }
      },

      signup: async (userData: SignupRequest) => {
        try {
          set({ loading: true });
          const response = await ApiService.Auth.signup(userData);

          if (response.status === 'success' && response.user_data && response.tokens) {
            const user: User = {
              id: response.user_data.uid || response.user_data.id,
              email: response.user_data.email,
              display_name: response.user_data.display_name,
              role: response.user_data.custom_claims?.role || response.user_data.role || 'student',
            };

            // Backend returns id_token, not access_token
            const token = response.tokens.id_token || response.tokens.access_token;
            const refreshToken = response.tokens.refresh_token;

            // Store in localStorage for persistence
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user', JSON.stringify(user));
            if (refreshToken) {
              localStorage.setItem('refresh_token', refreshToken);
            }

            set({
              user,
              token,
              isAuthenticated: true,
              loading: false,
            });

            toast.success('Account created successfully!');
          } else {
            throw new Error(response.message || 'Signup failed');
          }
        } catch (error: any) {
          set({ loading: false });
          const errorMessage = error.response?.data?.message || error.message || 'Signup failed';
          toast.error(errorMessage);
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call the backend logout API to invalidate the token
          await ApiService.Auth.logout();
        } catch (error: any) {
          // Log the error but don't prevent logout from completing
          console.error('Backend logout failed:', error);
          
          // Show a warning but still proceed with local logout
          const errorMessage = error.response?.data?.message || error.message;
          if (errorMessage) {
            toast.error(`Logout warning: ${errorMessage}`);
          }
        } finally {
          // Always clear local storage and state regardless of API call result
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          localStorage.removeItem('refresh_token');

          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });

          toast.success('Logged out successfully');
        }
      },

      initializeAuth: () => {
        try {
          const token = localStorage.getItem('auth_token');
          const userStr = localStorage.getItem('user');

          if (token && userStr) {
            const user = JSON.parse(userStr);
            set({
              user,
              token,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            set({ loading: false });
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          set({ loading: false });
        }
      },

      verifyToken: async () => {
        try {
          const response = await ApiService.Auth.verifyToken();
          return !!response; // Convert to boolean
        } catch (error) {
          await get().logout();
          return false;
        }
      },

      refreshToken: async () => {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await ApiService.Auth.refreshToken(refreshToken);

          if (response.tokens?.id_token || response.tokens?.access_token) {
            const newToken = response.tokens.id_token || response.tokens.access_token;
            localStorage.setItem('auth_token', newToken);
            set({ token: newToken });
          }
        } catch (error) {
          await get().logout();
          throw error;
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
