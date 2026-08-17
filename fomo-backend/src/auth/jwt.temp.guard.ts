import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Request , Response} from "express"
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
export class JwtTempGuard implements CanActivate{
    private aToken : string;
    private roles : string[];

    constructor(
        private readonly jwtService: JwtService ,
        private readonly configService: ConfigService,
        private reflector: Reflector,
        ){}

    canActivate( context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>{
        try{
            this.roles = this.reflector.getAllAndOverride('roles', [
                context.getHandler(),
                context.getClass()
            ]);
            const request : Request = context.switchToHttp().getRequest();
            
            this.aToken = request.headers.authorization.split(' ')[1]
           
            const accessVerify = this.jwtService.verify(this.aToken,{
                secret: this.configService.get('JWT_SECRET_ACCESS')
            })
            const payload = this.jwtService.decode(this.aToken)
      
            request.user = payload

            return !!this.checkUserRole(accessVerify.role,this.roles[0])  

        }catch(error){
            console.log(error)
            
            return false
        }      
    }

    checkUserRole(userRoles: string[],requiredRole: string){
        if(requiredRole === 'any') return true
        
        return userRoles.find((item : string) => requiredRole.includes(item))
    }

}