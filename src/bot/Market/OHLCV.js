import { max, min } from 'simple-statistics';
import {
  doji,
  morningdojistar,
  eveningdojistar,
  bullishspinningtop,
  bearishspinningtop,
  shootingstar,
  hammerpattern,
  OBV,
  RSI,
} from 'technicalindicators';
// var bullishspinningtop =require('technicalindicators').bullishspinningtop;

import pairs from '../../apis/pairs';
import db from '../../database';

const OHLCVS_LENGTH = 2;
const INTERVALS = ['1m', '5m', '10m'];

const checkInterval = (interval, time) => !(time % (interval * 60 * 1000));
const getNextIntervalTime = (interval, lastTime) =>
  lastTime + interval * 60 * 1000;

class OHLCV {
  constructor(ohlcvs, ohlcvLength = process.env.INIT_OHCLVS * 1) {
    this.ohlcvLength = ohlcvLength;
    INTERVALS.forEach((interval) => {
      this[interval] = {
        time: [],
        open: [],
        high: [],
        low: [],
        close: [],
        volume: [],
      };
    });
    ohlcvs.forEach((ohlcv) => {
      delete ohlcv.s;
      Object.entries(ohlcv).map(([key, val]) => {
        this['1m'][key].push(val);
      });
    });
    console.log(this.ohlcvLength);
  }

  getLastTime(timeframe) {
    return this[timeframe].time[this[timeframe].time.length - 1];
  }

  update(data) {
    const lastOHLCVTime = this.getLastTime('1m');
    data
      .filter((ohlcv) => ohlcv.time > lastOHLCVTime)
      .forEach((ohlcv) => {
        delete ohlcv.s;
        Object.entries(ohlcv).map(([key, val]) => {
          this['1m'][key].push(val);
          if (this['1m'][key].length >= this.ohlcvLength) {
            this['1m'][key].shift();
          }
        });
      });
  }

  getOHLCVsFrom(timeframe = '1m', from = 0) {
    const indexFrom = this[timeframe]?.findIndex((c) => c >= from);
    if (indexFrom === -1) {
      return null;
    }
    const closesFrom = this.closes.slice(indexFrom, OHLCVS_LENGTH);
    return closesFrom;
  }

  getClosePriceFrom(timeframe, amount) {
    return this[timeframe].close.slice(amount * -1);
  }

  getVolumePriceFrom(timeframe, amount) {
    return this[timeframe].volume.slice(amount * -1);
  }

  // getOHLCPriceFrom(amount) {
  //   return {
  //     open: this['1m'].open.slice(amount * -1),
  //     high: this['1m'].high.slice(amount * -1),
  //     low: this['1m'].low.slice(amount * -1),
  //     close: getClosePriceFrom('1m', amount),
  //   };
  // }

  getFrom(amount) {
    return {
      time: this['1m'].time.slice(amount * -1),
      open: this['1m'].open.slice(amount * -1),
      high: this['1m'].high.slice(amount * -1),
      low: this['1m'].low.slice(amount * -1),
      close: this['1m'].close.slice(amount * -1),
      volume: this['1m'].volume.slice(amount * -1),
    };
  }

  min(amount = 50) {
    return min(this.getClosePriceFrom('1m', amount));
  }

  max(amount = 50) {
    return max(this.getClosePriceFrom('1m', amount));
  }

  // calculateOBV(amount) {
  //   return OBV.calculate({
  //     close: this.getClosePriceFrom('1m', amount),
  //     volume: this.getVolumePriceFrom('1m', amount),
  //   });
  // }

  // calculateRSI(timeframe = '1m', period, amount) {
  //   return RSI.calculate({
  //     values: this.getClosePriceFrom(timeframe, amount),
  //     period,
  //   });
  // }

  // morningdojistar() {
  //   return morningdojistar(this.getOHLCPriceFrom(3));
  // }
  // eveningdojistar() {
  //   return eveningdojistar(this.getOHLCPriceFrom(3));
  // }
  // bullishspinningtop() {
  //   return bullishspinningtop(this.getOHLCPriceFrom(1));
  // }
  // bearishspinningtop() {
  //   return bearishspinningtop(this.getOHLCPriceFrom(1));
  // }
  // doji() {
  //   return doji(this.getOHLCPriceFrom(1));
  // }
  // shootingstar() {
  //   return shootingstar(this.getOHLCPriceFrom(5));
  // }
  // hammerpattern() {
  //   return hammerpattern(this.getOHLCPriceFrom(5));
  // }

  // getCandlePattern() {
  //   const res = [];
  //   if (this.hammerpattern()) {
  //     res.push('hammerpattern');
  //   }
  //   if (this.shootingstar()) {
  //     res.push('shootingstar');
  //   }
  //   // if (this.morningdojistar()) {
  //   //   res.push('morningdojistar');
  //   // }
  //   // if (this.eveningdojistar()) {
  //   //   res.push('eveningdojistar');
  //   // }
  //   // if (this.bullishspinningtop()) {
  //   //   res.push('bullishspinningtop');
  //   // }
  //   // if (this.bearishspinningtop()) {
  //   //   res.push('bearishspinningtop');
  //   // }
  //   // if (this.doji()) {
  //   //   res.push('doji');
  //   // }
  //   return res;
  // }
}

export default OHLCV;
