import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

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
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
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
