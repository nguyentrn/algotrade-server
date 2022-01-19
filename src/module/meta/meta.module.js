import { Module, Global } from '@nestjs/common';

import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';

@Global()
@Module({
  controllers: [MetaController],
  providers: [MetaService],
})
export class MetaModule {}
