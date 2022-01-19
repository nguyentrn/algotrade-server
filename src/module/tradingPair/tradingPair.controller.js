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
import { TradingPairService } from './tradingPair.service';

@Controller('trading-pair')
@Dependencies(TradingPairService)
export class TradingPairController {
  constructor(tradingPairService) {
    this.tradingPairService = tradingPairService;
  }

  @Get()
  async getTradingPairs() {
    const tradingPair = await this.tradingPairService.getAll();
    return { status: 200, data: tradingPair };
  }

  @Get('history')
  @Bind(Request(), Query())
  async getHistory(req, query) {
    const { email } = decodeToken(req);
    const { symbol } = query;
    const [orders, prices] = await Promise.all([
      this.tradingPairService.getHistoryOrders(email, symbol),
      this.tradingPairService.getHistoryPrices(symbol),
    ]);
    return { status: 200, data: { orders, prices } };
  }

  @UseGuards(JwtAuthGuard)
  @Post('active')
  @Bind(Request(), Body())
  async toggleActive(req, body) {
    const { email } = decodeToken(req);
    const data = await this.tradingPairService.toggleActive({
      user: email,
      ...body,
    });
    return { status: 200, data };
  }

  @Get('orders')
  @Bind(Request(), Query())
  async getOrders(req, query) {
    const { email } = decodeToken(req);
    const { symbol } = query;
    const orders = await this.tradingPairService.getOrders(email, symbol);
    return { status: 200, data: orders };
  }
}
