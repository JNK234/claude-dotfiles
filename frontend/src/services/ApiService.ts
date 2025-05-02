import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { supabase } from '../lib/supabase'; // Import supabase client

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
      async (config) => { // Make the interceptor async
        try {
          // Prioritize getting the token from the active Supabase session
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Error getting Supabase session in interceptor:', error);
            // Optionally fall back to localStorage or handle error
          }

          const token = session?.access_token; // Get the access token

          if (token) {
            console.log('[ApiService Interceptor] Using token from Supabase session.');
            config.headers.Authorization = `Bearer ${token}`;
          } else {
            // Fallback or if no session exists (e.g., public routes)
            console.warn('[ApiService Interceptor] No active Supabase session token found.');
            // You might still check localStorage here as a secondary fallback if needed
            // const localToken = localStorage.getItem('token');
            // if (localToken) config.headers.Authorization = `Bearer ${localToken}`;
          }
        } catch (e) {
           console.error('Unexpected error in Supabase session check:', e);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle token expiration
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(endpoint, config);
    return response.data;
  }

  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    let finalConfig = config;
    if (endpoint === '/auth/login') {
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(data)) {
        formData.append(key, value as string);
      }
      finalConfig = {
        ...config,
        headers: {
          ...config?.headers,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      };
      data = formData;
    }
    const response = await this.api.post<T>(endpoint, data, finalConfig);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(endpoint, data, config);
    return response.data;
  }

  async patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.patch<T>(endpoint, data, config);
    return response.data;
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(endpoint, config);
    return response.data;
  }
}

export default ApiService;
