import Strategy from './Strategy';

class SimpleDCA extends Strategy {
  constructor(props) {
    super(props);
  }

  checkFirstEntry(tradingPair) {
    this.lastOrderPrice = tradingPair.lastTicker;
    // console.log(
    //   this.min,
    //   tradingPair.ohlcv['1m'].close,
    //   tradingPair.ohlcv.min(this.advanceSettings.initPeriod),
    // );
    // console.log(
    //   new Date(tradingPair.lastTime),
    //   this.min,
    //   tradingPair.ohlcv.min(this.advanceSettings.initPeriod),
    //   this.lastOrderPrice,
    //   this.min !== this.lastOrderPrice,
    //   ((tradingPair.lastTicker - this.min) / this.min) * 100,
    //   this.advanceSettings.callbackForMarginCall,
    // );
    if (
      this.min <= tradingPair.ohlcv.min(this.advanceSettings.initPeriod) &&
      this.min !== this.lastOrderPrice &&
      ((tradingPair.lastTicker - this.min) / this.min) * 100 >=
        this.advanceSettings.callbackForMarginCall
    ) {
      const orderObj = this.createBuyOrderObject(tradingPair);
      this.dcaPosition = 0;
      return orderObj;
    }
  }

  checkStop(tradingPair) {
    if (this.checkStopLoss()) {
      delete this.min;
      return true;
    }
    if (this.checkTakeProfit()) {
      const { lastTicker } = tradingPair;
      if (this.max < lastTicker) {
        this.max = lastTicker;
      }
      if (
        this.max !== lastTicker &&
        Math.abs(((lastTicker - this.max) / this.max) * 100) >=
          Math.abs(this.advanceSettings.earningCallback)
      ) {
        delete this.min;
        return true;
      }
      return false;
    }
  }
}

export default SimpleDCA;
