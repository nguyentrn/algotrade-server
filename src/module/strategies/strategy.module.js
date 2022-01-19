import { Module, Global } from '@nestjs/common';

import { StrategyController } from './strategy.controller';
import { StrategyService } from './strategy.service';

@Global()
@Module({
  controllers: [StrategyController],
  providers: [StrategyService],
})
export class StrategyModule {}
