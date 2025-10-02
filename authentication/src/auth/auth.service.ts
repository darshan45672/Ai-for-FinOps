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
}
