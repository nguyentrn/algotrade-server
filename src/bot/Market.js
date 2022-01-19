import { max, min } from 'simple-statistics';

import pairs from '../apis/pairs';
import db from '../database';

const TICKERS_LENGTH = 3;

class TradingPair {
  constructor(tradingPair) {
    this.symbol = tradingPair.symbol;
    this.baseAsset = tradingPair.baseAsset;
    this.quoteAsset = tradingPair.quoteAsset;
    this.id = tradingPair.id;
    this.name = tradingPair.name;
    this.filters = tradingPair.filters;
  }

  getPriceFrom(from = 0) {
    if (this.times) {
      const indexFrom = this.times.findIndex((c) => c >= from);
      if (indexFrom === -1) {
        return null;
      }
      const closesFrom = this.closes.slice(indexFrom, TICKERS_LENGTH);
      return closesFrom;
    }
  }

  min(from = 0) {
    const ohlcvs = this.getPriceFrom(from);
    if (ohlcvs && ohlcvs.length) {
      return min(this.getPriceFrom(from));
    } else {
      console.log(from, this.times, ohlcvs);
    }
  }

  max(from = 0) {
    const ohlcvs = this.getPriceFrom(from);
    if (ohlcvs && ohlcvs.length) {
      return max(this.getPriceFrom(from));
    } else {
      console.log(from);
    }
  }
}

class Market {
  constructor() {
    this.init().then();
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
      ])
      .join('coins', 'coins.symbol', 'binance_trading_pairs.baseAsset')
      .orderBy('rank')
      .whereIn('binance_trading_pairs.symbol', pairs);

    tradingPairs.slice(0, pairs.length).forEach((tradingPair) => {
      if (tradingPair.symbol) {
        this[tradingPair.symbol] = new TradingPair(tradingPair);
      }
    });
    this.isLoaded = true;
  }

  setTicker(tradingPair) {
    const { s, E, c } = tradingPair;
    if (this[s]) {
      if (!this[s].closes) {
        this[s].times = [];
        this[s].closes = [];
      }
      if (this[s].lastTicker !== c * 1) {
        this[s].times.push(E);
        this[s].closes.push(c * 1);
      }
      this[s].lastTicker = c * 1;
      this[s].lastTime = E;
      if (this[s].closes.length > TICKERS_LENGTH) {
        this[s].times.shift();
        this[s].closes.shift();
      }
    }
  }
}

export const _MARKET_DATA = new Market();
export default Market;
