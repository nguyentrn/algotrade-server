import db from '../database';

import { _MARKET_DATA } from './Market';

class Strategy {
  constructor(tradingPair) {
    this.symbol = tradingPair.symbol;
    this.type = tradingPair.type;
    this.initialAmount = tradingPair.initialAmount;
    this.takeProfit = tradingPair.takeProfit;
    this.stopLoss = tradingPair.stopLoss;
    this.advanceSettings = tradingPair.advanceSettings;
    this.entryPoints = tradingPair.entryPoints;
    this.dcaPosition = -1;
  }

  reset() {
    this.dcaPosition = -1;
    this.max = 0;
  }

  checkEntry(tradingPair, from) {
    const prices = tradingPair.getPriceFrom(from);
    switch (this.type) {
      case 'simple-dca': {
        if (prices) {
          this.lastOrderPrice = tradingPair.lastTicker;
          if (
            this.min &&
            this.min !== prices[0] &&
            ((tradingPair.lastTicker - this.min) / this.min) * 100 >=
              this.advanceSettings.callbackForMarginCall
          ) {
            const orderObj = this.getOrderObject(tradingPair);
            this.dcaPosition = 0;
            return orderObj;
          }
        }
      }
    }
  }

  checkDCAEntry(tradingPair) {
    if (
      this.dcaPosition >= 0 &&
      this.profit <= this.entryPoints[this.dcaPosition].position
    ) {
      const orderObj = this.getOrderObject(tradingPair);
      this.dcaPosition++;
      return orderObj;
    }
  }

  setProfit(tradingPair) {
    this.profit =
      ((tradingPair.lastTicker - this.lastOrderPrice) / this.lastOrderPrice) *
      100;
  }

  checkTakeProfit() {
    return this.profit >= this.takeProfit;
  }

  checkStopLoss() {
    return this.profit <= this.stopLoss;
  }

  checkStop(tradingPair, from) {
    // console.log(this.min, this.max, this.profit, tradingPair.lastTicker);

    if (this.checkStopLoss()) {
      delete this.min;
      return true;
    }
    if (this.checkTakeProfit()) {
      switch (this.type) {
        case 'simple-dca': {
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
        default: {
          return true;
        }
      }
    }
  }

  getOrderObject(tradingPair) {
    const initialPrice = this.initialAmount / tradingPair.lastTicker;
    const dca = this.entryPoints[this.dcaPosition];
    const quantity = dca ? initialPrice * dca.multiples : initialPrice;
    return {
      symbol: this.symbol,
      side: 'BUY',
      price: tradingPair.lastTicker,
      quantity: quantity.toFixed(8) * 1,
      position: this.dcaPosition + 2,
    };
  }
}

export default Strategy;
