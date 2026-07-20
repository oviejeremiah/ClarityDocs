import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { StorageModule } from '../storage/storage.module';
import { ProviderLogsModule } from '../provider-logs/provider-logs.module';

@Module({
  imports: [StorageModule, ProviderLogsModule],
  providers: [AiService],
  exports: [AiService],
})
export class GeminiModule {}
