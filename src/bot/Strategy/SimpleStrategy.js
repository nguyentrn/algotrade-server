import Strategy from './Strategy';

class SimpleStrategy extends Strategy {
  constructor(props) {
    super(props);
  }

  checkFirstEntry(tradingPair) {
    this.lastOrderPrice = tradingPair.lastTicker;

    // console.log(this.min, tradingPair.ohlcv.min());
    // console.log(
    //   new Date(tradingPair.lastTime),
    //   this.min,
    //   this.lastOrderPrice,
    //   this.min !== this.lastOrderPrice,
    //   ((tradingPair.lastTicker - this.min) / this.min) * 100,
    //   this.advanceSettings.callbackForMarginCall,
    // );
    // console.log(tradingPair.ohlcv.getCandlePattern());
    if (
      this.min <= tradingPair.ohlcv.min(this.advanceSettings.period) &&
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
        ((lastTicker - this.max) / this.max) * 100 >=
          this.advanceSettings.earningCallback * -1
      ) {
        delete this.min;
        return true;
      } else {
        return false;
      }
    }
  }
}

export default SimpleStrategy;
