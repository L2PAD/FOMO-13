import { ArgumentMetadata, Injectable, ValidationPipe } from "@nestjs/common";
import { getMetadataStorage } from "class-validator";

const PRIMITIVE_TYPES: Function[] = [String, Boolean, Number, Array, Object];

@Injectable()
export class SafeValidationPipe extends ValidationPipe {
  private readonly legacyPipe = new ValidationPipe({
    whitelist: false,
    transform: true,
    forbidUnknownValues: false,
    forbidNonWhitelisted: false,
  });

  constructor() {
    super({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
      forbidNonWhitelisted: false,
    });
  }

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (this.hasValidationMetadata(metadata.metatype)) {
      return super.transform(value, metadata);
    }

    return this.legacyPipe.transform(value, metadata);
  }

  private hasValidationMetadata(metatype?: Function): boolean {
    if (!metatype || PRIMITIVE_TYPES.includes(metatype)) return false;

    return getMetadataStorage().getTargetValidationMetadatas(
      metatype,
      "",
      false,
      false,
    ).length > 0;
  }
}

