import { Injectable } from '@nestjs/common';
import db from '../../database/index';

@Injectable()
export class UsersService {
  async find(email) {
    const user = await db('users').select('*').where('email', email).first();
    return user;
  }

  async insert(email) {
    const user = {
      email,
      updatedAt: new Date(),
      role: 1,
      createdAt: new Date(),
    };
    await db('users').insert(user);
    return user;
  }

  async update(user) {
    const updatedUser = { ...user, updatedAt: new Date() };
    await db('users').update(user).where('email', user.email);
    return updatedUser;
  }

  async getUser(email) {
    const user = await this.find(email);
    if (user) {
      return await this.update(user);
    } else {
      return await this.insert(email);
    }
  }
}
