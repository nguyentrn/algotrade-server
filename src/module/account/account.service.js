import { Injectable } from '@nestjs/common';
import { _USERS_DATA } from '../../bot/Users';
import User from '../../bot/User';
import db from '../../database/index';

const formatBalances = async (orginalBalances) => {
  const balances = { ...orginalBalances };
  const balanceKeys = Object.keys(balances);

  const coins = await db('coins')
    .select(['id', 'symbol', 'name', 'color'])
    .whereIn('symbol', balanceKeys);
  coins.forEach((coin) => {
    balances[coin.symbol].id = coin.id;
    balances[coin.symbol].name = coin.name;
    balances[coin.symbol].color = coin.color;
  });
  return balances;
};

const getApiKey = async (email) => {
  const apikey = await db('user_api_keys')
    .select(['user', 'api_key', 'secret_key'])
    .where('user', email)
    .first();
  return apikey;
};

const setUserPermission = async (email) => {
  if (_USERS_DATA[email]) {
    return _USERS_DATA[email].permissions;
  }
  const apikey = await getApiKey(email);
  if (!apikey || !apikey.api_key) {
    return false;
  }
  const user = new User([apikey]);
  await user.checkAPIPermission();
  return user;
};

@Injectable()
export class AccountService {
  async checkApiPermission(email) {
    try {
      const user = await setUserPermission(email);
      return user.permissions;
    } catch (err) {
      return false;
    }
  }

  async getBalances(email) {
    if (_USERS_DATA[email]) {
      const balances = await formatBalances(_USERS_DATA[email].balances);
      return balances;
    }
    const user = await setUserPermission(email);

    if (user && user.permissions && user.permissions.enableReading) {
      const balances = await user.exchange.getFundingWallet();
      const formattedBalances = await formatBalances(balances);
      return formattedBalances;
    }
  }

  async updateToken(data) {
    try {
      const user = new User([data]);
      await user.checkAPIPermission();
      if (user?.permissions?.enableReading) {
        data.updated_at = new Date();
        await db('user_api_keys')
          .insert(data)
          .onConflict(['user', 'exchange'])
          .merge();
        return true;
      } else {
        return false;
      }
    } catch (err) {
      // console.log(err);
      return false;
    }
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
