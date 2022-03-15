import { Injectable } from '@nestjs/common';
import { _MARKET_DATA } from '../../bot/Market/Market';
import { _USERS_DATA } from '../../bot/Users';
import db from '../../database/index';

@Injectable()
export class StrategyService {
  async getAll() {
    const strategiesObj = {};
    Object.values(_MARKET_DATA).forEach((strategy) => {
      if (strategy.symbol) {
        delete strategy.closes;
        delete strategy.times;
        delete strategy.lastClose;
        delete strategy.lastTime;
        delete strategy.lastTicker;
        delete strategy.filters;
        strategiesObj[strategy.symbol] = strategy;
      }
    });

    return strategiesObj;
  }

  async getMine(email) {
    const strategies = await db('user_strategies')
      .select('*')
      .where('user', email);
    return strategies;
  }

  async updateOne(strategy) {
    if (strategy.isActive) {
      _USERS_DATA[strategy.user].addTradingPair(strategy);
    } else {
      _USERS_DATA[strategy.user].removeTradingPair(strategy);
    }

    const result = await db('user_strategies')
      .insert(strategy)
      .onConflict(['user', 'symbol'])
      .merge()
      .returning([
        'symbol',
        'isActive',
        'initialAmount',
        'takeProfit',
        'stopLoss',
        'isDCA',
        'entryPoints',
        'advanceSettings',
        'strategy',
      ]);
    return result[0];
  }
}
