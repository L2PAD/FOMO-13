import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from "express"
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

declare global {
    namespace Express {
      interface Request {
        user?: any;
      }
    }
  }

@Injectable()
export class JwtAuthGuard implements CanActivate{
    constructor(
        private readonly jwtService: JwtService ,
        private readonly configService: ConfigService,
        private reflector: Reflector,
        ){}

    canActivate( context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>{
        try{
            const roles = this.reflector.getAllAndOverride<string[]>('roles', [
                context.getHandler(),
                context.getClass()
            ]) || [];
            const request : Request = context.switchToHttp().getRequest();

            const accessToken = request.headers.authorization?.split(' ')[1]
            if (!accessToken) return false;
           
            const accessVerify = this.jwtService.verify(accessToken,{
                secret: this.configService.get('JWT_SECRET_ACCESS')
            })
            const payload = this.jwtService.decode(accessToken)
            request.user = payload

            if(!request?.user?.is2FAVerified && request?.user?.is2FAEnabled) throw new Error('2FA required')
           
            return !!this.checkUserRole(accessVerify.role, roles)  

        }catch(error){
            if (process.env.NODE_ENV !== "production") {
                console.log(error)
            }
            
            return false
        }      
    }

    checkUserRole(userRoles: string[] = [], requiredRoles: string[] = []){
        const normalizedRequiredRoles = requiredRoles
            .flatMap((role) => String(role || "").split(","))
            .map((role) => role.trim())
            .filter(Boolean);

        if(!normalizedRequiredRoles.length || normalizedRequiredRoles.includes('any')) return true

        const normalizedUserRoles = new Set(
            (Array.isArray(userRoles) ? userRoles : [userRoles])
                .map((role) => String(role || "").trim())
                .filter(Boolean)
        );

        return normalizedRequiredRoles.some((role) => normalizedUserRoles.has(role))
    }

}
