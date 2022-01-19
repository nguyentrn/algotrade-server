import { _USERS_DATA } from './Users';
import { _MARKET_DATA } from './Market';
import db from '../database';
import { max, min } from 'simple-statistics';
import sleep from '../utils/sleep';

const done = [];
(async () => {
  const dumpData = await db
    .with(
      'prices',
      db
        .withSchema('ohlcvs')
        .from('binance_btcusdt_1m')
        .select(db.raw(`'BTCUSDT' AS s, time AS "E", close AS c`))
        .orderBy('time', 'desc')
        .where('time', '<', '2021/12/04')
        .limit(1440),
    )
    .select('*')
    .orderBy('E')
    .from('prices');
  for (let i = 0; i < dumpData.length; i++) {
    if (_MARKET_DATA.isLoaded && dumpData) {
      dumpData[i].E = new Date(dumpData[i].E).getTime();
      _MARKET_DATA.setTicker(dumpData[i]);
      const users = Object.values(_USERS_DATA);
      for (let j = 0; j < users.length; j++) {
        const { tradingPairs } = users[j];
        for (let k = 0; k < tradingPairs.length; k++) {
          const tradingPair = tradingPairs[k];
          await tradingPair.run();
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
  console.log(first, last, ((last - first) / first) * (60 + 30 + 15));
})();

// setInterval(async () => {
//   if (_MARKET_DATA.isLoaded) {
//     await Promise.all(
//       Object.values(_USERS_DATA).map(async (user) => {
//         await Promise.all(
//           user.tradingPairs.forEach(async (tradingPair) => {
//             await tradingPair.run();
//           }),
//         );
//       }),
//     );
//   }
// }, 1000);
