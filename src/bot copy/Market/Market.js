import pairs from '../../apis/pairs';
import db from '../../database';
import Pair from './Pair';

class Market {
  constructor() {
    this.isLoaded = false;
  }

  async init() {
    const tradingPairs = await db('binance_trading_pairs')
      .select([
        'binance_trading_pairs.symbol',
        'binance_trading_pairs.baseAsset',
        'binance_trading_pairs.quoteAsset',
        'binance_trading_pairs.filters',
        'coins.id',
        'coins.name',
        'coins.rank',
        'coins.color',
      ])
      .join('coins', 'coins.id', 'binance_trading_pairs.id')
      .orderBy('rank')
      .whereIn('binance_trading_pairs.symbol', pairs);
    // .limit(2);
    tradingPairs.slice(0, pairs.length).forEach((tradingPair) => {
      if (tradingPair.symbol) {
        this[tradingPair.symbol] = new Pair(tradingPair);
      }
    });
    this.isLoaded = true;
  }

  initOHLCVs(ohlcvs) {
    ohlcvs.map(([symbol, val]) => {
      this[symbol].initOHLCV(val);
    });
  }

  updateOHLCVs(ohlcvs) {
    ohlcvs.map(([symbol, val]) => {
      this[symbol].updateOHLCV(val);
    });
  }

  setTicker(tradingPair) {
    const { s, E, c } = tradingPair;
    if (this[s]) {
      this[s].lastTicker = c * 1;
      this[s].lastTime = E;
    }
  }
}

export const _MARKET_DATA = new Market();
export default Market;
