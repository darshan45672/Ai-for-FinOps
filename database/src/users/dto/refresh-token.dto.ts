import { IsString, IsNotEmpty, IsDate, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  expiresAt: Date;
}

export class RefreshTokenResponseDto {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}
