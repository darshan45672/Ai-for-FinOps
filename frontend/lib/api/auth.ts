import axios, { AxiosInstance } from 'axios';
import { AuthResponse, RegisterData, LoginData, User } from '@/types/auth';
import { setCookie, getCookie, deleteCookie } from '@/lib/cookies';

class AuthService {
  private api: AxiosInstance;
  private readonly AUTH_API_URL: string;

  constructor() {
    this.AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';
    
    this.api = axios.create({
      baseURL: `${this.AUTH_API_URL}/auth`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              this.setTokens(response.accessToken, response.refreshToken);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/signin';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/register', data);
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    this.setUser(response.data.user);
    return response.data;
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/login', data);
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    this.setUser(response.data.user);
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${this.AUTH_API_URL}/auth/refresh`,
      { refreshToken }
    );
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await this.api.get<User>('/profile');
    this.setUser(response.data);
    return response.data;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!this.getAccessToken();
  }

  /**
   * Get access token from localStorage and cookies
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Try localStorage first (legacy), then cookies
    return localStorage.getItem('accessToken') || getCookie('accessToken');
  }

  /**
   * Get refresh token from localStorage and cookies
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Try localStorage first (legacy), then cookies
    return localStorage.getItem('refreshToken') || getCookie('refreshToken');
  }

  /**
   * Get user data from localStorage
   */
  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Set tokens in both localStorage and cookies
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    
    // Store in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Store in cookies for middleware access
    // Access token expires in 15 minutes
    setCookie('accessToken', accessToken, {
      expires: 1/96, // 15 minutes in days (1/96 of a day)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    // Refresh token expires in 7 days
    setCookie('refreshToken', refreshToken, {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  /**
   * Set user data in localStorage
   */
  private setUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Clear all auth data from localStorage and cookies
   */
  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Clear cookies
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
  }
}

// Export singleton instance
export const authService = new AuthService();
