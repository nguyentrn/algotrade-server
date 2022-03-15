import {
  Controller,
  Get,
  UseGuards,
  Bind,
  Request,
  Dependencies,
} from '@nestjs/common';

import decodeToken from '../../utils/decodeToken';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './auth.guard';

@Controller('auth')
@Dependencies(UsersService)
export class AuthController {
  constructor(userService) {
    this.userService = userService;
  }

  @UseGuards(JwtAuthGuard)
  @Get('login')
  @Bind(Request())
  async checkUser(req) {
    const email = decodeToken(req).email;
    const user = await this.userService.getUser(email);
    return { status: 200, data: user };
  }
}
