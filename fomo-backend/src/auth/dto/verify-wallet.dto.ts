import { IsEthereumAddress, IsString } from 'class-validator';

export class VerifyWalletDto {
    @IsEthereumAddress()
    address: string;

    @IsString()
    message: string;

    @IsString()
    signature: string;
}
