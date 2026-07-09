import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';

@ApiTags('health')
@Controller('api/health')
export class HealthController {
  private readonly startTime = Date.now();

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV ?? 'development',
      version: '1.0.0',
    };
  }
}
