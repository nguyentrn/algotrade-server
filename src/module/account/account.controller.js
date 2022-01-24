import {
  Controller,
  Get,
  Bind,
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
  @Get('checkapi')
  @Bind(Request())
  async checkApiKey(req) {
    const email = decodeToken(req).email;
    const apiKey = await this.accountService.checkApiKey(email);
    return { status: 200, data: apiKey };
  }

  @UseGuards(JwtAuthGuard)
  @Get('balances')
  @Bind(Request())
  async getBalances(req) {
    const email = decodeToken(req).email;
    const balances = await this.accountService.getBalances(email);
    return { status: 200, data: balances };
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
