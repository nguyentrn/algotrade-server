class Strategy {
  constructor(tradingPair) {
    this.symbol = tradingPair.symbol;
    this.initialAmount = tradingPair.initialAmount;
    this.takeProfit = tradingPair.takeProfit;
    this.stopLoss = tradingPair.stopLoss;
    this.advanceSettings = tradingPair.advanceSettings;
    this.advanceSettings.period = 30;
    this.entryPoints = tradingPair.entryPoints;
    this.dcaPosition = -1;
  }

  reset() {
    this.dcaPosition = -1;
    this.max = 0;
  }

  setProfit(tradingPair) {
    this.profit =
      ((tradingPair.lastTicker - this.lastOrderPrice) / this.lastOrderPrice) *
      100;
  }

  checkDCAEntry(tradingPair) {
    const dcaPos = this.entryPoints[this.dcaPosition].position;
    if (
      this.dcaPosition >= 0 &&
      ((dcaPos < 0 && this.profit <= dcaPos) ||
        (dcaPos > 0 && this.profit >= dcaPos))
    ) {
      const orderObj = this.createBuyOrderObject(tradingPair);
      this.dcaPosition++;
      return orderObj;
    }
  }

  checkTakeProfit() {
    return this.profit >= this.takeProfit;
  }

  checkStopLoss() {
    return this.profit <= this.stopLoss;
  }

  createBuyOrderObject(tradingPair) {
    const initialPrice = this.initialAmount / tradingPair.lastTicker;
    const dca = this.entryPoints[this.dcaPosition];
    const quantity = dca ? initialPrice * dca.multiples : initialPrice;
    return {
      symbol: this.symbol,
      side: 'BUY',
      transactTime: Math.round(tradingPair.lastTime / 1000),
      price: tradingPair.lastTicker,
      quantity: quantity.toFixed(8) * 1,
      position: this.dcaPosition + 2,
    };
  }
}

export default Strategy;
