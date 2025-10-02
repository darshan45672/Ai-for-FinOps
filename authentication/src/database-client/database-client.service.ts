import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: string;
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  githubId?: string;
  role: string;
  status: string;
  emailVerified?: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserPayload {
  email: string;
  password?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  githubId?: string;
  role?: string;
  emailVerified?: boolean;
}

export interface UpdateUserPayload {
  email?: string;
  password?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  githubId?: string;
  role?: string;
  status?: string;
  emailVerified?: boolean;
  lastLoginAt?: Date;
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateRefreshTokenPayload {
  token: string;
  userId: string;
  expiresAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionPayload {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: Date;
}

export interface PasswordResetToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreatePasswordResetTokenPayload {
  token: string;
  userId: string;
  expiresAt: Date;
}

@Injectable()
export class DatabaseClientService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('DATABASE_SERVICE_URL') || 'http://localhost:3002';
  }

  // User Operations
  async createUser(data: CreateUserPayload): Promise<Omit<User, 'password'>> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/users`, data)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to create user',
        error.response?.status || 500,
      );
    }
  }

  async findUserByEmail(email: string): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/email/${email}`)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'User not found',
        error.response?.status || 404,
      );
    }
  }

  async findUserById(id: string): Promise<Omit<User, 'password'>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/${id}`)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'User not found',
        error.response?.status || 404,
      );
    }
  }

  async findUserByIdWithPassword(id: string): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/${id}/with-password`)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'User not found',
        error.response?.status || 404,
      );
    }
  }

  async findUserByGithubId(githubId: string): Promise<User | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/github/${githubId}`)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new HttpException(
        error.response?.data?.message || 'Error finding user by GitHub ID',
        error.response?.status || 500,
      );
    }
  }

  async updateUser(id: string, data: UpdateUserPayload): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`${this.baseUrl}/users/${id}`, data)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to update user',
        error.response?.status || 500,
      );
    }
  }

  // Refresh Token Operations
  async createRefreshToken(data: CreateRefreshTokenPayload): Promise<RefreshToken> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/refresh-tokens`, data)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to create refresh token',
        error.response?.status || 500,
      );
    }
  }

  async findRefreshToken(token: string): Promise<RefreshToken & { user: User }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/refresh-tokens/${token}`)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Refresh token not found',
        error.response?.status || 404,
      );
    }
  }

  async deleteRefreshToken(token: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/refresh-tokens/${token}`)
      );
    } catch (error) {
      // Ignore errors for token deletion
    }
  }

  async deleteUserRefreshTokens(userId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/refresh-tokens/user/${userId}`)
      );
    } catch (error) {
      // Ignore errors
    }
  }

  // Session Operations
  async createSession(data: CreateSessionPayload): Promise<Session> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/sessions`, data)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to create session',
        error.response?.status || 500,
      );
    }
  }

  async deleteUserSessions(userId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/sessions/user/${userId}`)
      );
    } catch (error) {
      // Ignore errors
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/users/${userId}`)
      );
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to delete user',
        error.response?.status || 500,
      );
    }
  }

  // Password Reset Token Operations
  async createPasswordResetToken(data: CreatePasswordResetTokenPayload): Promise<PasswordResetToken> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/password-reset-tokens`, data)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to create password reset token',
        error.response?.status || 500,
      );
    }
  }

  async findPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/password-reset-tokens/${token}`)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new HttpException(
        error.response?.data?.message || 'Error finding password reset token',
        error.response?.status || 500,
      );
    }
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(`${this.baseUrl}/password-reset-tokens/${token}`)
      );
    } catch (error) {
      // Ignore errors for token deletion
    }
  }
}
