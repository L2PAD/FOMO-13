import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class InfoWalletRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  wallet_address: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  twitter_username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referral_code?: string;
}

export class InfoUserRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  wallet_address: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invite_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referrer_code?: string;
}

export class InfoInviteVerifyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  invite_code: string;
}

export class InfoTwitterConnectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  wallet_address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  twitter_username: string;
}

export class InfoAcceptTermsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  wallet_address: string;
}

export class InfoWalletUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  twitter_username?: string;
}
