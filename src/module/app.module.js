import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

import { MetaModule } from './meta/meta.module';
import { AuthModule } from './auth/auth.module';
import { TradingPairModule } from './tradingPair/tradingPair.module';
import { AccountModule } from './account/account.module';
import { StrategyModule } from './strategies/strategy.module';
import { BacktestModule } from './backtest/backtest.module';
import { CoinstatsModule } from './coinstats/coinstats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '/Users/nguyentran/Desktop/javascript-starter/.env',
    }),
    AuthModule,
    MetaModule,
    TradingPairModule,
    BacktestModule,
    AccountModule,
    StrategyModule,
    CoinstatsModule,
  ],
})
export class AppModule {}
