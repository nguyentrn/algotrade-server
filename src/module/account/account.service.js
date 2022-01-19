import { Injectable } from '@nestjs/common';
import { _USERS_DATA } from '../../bot/Users';
import User from '../../bot/User';
import db from '../../database/index';

@Injectable()
export class AccountService {
  async getBalances(email) {
    if (_USERS_DATA[email]) {
      return _USERS_DATA[email].balances;
    }
    const apikey = await db('users')
      .select(['email AS user', 'binance_api_key', 'binance_secret_key'])
      .where('email', email)
      .first();
    const user = new User([apikey]);
    await user.getAccountInfo();
    return user.balances;
  }

  async getOrders(user) {
    const orders = await db('orders')
      .select(['symbol', 'transactTime', 'price', 'origQty', 'side'])
      .where('user', user);
    const res = {};
    orders.forEach((order) => {
      if (!res[order.symbol]) {
        res[order.symbol] = [];
      }
      res[order.symbol].push(order);
    });
    return res;
  }
}
