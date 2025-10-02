import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { CreateRefreshTokenDto } from './dto/refresh-token.dto';
import { CreateSessionDto } from './dto/session.dto';
import { CreatePasswordResetTokenDto } from './dto/password-reset-token.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // User Operations
  async createUser(data: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        githubId: data.githubId,
        avatar: data.avatar,
        emailVerified: data.emailVerified,
        role: data.role || 'USER',
      },
    });

    const { password, ...result } = user;
    return result as any;
  }

  async findUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUserByGithubId(githubId: string) {
    const user = await this.prisma.user.findUnique({
      where: { githubId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findUserById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;
    return result as any;
  }

  async findUserByIdWithPassword(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
      });

      const { password, ...result } = user;
      return result as any;
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { status: 'DELETED' },
      });
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async listUsers(skip = 0, take = 10) {
    const users = await this.prisma.user.findMany({
      where: { status: { not: 'DELETED' } },
      skip,
      take,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = await this.prisma.user.count({
      where: { status: { not: 'DELETED' } },
    });

    return { users, total, skip, take };
  }

  // Refresh Token Operations
  async createRefreshToken(data: CreateRefreshTokenDto) {
    return this.prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async deleteRefreshToken(token: string) {
    try {
      await this.prisma.refreshToken.delete({
        where: { token },
      });
    } catch (error) {
      // Token might not exist, which is fine
    }
  }

  async deleteUserRefreshTokens(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async cleanExpiredRefreshTokens() {
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  // Session Operations
  async createSession(data: CreateSessionDto) {
    return this.prisma.session.create({
      data: {
        userId: data.userId,
        token: data.token,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSession(id: string) {
    try {
      await this.prisma.session.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('Session not found');
    }
  }

  async deleteUserSessions(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async cleanExpiredSessions() {
    await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  // Password Reset Token Operations
  async createPasswordResetToken(data: CreatePasswordResetTokenDto) {
    return this.prisma.passwordResetToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findPasswordResetToken(token: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      throw new NotFoundException('Password reset token not found');
    }

    return resetToken;
  }

  async deletePasswordResetToken(token: string) {
    try {
      await this.prisma.passwordResetToken.delete({
        where: { token },
      });
    } catch (error) {
      // Token might not exist, which is fine
    }
  }

  async cleanExpiredPasswordResetTokens() {
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
