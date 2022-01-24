import { Module, Global } from '@nestjs/common';

import { BacktestController } from './backtest.controller';
import { BacktestService } from './backtest.service';

@Global()
@Module({
  controllers: [BacktestController],
  providers: [BacktestService],
})
export class BacktestModule {}
