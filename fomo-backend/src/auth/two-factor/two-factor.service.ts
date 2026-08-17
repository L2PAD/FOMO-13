// two-factor.service.ts
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TwoFactorService {
  generateSecret(email: string) {
    const secret = speakeasy.generateSecret({
      name: `FOMO (${email})`,
    });

    return {
      otpauthUrl: secret.otpauth_url,
      base32: secret.base32,
    };
  }

  async generateQRCode(otpauthUrl: string) {
    return await qrcode.toDataURL(otpauthUrl);
  }

  verifyToken(secret: string, token: string) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }
}
