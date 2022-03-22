import { Injectable } from '@nestjs/common';
import { _MARKET_DATA } from '../../bot/Market/Market';
import { _USERS_DATA } from '../../bot/Users';
import db from '../../database/index';

// const signals = {obv:};

// (() => {
//   console.log(
//     Object.values(_MARKET_DATA).map(({ ohlcv }) => ohlcv['1m'].volume),
//   );
// })();

@Injectable()
export class CoinstatsService {
  async getAll() {
    return Object.values(_MARKET_DATA).map(({ symbol, ohlcv }) => {
      // const obv = ohlcv.calculateOBV(60);
      // const close = ohlcv.getClosePriceFrom('1m', 60);
      // const rsi = ohlcv.calculateRSI('1m', 60, 4320);
      // console.log((obv[obv.length - 1] - obv[0]) / obv[0]);
      // console.log((close[close.length - 1] - close[0]) / close[0]);
      // console.log(rsi);
      const { open, high, low, close, volume } = ohlcv['5m'];
      return { symbol, ohlcv: { open, high, low, close, volume } };
      return {
        symbol,
        // obv:
        //   (obv[obv.length - 1] - obv[0]) /
        //   obv[0] /
        //   ((close[close.length - 1] - close[0]) / close[0]),
        rsi: rsi[rsi.length - 1],
      };
    });
  }

  // async getHistoryPrices(symbol) {
  //   if (_MARKET_DATA[symbol]) {
  //     const { lastTime } = _MARKET_DATA[symbol];
  //     const data = await db
  //       .with(
  //         'prices',
  //         db
  //           .withSchema('ohlcvs')
  //           .from(`binance_${symbol.toLowerCase()}_1m`)
  //           .select(
  //             db.raw(
  //               'extract(epoch from time) AS time,open,high,low,close,volume',
  //             ),
  //           )
  //           .where('time', '<', lastTime ? new Date(lastTime) : new Date())
  //           .orderBy('time', 'desc')
  //           .limit(1000),
  //       )
  //       .select('*')
  //       .orderBy('time')
  //       .from('prices');
  //     return data;
  //   }
  // }

  // async getHistoryOrders(user, symbol) {
  //   const data = await db('orders')
  //     .select('*')
  //     .where('user', user)
  //     .where('symbol', symbol);
  //   return data;
  // }

  // async getOrders(user, symbol) {
  //   const data = _USERS_DATA[user]?.coinstats.find(
  //     (coinstat) => coinstat.symbol === symbol,
  //   )?.orders;
  //   return data;
  // }
}
