import { Injectable } from '@nestjs/common';
import { _MARKET_DATA } from '../../bot/Market/Market';
import { _USERS_DATA } from '../../bot/Users';
import db from '../../database/index';

@Injectable()
export class TradingPairService {
  async getAll() {
    const tradingPairsObj = {};
    Object.values(_MARKET_DATA).forEach((tradingPair) => {
      if (tradingPair.symbol) {
        const { symbol, baseAsset, quoteAsset, id, name, color } = tradingPair;
        tradingPairsObj[tradingPair.symbol] = {
          symbol,
          baseAsset,
          quoteAsset,
          id,
          name,
          color,
        };
      }
    });
    return tradingPairsObj;
  }

  async getHistoryPrices(symbol) {
    if (_MARKET_DATA[symbol]) {
      const { lastTime } = _MARKET_DATA[symbol];
      const data = await db
        .with(
          'prices',
          db
            .withSchema('ohlcvs')
            .from(`binance_${symbol.toLowerCase()}_1m`)
            .select(
              db.raw(
                'extract(epoch from time) AS time,open,high,low,close,volume',
              ),
            )
            .where('time', '<', lastTime ? new Date(lastTime) : new Date())
            .orderBy('time', 'desc')
            .limit(1000),
        )
        .select('*')
        .orderBy('time')
        .from('prices');
      return data;
    }
  }

  async getHistoryOrders(user, symbol) {
    const data = await db('orders')
      .select('*')
      .where('user', user)
      .where('symbol', symbol);
    return data;
  }

  async getOrders(user, symbol) {
    const data = _USERS_DATA[user]?.tradingPairs.find(
      (tradingPair) => tradingPair.symbol === symbol,
    )?.orders;
    return data;
  }
}
