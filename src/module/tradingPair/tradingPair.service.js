import { Injectable } from '@nestjs/common';
import { _MARKET_DATA } from '../../bot/Market';
import { _USERS_DATA } from '../../bot/Users';
import db from '../../database/index';

@Injectable()
export class TradingPairService {
  async getAll() {
    const tradingPairsObj = {};
    Object.values(_MARKET_DATA).forEach((tradingPair) => {
      if (tradingPair.symbol) {
        const { symbol, baseAsset, quoteAsset, id, name } = tradingPair;
        tradingPairsObj[tradingPair.symbol] = {
          symbol,
          baseAsset,
          quoteAsset,
          id,
          name,
        };
      }
    });
    return tradingPairsObj;
  }

  async toggleActive(tradingPair) {
    if (_USERS_DATA[tradingPair.user]) {
      _USERS_DATA[tradingPair.user].toggleActiveTradingPair(tradingPair);
    } else {
      _USERS_DATA.addUser(tradingPair);
    }
    await db('user_trading_pairs')
      .insert(tradingPair)
      .onConflict(['user', 'symbol'])
      .merge();
    delete tradingPair.user;
    return tradingPair;
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
            .where('time', '<', new Date(lastTime))
            .orderBy('time', 'desc')
            .limit(1440),
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
