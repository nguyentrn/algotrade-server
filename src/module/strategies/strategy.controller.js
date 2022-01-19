import {
  Controller,
  Get,
  Bind,
  Request,
  Dependencies,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import decodeToken from '../../utils/decodeToken';
import { JwtAuthGuard } from '../auth/auth.guard';
import { StrategyService } from './strategy.service';

@Controller('strategy')
@Dependencies(StrategyService)
export class StrategyController {
  constructor(strategyService) {
    this.strategyService = strategyService;
  }

  @Get()
  async getAll() {
    const strategies = await this.strategiesService.getAll();
    return { status: 200, data: strategies };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @Bind(Request())
  async getMine(req) {
    const { email } = decodeToken(req);
    const strategies = await this.strategyService.getMine(email);
    return { status: 200, data: strategies };
  }

  @UseGuards(JwtAuthGuard)
  @Post('update')
  @Bind(Request(), Body())
  async updateOne(req, body) {
    const { email } = decodeToken(req);
    const data = await this.strategyService.updateOne({
      user: email,
      ...body,
    });
    return { status: 200, data };
  }
}
