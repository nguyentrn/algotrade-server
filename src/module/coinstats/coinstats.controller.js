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
import { CoinstatsService } from './coinstats.service';

@Controller('coinstats')
@Dependencies(CoinstatsService)
export class CoinstatsController {
  constructor(coinstatsService) {
    this.coinstatsService = coinstatsService;
  }

  @Get()
  async getCoinstats() {
    const coinstats = await this.coinstatsService.getAll();
    return { status: 200, data: coinstats };
  }

  // @Get('history')
  // @Bind(Request(), Query())
  // async getHistory(req, query) {
  //   const { email } = decodeToken(req);
  //   const { symbol } = query;
  //   const [orders, prices] = await Promise.all([
  //     this.coinstatsService.getHistoryOrders(email, symbol),
  //     this.coinstatsService.getHistoryPrices(symbol),
  //   ]);
  //   return { status: 200, data: { orders, prices } };
  // }

  // @Get('orders')
  // @Bind(Request(), Query())
  // async getOrders(req, query) {
  //   const { email } = decodeToken(req);
  //   const { symbol } = query;
  //   const orders = await this.coinstatsService.getOrders(email, symbol);
  //   return { status: 200, data: orders };
  // }
}
