import { _USERS_DATA } from './Users';
import Market from './Market/Market';
import db from '../database';
import { max, min } from 'simple-statistics';
import sleep from '../utils/sleep';
import { groupBy } from 'ramda';

const _MARKET_DATA = new Market();

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

const done = [];
const OHLCV_LENGTH = 50;
const DUMP_DATA_LENGTH = 1;

(async () => {
  const dumpData = await db
    .with(
      'prices',
      db
        .withSchema('ohlcvs')
        .from('binance_btcusdt_1m')
        .select(
          db.raw(
            `'BTCUSDT' AS s, time AS "E", open AS o, high AS h, low AS l, close AS c, volume AS v`,
          ),
        )
        .orderBy('time', 'desc')
        // .where('time', '<', '2022/01/21')
        .limit(OHLCV_LENGTH + DUMP_DATA_LENGTH),
    )
    .select('*')
    .orderBy('E')
    .from('prices');
  let run = true;

  _MARKET_DATA.initOHLCVs(formarOHLCVs(dumpData.slice(0, OHLCV_LENGTH)));

  while (run) {
    if (_MARKET_DATA.isLoaded && dumpData) {
      run = false;
      for (let i = OHLCV_LENGTH; i < dumpData.length; i++) {
        dumpData[i].E = new Date(dumpData[i].E).getTime();
        _MARKET_DATA.updateOHLCVs(formarOHLCVs([dumpData[i]]));
        _MARKET_DATA.setTicker(dumpData[i]);
        const users = Object.values(_USERS_DATA);
        for (let j = 0; j < users.length; j++) {
          const { tradingPairs } = users[j];
          for (let k = 0; k < tradingPairs.length; k++) {
            const tradingPair = tradingPairs[k];
            const order = tradingPair.run(_MARKET_DATA[tradingPair.symbol]);
            if (order) {
              await users[j].order(order);
              if (order.side === 'SELL') {
                const fee = tradingPair.getFee();
                if (fee > 0) {
                  await users[j].chargeFee(fee);
                }
              }
            }
            if (tradingPair.profit !== done[done.length - 1]) {
              done.push(tradingPair.profit);
            }
          }
        }
      }
    }
    done.map((s) => console.log(s));
    const first = dumpData[0].c;
    const last = dumpData[dumpData.length - 1].c;
    console.log(first, last, ((last - first) / first) * (15 * (1 + 2 + 6 + 9)));
    await sleep(1000);
  }
})();
