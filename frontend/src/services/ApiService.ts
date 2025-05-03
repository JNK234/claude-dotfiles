import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { supabase } from '../lib/supabase';

// Use relative path for API requests, relying on Render's rewrite rule for proxying
const API_URL = '/api';

class ApiService {
  protected api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include token in requests
    this.api.interceptors.request.use(
      async (config) => {
        try {
          // Get current Supabase session
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('[ApiService] Error getting Supabase session:', error);
          } else if (session?.access_token) {
            console.log('[ApiService] Using token from Supabase session');
            config.headers.Authorization = `Bearer ${session.access_token}`;
            
            // Store token in localStorage as fallback
            localStorage.setItem('token', session.access_token);
          } else {
            // Try fallback to stored token if available
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
              console.log('[ApiService] Using fallback token from localStorage');
              config.headers.Authorization = `Bearer ${storedToken}`;
            } else {
              console.warn('[ApiService] No authentication token available');
            }
          }
        } catch (e) {
          console.error('[ApiService] Unexpected error in auth token handling:', e);
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling and token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        // Handle authentication errors (401)
        if (error.response?.status === 401 && originalRequest) {
          try {
            console.log('[ApiService] Received 401, attempting to refresh session');
            
            // Try to refresh the session
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !data.session) {
              console.error('[ApiService] Session refresh failed:', refreshError);
              
              // Clear tokens and redirect to login
              localStorage.removeItem('token');
              window.location.href = '/login?expired=true';
              return Promise.reject(error);
            }
            
            // Session refreshed successfully
            console.log('[ApiService] Session refreshed, retrying request');
            const token = data.session.access_token;
            localStorage.setItem('token', token);
            
            // Update the authorization header and retry the request
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            console.error('[ApiService] Error during token refresh:', refreshError);
            
            // Clear tokens and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login?expired=true';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(endpoint, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    // Special handling for legacy authentication endpoints
    if (endpoint === '/auth/login') {
      console.warn('[ApiService] Using legacy auth endpoint - consider migrating to Supabase auth');
      
      // Convert to form data for legacy endpoints
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(data || {})) {
        formData.append(key, value as string);
      }
      
      const formConfig = {
        ...config,
        headers: {
          ...config?.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };
      
      const response = await this.api.post<T>(endpoint, formData, formConfig);
      return response.data;
    }
    
    // Standard JSON POST
    const response = await this.api.post<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(endpoint, config);
    return response.data;
  }
}

export default ApiService;
