import { Module } from '@nestjs/common';
import { EvalsService } from './evals.service';
import { EvalsController } from './evals.controller';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [GeminiModule],
  controllers: [EvalsController],
  providers: [EvalsService],
})
export class EvalsModule {}
