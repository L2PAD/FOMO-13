import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from "express"
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshAuthGuard implements CanActivate{
    private rToken : string;
    private aToken : string;
    constructor(
        private readonly jwtService: JwtService ,
        private readonly configService: ConfigService,
        ){}
 
    canActivate( context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean>{
        try{
            const request : Request = context.switchToHttp().getRequest();
            
            this.aToken = request.headers.authorization.split(' ')[1]
            
            const accessVerify = this.jwtService.verify(this.aToken,{
                secret: this.configService.get('JWT_SECRET_ACCESS')
            })

            if(accessVerify) return true

            this.rToken = request.cookies.refreshTokenFomo
            
            this.jwtService.verify(this.rToken,{
                secret: this.configService.get('JWT_SECRET_REFRESH')
            })

            return true

        }catch(error){
            console.log(error)
            return false
        }      
    }

}