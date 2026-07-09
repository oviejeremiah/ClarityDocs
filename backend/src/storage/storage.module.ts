import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { DocumentConverterService } from './document-converter.service';

@Module({
  providers: [StorageService, DocumentConverterService],
  exports: [StorageService, DocumentConverterService],
})
export class StorageModule {}
