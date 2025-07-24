// Debug logging utility
export const logApiCall = (message: string, data?: any) => {
  const ENABLE_API_LOGS = import.meta.env.VITE_ENABLE_API_LOGS === 'true';
  if (ENABLE_API_LOGS) {
    console.log(`🔄 API: ${message}`, data);
  }
};
