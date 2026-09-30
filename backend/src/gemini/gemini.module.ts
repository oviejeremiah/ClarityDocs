import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ModelRankingService } from './model-ranking.service';
import { StorageModule } from '../storage/storage.module';
import { ProviderLogsModule } from '../provider-logs/provider-logs.module';

@Module({
  imports: [StorageModule, ProviderLogsModule],
  providers: [AiService, ModelRankingService],
  exports: [AiService],
})
export class GeminiModule {}
