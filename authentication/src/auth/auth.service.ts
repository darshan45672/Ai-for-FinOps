import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseClientService } from '../database-client/database-client.service';
import { RegisterDto, LoginDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private databaseClient: DatabaseClientService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user via database service with all fields
    const user = await this.databaseClient.createUser({
      email: registerDto.email,
      password: hashedPassword,
      username: registerDto.username,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    // Find user via database service
    const user = await this.databaseClient.findUserByEmail(loginDto.email);

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Check if refresh token exists in database
      const storedToken = await this.databaseClient.findRefreshToken(refreshToken);

      if (!storedToken || new Date(storedToken.expiresAt) < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Delete old refresh token
      await this.databaseClient.deleteRefreshToken(refreshToken);

      // Generate new tokens
      const tokens = await this.generateTokens(
        storedToken.user.id,
        storedToken.user.email,
        storedToken.user.role,
      );

      // Remove password from response
      const { password, ...userWithoutPassword } = storedToken.user;

      return {
        user: userWithoutPassword,
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    // Delete all refresh tokens for the user
    await this.databaseClient.deleteUserRefreshTokens(userId);

    // Delete all sessions for the user
    await this.databaseClient.deleteUserSessions(userId);

    return { message: 'Logout successful' };
  }

  async logoutAll(userId: string) {
    // Same as logout - delete all tokens and sessions
    return this.logout(userId);
  }

  async getProfile(userId: string) {
    return this.databaseClient.findUserById(userId);
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = {
      sub: userId,
      email,
      role,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    // Store refresh token in database
    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = new Date();
    
    // Parse expiration time (simple parser for formats like '7d', '24h', '60m')
    const match = expiresIn.match(/^(\d+)([dhm])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      
      switch (unit) {
        case 'd':
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case 'h':
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case 'm':
          expiresAt.setMinutes(expiresAt.getMinutes() + value);
          break;
      }
    } else {
      // Default to 7 days if parsing fails
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    await this.databaseClient.createRefreshToken({
      token: refreshToken,
      userId,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.databaseClient.findUserByEmail(email);

      if (user && await bcrypt.compare(password, user.password)) {
        const { password, ...result } = user;
        return result;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async validateOAuthUser(profile: {
    githubId: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }) {
    // Try to find user by GitHub ID first
    let user = await this.databaseClient.findUserByGithubId(profile.githubId);

    if (user) {
      // Update last login time
      user = await this.databaseClient.updateUser(user.id, {
        lastLoginAt: new Date(),
        avatar: profile.avatar || user.avatar,
      });
    } else {
      // Check if a user with this email already exists
      try {
        const existingUser = await this.databaseClient.findUserByEmail(profile.email);
        
        if (existingUser) {
          // Link GitHub account to existing user
          user = await this.databaseClient.updateUser(existingUser.id, {
            githubId: profile.githubId,
            avatar: profile.avatar || existingUser.avatar,
            lastLoginAt: new Date(),
          });
        }
      } catch (error) {
        // User with email doesn't exist, create new user
        const newUser = await this.databaseClient.createUser({
          email: profile.email,
          githubId: profile.githubId,
          username: profile.username,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatar: profile.avatar,
          emailVerified: true, // GitHub emails are verified
        });
        user = { ...newUser, password: '' } as any;
      }
    }

    if (!user) {
      throw new UnauthorizedException('Failed to authenticate with GitHub');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Remove password from response if it exists
    const { password, ...userWithoutPassword } = user as any;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Get user from database with password
    const user = await this.databaseClient.findUserByIdWithPassword(userId);

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await this.databaseClient.updateUser(userId, {
      password: hashedPassword,
    });

    // Logout from all devices (delete all refresh tokens and sessions)
    await this.logout(userId);

    return { message: 'Password changed successfully. Please login again.' };
  }

  async deleteAccount(userId: string, password: string) {
    // Get user from database with password
    const user = await this.databaseClient.findUserByIdWithPassword(userId);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    // Delete user's refresh tokens
    await this.databaseClient.deleteUserRefreshTokens(userId);

    // Delete user's sessions
    await this.databaseClient.deleteUserSessions(userId);

    // Delete user account
    await this.databaseClient.deleteUser(userId);

    return { message: 'Account deleted successfully' };
  }

  async requestPasswordReset(email: string) {
    try {
      // Find user by email
      const user = await this.databaseClient.findUserByEmail(email);

      // Generate reset token (valid for 1 hour)
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token in database
      await this.databaseClient.createPasswordResetToken({
        token: resetToken,
        userId: user.id,
        expiresAt,
      });

      // In production, send email with reset link
      // For now, log the reset link (in production, use email service)
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const resetLink = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
      
      console.log('Password Reset Link:', resetLink);
      
      // TODO: Send email with reset link
      // await this.emailService.sendPasswordResetEmail(user.email, resetLink);

      return { 
        message: 'Password reset link has been sent to your email address',
        // In development, include the link (remove in production)
        resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
      };
    } catch (error) {
      // Don't reveal if email exists for security
      return { message: 'If an account exists with this email, a password reset link will be sent' };
    }
  }

  async resetPassword(token: string, newPassword: string) {
    // Validate reset token
    const resetToken = await this.databaseClient.findPasswordResetToken(token);

    if (!resetToken) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (new Date() > new Date(resetToken.expiresAt)) {
      throw new UnauthorizedException('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await this.databaseClient.updateUser(resetToken.userId, {
      password: hashedPassword,
    });

    // Delete the used reset token
    await this.databaseClient.deletePasswordResetToken(token);

    // Delete all refresh tokens and sessions for security
    await this.databaseClient.deleteUserRefreshTokens(resetToken.userId);
    await this.databaseClient.deleteUserSessions(resetToken.userId);

    return { message: 'Password reset successfully. Please login with your new password.' };
  }
}
