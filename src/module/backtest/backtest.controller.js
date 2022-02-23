import {
  Controller,
  Get,
  Bind,
  Request,
  Dependencies,
  UseGuards,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import decodeToken from '../../utils/decodeToken';
import { JwtAuthGuard } from '../auth/auth.guard';
import { BacktestService } from './backtest.service';

@Controller('backtest')
@Dependencies(BacktestService)
export class BacktestController {
  constructor(backtestService) {
    this.backtestService = backtestService;
  }

  @Post()
  @Bind(Request(), Body())
  async getBacktests(req, body) {
    const { email } = decodeToken(req);
    const backtest = await this.backtestService.emulate(email, body);
    return { status: 200, data: backtest };
  }

  @UseGuards(JwtAuthGuard)
  @Get('active')
  @Bind(Request(), Body())
  async toggleActive(req, body) {
    const { email } = decodeToken(req);
    const data = await this.backtestService.toggleActive({
      user: email,
      ...body,
    });
    return { status: 200, data };
  }
}
