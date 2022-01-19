import { Controller, Get } from '@nestjs/common';

import db from '../../database/index';

@Controller('meta')
export class MetaController {
  @Get('')
  async getTradingPairs() {
    const tradingPairs = await db('binance_trading_pairs').select('*');
    const tradingPairsObj = {};
    tradingPairs.forEach((tradingPair) => {
      tradingPairsObj[tradingPair.symbol] = tradingPair;
    });
    return { status: 200, data: tradingPairsObj };
  }
}
