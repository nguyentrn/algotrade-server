import OHLCV from './OHLCV';

const INTERVALS = ['1m', '5m', '10m'];

class Pair {
  constructor(tradingPair) {
    this.symbol = tradingPair.symbol;
    this.baseAsset = tradingPair.baseAsset;
    this.quoteAsset = tradingPair.quoteAsset;
    this.id = tradingPair.id;
    this.name = tradingPair.name;
    this.filters = tradingPair.filters;
    this.color = tradingPair.color;
    this.ohlcvLength = tradingPair.ohlcvLength;
  }

  initOHLCV(data) {
    this.ohlcv = new OHLCV(data, this.ohlcvLength);
  }

  updateOHLCV(data) {
    if (this.ohlcv) {
      this.ohlcv.update(data);
    }
  }
}

export default Pair;
