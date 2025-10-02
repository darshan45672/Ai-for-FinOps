import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecureP@ss123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ example: 'johndoe', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'github123456', required: false })
  @IsOptional()
  @IsString()
  githubId?: string;

  @ApiProperty({ example: 'https://avatars.githubusercontent.com/u/12345', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  emailVerified?: boolean;

  @ApiProperty({ enum: UserRole, default: UserRole.USER, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'johndoe', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'https://avatars.githubusercontent.com/u/12345', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: 'github123456', required: false })
  @IsOptional()
  @IsString()
  githubId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  lastLoginAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  emailVerified?: boolean;

  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UserResponseDto {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
