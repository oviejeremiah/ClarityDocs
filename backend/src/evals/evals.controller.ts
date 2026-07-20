import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EvalsService } from './evals.service';

@ApiTags('evals')
@Controller('api/evals')
export class EvalsController {
  constructor(private readonly evalsService: EvalsService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run the AI extraction accuracy evaluation suite' })
  run() {
    return this.evalsService.runAll();
  }
}
