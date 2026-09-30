import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { DocumentConverterService } from './document-converter.service';
import { ObjectStorageService } from './object-storage.service';

@Module({
  providers: [StorageService, DocumentConverterService, ObjectStorageService],
  exports: [StorageService, DocumentConverterService, ObjectStorageService],
})
export class StorageModule {}
