import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { LimitsService } from './limits.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class LimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly limitsService: LimitsService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const limit: Array<'projectLimit' | 'newsLimit' | 'shareLimit'> = this.reflector.getAllAndOverride('limits', [
        context.getHandler(),
        context.getClass()
      ]);
      const request = context.switchToHttp().getRequest();
      const userId: string = request.user._id;

      const isVerified: boolean = await this.limitsService.checkUserLimit(userId, limit[0])

      return isVerified;
    } catch (error) {
      console.error(error)

      return false
    }
  }
}