import { Module, Global } from '@nestjs/common';

import { TradingPairController } from './tradingPair.controller';
import { TradingPairService } from './tradingPair.service';

@Global()
@Module({
  controllers: [TradingPairController],
  providers: [TradingPairService],
})
export class TradingPairModule {}
