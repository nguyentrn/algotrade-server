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

// init OHLCVS
(async () => {
  await _MARKET_DATA.init();
  const ohlcvs = await getOHLCVs(process.env.INIT_OHCLVS);
  _MARKET_DATA.initOHLCVs(ohlcvs);
})();

// update OHLCVS per minute
schedule.scheduleJob('3 * * * * *', async () => {
  const ohlcvs = await getOHLCVs(3);
  if (_MARKET_DATA.isLoaded) {
    _MARKET_DATA.updateOHLCVs(ohlcvs);
  }
});

const chargeFee = async (user, fee) => {
  if (fee > 0) {
    await user.chargeFee(fee);
  }
};

const putOrder = async (user, tradingPair) => {
  const order = tradingPair.run(_MARKET_DATA[tradingPair.symbol]);
  if (order) {
    await user.order(order);
    if (order.side === 'SELL') {
      await chargeFee(user, tradingPair.getFee());
    }
  }
};

// run bot per second
setInterval(async () => {
  if (!_MARKET_DATA.isLoaded) {
    return null;
  }
  await Promise.all(
    Object.values(_USERS_DATA).map(async (user) => {
      await Promise.all(
        user.tradingPairs.map(async (tradingPair) => {
          await putOrder(user, tradingPair);
        }),
      );
    }),
  );
}, 1000);
