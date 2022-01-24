import schedule from 'node-schedule';
import { groupBy } from 'ramda';

import { _USERS_DATA } from './Users';
import { _MARKET_DATA } from './Market/Market';
import './Socket';
import pairs from '../apis/pairs';
import db from '../database/index';

const bySymbol = groupBy((ohlcv) => ohlcv.s);
const getOHLCVs = async (limit = 1, condition = '') => {
  const query = `${pairs
    .slice(0, 2)
    .map(
      (pair) =>
        `(SELECT '${pair}' AS s,open,high,low,close,volume,time FROM ohlcvs.binance_${pair.toLowerCase()}_1m ${condition} ORDER BY time DESC LIMIT ${limit})`,
    )
    .join(' UNION ')} ORDER BY time`;
  const ohlcvs = await db.raw(query);
  return Object.entries(bySymbol(ohlcvs.rows));
};

(async () => {
  await _MARKET_DATA.init();
  const ohlcvs = await getOHLCVs(50);
  _MARKET_DATA.initOHLCVs(ohlcvs);
})();

schedule.scheduleJob('3 * * * * *', async () => {
  const ohlcvs = await getOHLCVs(10);
  if (_MARKET_DATA.isLoaded) {
    _MARKET_DATA.updateOHLCVs(ohlcvs);
  }
});

setInterval(async () => {
  if (_MARKET_DATA.isLoaded) {
    await Promise.all(
      Object.values(_USERS_DATA).map(async (user) => {
        await Promise.all(
          user.tradingPairs.map(async (tradingPair) => {
            const order = tradingPair.run(_MARKET_DATA[tradingPair.symbol]);
            if (order) {
              await user.order(_MARKET_DATA[tradingPair.symbol], order);
              if (order.side === 'SELL') {
                const fee = tradingPair.getFee();
                if (fee > 0) {
                  await user.chargeFee(fee);
                }
              }
            }
            // if (tradingPair.profit !== done[done.length - 1]) {
            //   done.push(tradingPair.profit);
            // }
          }),
        );
      }),
    );
  }
}, 1000);
