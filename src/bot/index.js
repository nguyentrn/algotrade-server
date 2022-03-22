import schedule from 'node-schedule';
import { groupBy } from 'ramda';

import { _USERS_DATA } from './Users';
import { _MARKET_DATA } from './Market/Market';
import pairs from '../apis/pairs';
import db from '../database/index';
import global from '../global';

const bySymbol = groupBy((ohlcv) => ohlcv.s);

const getOHLCVs = async (limit = 1, condition = '') => {
  const query = `${pairs
    .map(
      (pair) =>
        `(SELECT '${pair}' AS s,open,high,low,close,volume,time FROM ohlcvs.binance_${pair.toLowerCase()}_1m ${condition} ORDER BY time DESC LIMIT ${limit})`,
    )
    .join(' UNION ')} ORDER BY time`;
  const ohlcvs = await db.raw(query);
  // console.log(
  //   bySymbol(ohlcvs.rows).BTCUSDT[bySymbol(ohlcvs.rows).BTCUSDT.length - 2],
  // );

  return Object.entries(bySymbol(ohlcvs.rows));
};

// init OHLCVS
(async () => {
  await _MARKET_DATA.init();
  const ohlcvs = await getOHLCVs(process.env.INIT_OHCLVS * 1);
  _MARKET_DATA.initOHLCVs(ohlcvs);
})();

// update OHLCVS per minute
schedule.scheduleJob('3 * * * * *', async () => {
  const ohlcvs = await getOHLCVs(5);
  if (global.isMarketLoaded) {
    _MARKET_DATA.updateOHLCVs(ohlcvs);
  }
});

const putOrder = async (user, tradingPair) => {
  const order = tradingPair.run(_MARKET_DATA[tradingPair.symbol]);
  if (order) {
    // await user.order(order);
    if (order.side === 'SELL') {
      await user.chargeFee(user, tradingPair.getFee());
      tradingPair.reset();
    }
  }
};

// // run bot per second
setInterval(async () => {
  if (!global.isMarketLoaded && _MARKET_DATA.ohlcv) {
    return null;
  }
  await Promise.all(
    Object.values(_USERS_DATA).map(async (user) => {
      await Promise.all(
        user.tradingPairs.map(async (tradingPair) => {
          if (_MARKET_DATA[tradingPair.symbol].ohlcv) {
            await putOrder(user, tradingPair);
          }
        }),
      );
    }),
  );
}, 1000);
