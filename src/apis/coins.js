import db from '../database';
import pairs from './pairs';

let coins = {};

(async () => {
  coins = await db('coins')
    .select(['id', 'symbol', 'name', 'color'])
    .whereIn(
      'symbol',
      pairs.map((p) => p.replace(/USDT$/, '')),
    )
    .orderBy('rank')
    .whereNotNull('color');
})();

export default coins;
