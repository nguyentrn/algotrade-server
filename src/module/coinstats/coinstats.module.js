import { Module, Global } from '@nestjs/common';

import { CoinstatsController } from './coinstats.controller';
import { CoinstatsService } from './coinstats.service';

@Global()
@Module({
  controllers: [CoinstatsController],
  providers: [CoinstatsService],
})
export class CoinstatsModule {}
