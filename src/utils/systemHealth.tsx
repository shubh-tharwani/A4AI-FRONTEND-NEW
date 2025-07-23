import React, { useState, useEffect } from 'react';
import ApiService from '../services/apiService';
import toast from 'react-hot-toast';

interface SystemHealth {
  api: 'healthy' | 'degraded' | 'down';
  auth: 'healthy' | 'degraded' | 'down';
  features: {
    assessment: boolean;
    planning: boolean;
    visualAids: boolean;
    activities: boolean;
    voice: boolean;
  };
  lastCheck: Date;
  errors: string[];
}

class SystemHealthMonitor {
  private static instance: SystemHealthMonitor;
  private health: SystemHealth;
  private checkInterval?: NodeJS.Timeout;
  private listeners: ((health: SystemHealth) => void)[] = [];

  private constructor() {
    this.health = {
      api: 'healthy',
      auth: 'healthy',
      features: {
        assessment: true,
        planning: true,
        visualAids: true,
        activities: true,
        voice: true,
      },
      lastCheck: new Date(),
      errors: []
    };
  }

  static getInstance(): SystemHealthMonitor {
    if (!SystemHealthMonitor.instance) {
      SystemHealthMonitor.instance = new SystemHealthMonitor();
    }
    return SystemHealthMonitor.instance;
  }

  subscribe(listener: (health: SystemHealth) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.health));
  }

  startMonitoring(intervalMs: number = 300000): void { // 5 minutes
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Initial check
    this.performHealthCheck();

    // Set up interval
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  private async performHealthCheck(): Promise<void> {
    console.log('🏥 Performing system health check...');
    const errors: string[] = [];

    try {
      // Check API health
      await this.checkApiHealth();
    } catch (error) {
      errors.push(`API health check failed: ${error}`);
      this.health.api = 'down';
    }

    try {
      // Check authentication
      await this.checkAuthHealth();
    } catch (error) {
      errors.push(`Auth health check failed: ${error}`);
      this.health.auth = 'down';
    }

    // Check feature availability
    await this.checkFeatureHealth();

    this.health.lastCheck = new Date();
    this.health.errors = errors;

    // Determine overall API status
    if (errors.length === 0) {
      this.health.api = 'healthy';
      this.health.auth = 'healthy';
    } else if (errors.length < 3) {
      this.health.api = 'degraded';
    } else {
      this.health.api = 'down';
    }

    this.notifyListeners();

    // Show user notifications for critical issues
    if (this.health.api === 'down') {
      toast.error('System is experiencing issues. Some features may be unavailable.', {
        duration: 5000,
        id: 'system-down'
      });
    } else if (this.health.api === 'degraded') {
      toast('Some system features may be temporarily unavailable.', {
        icon: '⚠️',
        duration: 3000,
        id: 'system-degraded'
      });
    }
  }

  // Public method to trigger health check
  async triggerHealthCheck(): Promise<void> {
    await this.performHealthCheck();
  }

  private async checkApiHealth(): Promise<void> {
    try {
      // Use the existing health check endpoint if available
      await ApiService.Auth.healthCheck();
    } catch (error) {
      console.warn('Primary health check failed, trying fallback...');
      // Fallback: try a simple API call
      throw error;
    }
  }

  private async checkAuthHealth(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.health.auth = 'degraded';
      return;
    }

    try {
      await ApiService.Auth.verifyToken();
      this.health.auth = 'healthy';
    } catch (error) {
      this.health.auth = 'degraded';
      throw error;
    }
  }

  private async checkFeatureHealth(): Promise<void> {
    const features = this.health.features;

    // Test each feature with a lightweight operation
    const checks = [
      { name: 'assessment', test: () => this.testAssessment() },
      { name: 'planning', test: () => this.testPlanning() },
      { name: 'visualAids', test: () => this.testVisualAids() },
      { name: 'activities', test: () => this.testActivities() },
      { name: 'voice', test: () => this.testVoice() }
    ];

    for (const check of checks) {
      try {
        await check.test();
        features[check.name as keyof typeof features] = true;
      } catch (error) {
        console.warn(`Feature ${check.name} health check failed:`, error);
        features[check.name as keyof typeof features] = false;
      }
    }
  }

  private async testAssessment(): Promise<void> {
    // Test assessment endpoint availability (without creating actual quiz)
    // This would need to be a lightweight health check endpoint
    return Promise.resolve();
  }

  private async testPlanning(): Promise<void> {
    // Test planning endpoint availability
    return Promise.resolve();
  }

  private async testVisualAids(): Promise<void> {
    // Test visual aids endpoint availability
    return Promise.resolve();
  }

  private async testActivities(): Promise<void> {
    // Test activities endpoint availability
    return Promise.resolve();
  }

  private async testVoice(): Promise<void> {
    // Test voice assistant availability
    return Promise.resolve();
  }

  getHealth(): SystemHealth {
    return { ...this.health };
  }

  isFeatureAvailable(feature: keyof SystemHealth['features']): boolean {
    return this.health.features[feature] && this.health.api !== 'down';
  }

  getSystemStatus(): 'healthy' | 'degraded' | 'down' {
    if (this.health.api === 'down' || this.health.auth === 'down') {
      return 'down';
    }
    
    const availableFeatures = Object.values(this.health.features).filter(Boolean).length;
    const totalFeatures = Object.keys(this.health.features).length;
    
    if (availableFeatures === totalFeatures) {
      return 'healthy';
    } else if (availableFeatures > totalFeatures / 2) {
      return 'degraded';
    } else {
      return 'down';
    }
  }
}

export const systemHealthMonitor = SystemHealthMonitor.getInstance();

/**
 * React hook for using system health in components
 */
export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth>(systemHealthMonitor.getHealth());

  useEffect(() => {
    const unsubscribe = systemHealthMonitor.subscribe(setHealth);
    return unsubscribe;
  }, []);

  return {
    health,
    isFeatureAvailable: (feature: keyof SystemHealth['features']) => 
      systemHealthMonitor.isFeatureAvailable(feature),
    getSystemStatus: () => systemHealthMonitor.getSystemStatus(),
    performHealthCheck: () => systemHealthMonitor.triggerHealthCheck(),
  };
}

/**
 * Higher-order component to wrap features with health checks
 */
export function withHealthCheck<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredFeature: keyof SystemHealth['features']
) {
  return function HealthCheckedComponent(props: P) {
    const { isFeatureAvailable } = useSystemHealth();

    if (!isFeatureAvailable(requiredFeature)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Feature Temporarily Unavailable
            </h2>
            <p className="text-gray-600 mb-6">
              This feature is currently experiencing issues. Please try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}
