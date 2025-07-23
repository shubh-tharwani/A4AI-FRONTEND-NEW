import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 45000, // Increased timeout for AI operations
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for adding auth token
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          // Debug logging (can be disabled in production)
          if (process.env.NODE_ENV === 'development') {
            console.log('🔑 Token being sent:', token.substring(0, 20) + '...');
            console.log('📡 Request URL:', config.url);
            console.log('🎯 Auth Header:', config.headers.Authorization?.substring(0, 30) + '...');
          }
        } else {
          console.log('❌ No auth token found in localStorage');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling errors
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        console.log('🚨 API Error:', error.response?.status, error.response?.data);
        
        // Handle timeout errors specifically
        if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
          toast.error('Request timed out. The server may be busy processing your request. Please try again.');
          return Promise.reject(new Error('Request timeout'));
        }

        // Handle network errors
        if (!error.response) {
          toast.error('Network error. Please check your connection and try again.');
          return Promise.reject(new Error('Network error'));
        }
        
        if (error.response?.status === 401) {
          // Try to refresh token first
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken && !error.config._retry) {
            try {
              error.config._retry = true;
              console.log('🔄 Attempting token refresh...');
              
              const refreshResponse = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
                refresh_token: refreshToken,
              });
              
              if (refreshResponse.data.tokens?.id_token || refreshResponse.data.tokens?.access_token) {
                const newToken = refreshResponse.data.tokens.id_token || refreshResponse.data.tokens.access_token;
                localStorage.setItem('auth_token', newToken);
                
                // Retry the original request with new token
                error.config.headers.Authorization = `Bearer ${newToken}`;
                return this.instance.request(error.config);
              }
            } catch (refreshError) {
              console.log('❌ Token refresh failed:', refreshError);
            }
          }
          
          // If refresh failed or no refresh token, logout
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          toast.error('Your session has expired. Please login again.');
        } else if (error.response?.status === 403) {
          console.log('🔒 403 Forbidden - Token might be invalid or insufficient permissions');
          toast.error('Access denied. Please check your permissions or login again.');
        } else if (error.response?.status === 404) {
          toast.error('Resource not found. Please check the URL and try again.');
        } else if (error.response?.status === 422) {
          const message = error.response?.data?.message || 'Invalid data provided';
          toast.error(`Validation error: ${message}`);
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else if (error.message) {
          toast.error(error.message);
        } else {
          toast.error('An unexpected error occurred');
        }
        return Promise.reject(error);
      }
    );
  }

  // Token verification method
  async verifyToken(): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('❌ No token found for verification');
        return false;
      }
      
      console.log('🔍 Verifying token:', token.substring(0, 20) + '...');
      const response = await this.get('/api/v1/auth/verify-token');
      console.log('✅ Token verification response:', response);
      return true;
    } catch (error: any) {
      console.log('❌ Token verification failed:', error.response?.status, error.response?.data);
      return false;
    }
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.request<T>(config);
    return response.data;
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // File upload method
  async uploadFile<T = any>(
    url: string,
    file: File,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return this.request<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();
export default apiClient;
