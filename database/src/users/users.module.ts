import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController, RefreshTokensController, SessionsController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController, RefreshTokensController, SessionsController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
