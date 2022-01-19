import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard';
import { JwtStrategy } from './auth.strategy';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard],
})
export class AuthModule {}
