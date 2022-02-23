import { max, min } from 'simple-statistics';
import {
  doji,
  morningdojistar,
  eveningdojistar,
  bullishspinningtop,
  bearishspinningtop,
  shootingstar,
  hammerpattern,
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
  constructor(ohlcvs, ohlcvLength = 10) {
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
  }

  getLastTime(interval) {
    return this[interval].time[this[interval].time.length - 1];
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

  getOHLCVsFrom(interval = '1m', from = 0) {
    const indexFrom = this[interval]?.findIndex((c) => c >= from);
    if (indexFrom === -1) {
      return null;
    }
    const closesFrom = this.closes.slice(indexFrom, OHLCVS_LENGTH);
    return closesFrom;
  }

  getClosePriceFrom(amount) {
    return this['1m'].close.slice(amount * -1);
  }

  getOHLCPriceFrom(amount) {
    return {
      open: this['1m'].open.slice(amount * -1),
      high: this['1m'].high.slice(amount * -1),
      low: this['1m'].low.slice(amount * -1),
      close: getClosePriceFrom(amount),
    };
  }

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

  min(period = 50) {
    return min(this.getClosePriceFrom(period));
  }

  max(period = 50) {
    return max(this.getClosePriceFrom(period));
  }

  morningdojistar() {
    return morningdojistar(this.getOHLCPriceFrom(3));
  }
  eveningdojistar() {
    return eveningdojistar(this.getOHLCPriceFrom(3));
  }
  bullishspinningtop() {
    return bullishspinningtop(this.getOHLCPriceFrom(1));
  }
  bearishspinningtop() {
    return bearishspinningtop(this.getOHLCPriceFrom(1));
  }
  doji() {
    return doji(this.getOHLCPriceFrom(1));
  }
  shootingstar() {
    return shootingstar(this.getOHLCPriceFrom(5));
  }
  hammerpattern() {
    return hammerpattern(this.getOHLCPriceFrom(5));
  }

  getCandlePattern() {
    const res = [];
    if (this.hammerpattern()) {
      res.push('hammerpattern');
    }
    if (this.shootingstar()) {
      res.push('shootingstar');
    }
    // if (this.morningdojistar()) {
    //   res.push('morningdojistar');
    // }
    // if (this.eveningdojistar()) {
    //   res.push('eveningdojistar');
    // }
    // if (this.bullishspinningtop()) {
    //   res.push('bullishspinningtop');
    // }
    // if (this.bearishspinningtop()) {
    //   res.push('bearishspinningtop');
    // }
    // if (this.doji()) {
    //   res.push('doji');
    // }
    return res;
  }
}

export default OHLCV;
