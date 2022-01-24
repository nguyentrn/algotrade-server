import { Injectable } from '@nestjs/common';
import db from '../../database/index';

import Market from '../../bot/Market/Market';
import sleep from '../../utils/sleep';
import { groupBy } from 'ramda';
import TradingPair from '../../bot/TradingPair';
import Pair from '../../bot/Market/Pair';

const bySymbol = groupBy((ohlcv) => ohlcv.s);

const formarOHLCVs = (ohlcvs) => {
  return Object.entries(
    bySymbol(
      ohlcvs.map(({ s, E, o, h, l, c, v }) => ({
        s,
        time: E,
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v,
      })),
    ),
  );
};

const OHLCV_LENGTH = 50;

const emulate = async (strategy) => {
  const _MARKET_DATA = new Market();
  _MARKET_DATA[strategy.symbol] = new Pair({
    symbol: strategy.symbol,
    ohlcvLength: strategy.backtestLength,
  });
  const done = { time: [], ohlcvs: [], orders: [] };
  const historyData = await db
    .with(
      'prices',
      db
        .withSchema('ohlcvs')
        .from(`binance_${strategy.symbol.toLowerCase()}_1m`)
        .select(
          db.raw(
            `'${strategy.symbol}' AS s, time AS "E", open AS o, high AS h, low AS l, close AS c, volume AS v`,
          ),
        )
        .orderBy('time', 'desc')
        .limit(OHLCV_LENGTH + strategy.backtestLength),
    )
    .select('*')
    .orderBy('E')
    .from('prices');

  _MARKET_DATA.initOHLCVs(formarOHLCVs(historyData.slice(0, OHLCV_LENGTH)));
  const tradingPair = new TradingPair(strategy);
  for (let i = OHLCV_LENGTH; i < historyData.length; i++) {
    historyData[i].E = new Date(historyData[i].E).getTime();
    _MARKET_DATA.updateOHLCVs(formarOHLCVs([historyData[i]]));
    _MARKET_DATA.setTicker(historyData[i]);
    const order = tradingPair.run(_MARKET_DATA[tradingPair.symbol]);
    if (order) {
      if (tradingPair.profit) {
        console.log(tradingPair.profit);
        done.orders.push({ ...order, profit: tradingPair.profit });
      } else {
        done.orders.push(order);
      }
    }
  }
  const { time, open, high, low, close } =
    _MARKET_DATA[tradingPair.symbol].ohlcv['1m'];
  done.totalProfit = tradingPair.totalProfit;
  done.time = time;
  done.ohlcvs = [];
  done.time.forEach((_, id) => {
    done.ohlcvs.push([close[id], open[id], low[id], high[id]]);
  });
  return done;
};

@Injectable()
export class BacktestService {
  async emulate(body) {
    const data = await emulate(body);
    return data;
  }
}