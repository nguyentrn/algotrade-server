import {
  Controller,
  Get,
  Post,
  Bind,
  Body,
  Request,
  Dependencies,
  UseGuards,
} from '@nestjs/common';

import decodeToken from '../../utils/decodeToken';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AccountService } from './account.service';

@Controller('account')
@Dependencies(AccountService)
export class AccountController {
  constructor(accountService) {
    this.accountService = accountService;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @Bind(Request())
  async getAccount(req) {
    const email = decodeToken(req).email;
    const account = await this.accountService.getAccount(email);
    if (!account) {
      return { status: 501, data: false };
    }
    return { status: 200, data: account };
  }

  @UseGuards(JwtAuthGuard)
  @Post('updatetoken')
  @Bind(Request(), Body())
  async updateToken(req, body) {
    const email = decodeToken(req).email;
    const result = await this.accountService.updateToken({
      email,
      ...body,
    });
    if (result) {
      return { status: 200, data: true };
    }
    return { status: 501, data: false };
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  @Bind(Request())
  async getOrders(req) {
    const email = decodeToken(req).email;
    const orders = await this.accountService.getOrders(email);

    return { status: 200, data: orders };
  }
}
