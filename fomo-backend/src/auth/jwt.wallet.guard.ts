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
export class JwtWalletGuard implements CanActivate{
    private aToken : string;
    private roles : string[];

    constructor(
        private readonly jwtService: JwtService ,
        private readonly configService: ConfigService,
        private reflector: Reflector,
        ){}

    canActivate( context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>{
        try{
            const request : Request = context.switchToHttp().getRequest();

            this.aToken = request.headers.authorization.split(' ')[1]

            const accessVerify = this.jwtService.verify(this.aToken,{
                secret: this.configService.get('JWT_SECRET_ACCESS')
            })

            const payload : any = this.jwtService.decode(this.aToken)
 
            request.user = {wallet:payload?.wallet}

            return !!payload?.wallet

        }catch(error){
            console.log(error)
            
            return false
        }      
    }
}