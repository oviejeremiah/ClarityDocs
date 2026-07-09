import { Injectable, BadRequestException, PipeTransform } from '@nestjs/common';
import { ObjectSchema } from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private readonly schema: ObjectSchema) {}

  transform<T>(value: T): T {
    const { error } = this.schema.validate(value, {
      abortEarly: false,
      allowUnknown: true,
    });
    if (error) {
      throw new BadRequestException(`Validation failed: ${error.message}`);
    }
    return value;
  }
}
