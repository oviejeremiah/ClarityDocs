import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProviderLogsService } from './provider-logs.service';

@ApiTags('provider-logs')
@Controller('api/provider-logs')
export class ProviderLogsController {
  constructor(private readonly providerLogsService: ProviderLogsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get AI provider usage statistics' })
  getStats() {
    return this.providerLogsService.getStats();
  }
}
