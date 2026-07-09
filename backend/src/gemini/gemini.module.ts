import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [AiService],
  exports: [AiService],
})
export class GeminiModule {}
