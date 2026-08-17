import { SetMetadata } from '@nestjs/common';

export const Limits = (...limits: string[]) => SetMetadata('limits', limits);