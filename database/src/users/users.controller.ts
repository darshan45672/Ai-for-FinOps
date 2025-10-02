import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { CreateRefreshTokenDto } from './dto/refresh-token.dto';
import { CreateSessionDto } from './dto/session.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async listUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.usersService.listUsers(
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 10,
    );
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Find user by email' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUserByEmail(@Param('email') email: string) {
    return this.usersService.findUserByEmail(email);
  }

  @Get('github/:githubId')
  @ApiOperation({ summary: 'Find user by GitHub ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUserByGithubId(@Param('githubId') githubId: string) {
    return this.usersService.findUserByGithubId(githubId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findUserById(@Param('id') id: string) {
    return this.usersService.findUserById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user (full update)' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (partial update)' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async patchUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}

@ApiTags('Refresh Tokens')
@Controller('refresh-tokens')
export class RefreshTokensController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create refresh token' })
  @ApiResponse({ status: 201, description: 'Refresh token created' })
  async createRefreshToken(@Body() createRefreshTokenDto: CreateRefreshTokenDto) {
    return this.usersService.createRefreshToken(createRefreshTokenDto);
  }

  @Get(':token')
  @ApiOperation({ summary: 'Find refresh token' })
  @ApiResponse({ status: 200, description: 'Refresh token found' })
  @ApiResponse({ status: 404, description: 'Refresh token not found' })
  async findRefreshToken(@Param('token') token: string) {
    return this.usersService.findRefreshToken(token);
  }

  @Delete(':token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete refresh token' })
  @ApiResponse({ status: 204, description: 'Refresh token deleted' })
  async deleteRefreshToken(@Param('token') token: string) {
    return this.usersService.deleteRefreshToken(token);
  }

  @Delete('user/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all refresh tokens for a user' })
  @ApiResponse({ status: 204, description: 'All refresh tokens deleted' })
  async deleteUserRefreshTokens(@Param('userId') userId: string) {
    return this.usersService.deleteUserRefreshTokens(userId);
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clean up expired refresh tokens' })
  @ApiResponse({ status: 204, description: 'Expired tokens cleaned up' })
  async cleanExpiredTokens() {
    return this.usersService.cleanExpiredRefreshTokens();
  }
}

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create session' })
  @ApiResponse({ status: 201, description: 'Session created' })
  async createSession(@Body() createSessionDto: CreateSessionDto) {
    return this.usersService.createSession(createSessionDto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all sessions for a user' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved' })
  async findUserSessions(@Param('userId') userId: string) {
    return this.usersService.findUserSessions(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete session' })
  @ApiResponse({ status: 204, description: 'Session deleted' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async deleteSession(@Param('id') id: string) {
    return this.usersService.deleteSession(id);
  }

  @Delete('user/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all sessions for a user' })
  @ApiResponse({ status: 204, description: 'All sessions deleted' })
  async deleteUserSessions(@Param('userId') userId: string) {
    return this.usersService.deleteUserSessions(userId);
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clean up expired sessions' })
  @ApiResponse({ status: 204, description: 'Expired sessions cleaned up' })
  async cleanExpiredSessions() {
    return this.usersService.cleanExpiredSessions();
  }
}
