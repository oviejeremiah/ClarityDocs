import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProviderLog } from './entities/provider-log.entity';
import { ProviderLogsService } from './provider-logs.service';
import { ProviderLogsController } from './provider-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProviderLog])],
  controllers: [ProviderLogsController],
  providers: [ProviderLogsService],
  exports: [ProviderLogsService],
})
export class ProviderLogsModule {}
