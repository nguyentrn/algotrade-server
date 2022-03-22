import { Controller, Get } from '@nestjs/common';

import db from '../../database/index';
import { _MARKET_DATA } from '../../bot/Market/Market';
import pairs from '../../apis/pairs';

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

  @Get('coins')
  async getAllCoins() {
    const coins = await db('coins')
      .select(['id', 'symbol', 'name', 'color'])
      .whereIn(
        'symbol',
        pairs.map((p) => p.replace(/USDT$/, '')),
      )
      .orderBy('rank')
      .whereNotNull('color');
    return {
      status: 200,
      data: coins,
    };
  }

  @Get('ohlcvs')
  async getAllOHLCVs() {
    return {
      status: 200,
      data: Object.values(_MARKET_DATA).map(({ symbol, ohlcv }) => {
        const { open, high, low, close, volume, time } = ohlcv['1m'];
        return { symbol, ohlcv: { open, high, low, close, volume, time } };
      }),
    };
  }
}
