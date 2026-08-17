import { AuthService } from './auth.service';
import mongoose from 'mongoose';

describe('AuthService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes the generated confirmation code to registration email', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const userModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue({ _id: 'user_id' }),
    };
    const emailService = {
      sendConfirmMail: jest.fn().mockResolvedValue(undefined),
    };

    const service = new AuthService(
      userModel as any,
      {} as any,
      {} as any,
      { get: jest.fn((key: string) => (key === 'SALT' ? '1' : undefined)) } as any,
      emailService as any,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
    );

    await service.registration('wallet-1', {
      email: 'user@example.com',
      password: 'password',
      username: 'alice',
    } as any);

    expect(emailService.sendConfirmMail).toHaveBeenCalledWith('user@example.com', 'AAAAA', 'alice');
    expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
      { wallet: 'wallet-1' },
      expect.objectContaining({
        email: 'user@example.com',
        username: 'alice',
        code: 'AAAAA',
      })
    );
  });

  it('activates wallet registration and returns fresh tokens after email verification', async () => {
    const userId = new mongoose.Types.ObjectId();
    const user = {
      _id: userId,
      wallet: '0xabc',
      email: '',
      emailTmp: 'user@example.com',
      code: 'A1b2C',
      role: ['user'],
      isActive: false,
      isCodeActivated: false,
      is2FAEnabled: false,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const userModel = {
      findOne: jest.fn().mockResolvedValue(user),
    };
    const jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET_ACCESS') return 'access-secret';
        if (key === 'JWT_SECRET_REFRESH') return 'refresh-secret';
        return undefined;
      }),
    };
    const refService = {
      activateUserRefCode: jest.fn().mockResolvedValue(undefined),
    };

    const service = new AuthService(
      userModel as any,
      {} as any,
      jwtService as any,
      configService as any,
      {} as any,
      {} as any,
      refService as any,
      { log: jest.fn() } as any,
    );

    const result = await service.confirmEmailByCode(
      userId.toString(),
      '0xABC',
      ' A1b2C ',
      ' INV1 '
    );

    expect(userModel.findOne).toHaveBeenCalledWith({
      _id: userId,
      wallet: '0xabc',
      code: 'A1b2C',
    });
    expect(user.isActive).toBe(true);
    expect(user.isCodeActivated).toBe(true);
    expect(user.email).toBe('user@example.com');
    expect(user.emailTmp).toBe('');
    expect(user.code).toBe('');
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(refService.activateUserRefCode).toHaveBeenCalledWith(
      'INV1',
      '0xabc'
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: userId,
        email: 'user@example.com',
        wallet: '0xabc',
        role: ['user'],
        isActive: true,
        is2FAVerified: true,
        is2FAEnabled: false,
      }),
      expect.objectContaining({
        expiresIn: '7d',
        secret: 'access-secret',
      })
    );
    expect(result).toEqual({
      valid: true,
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
      user: {
        _id: userId,
        wallet: '0xabc',
        email: 'user@example.com',
        role: ['user'],
        isActive: true,
      },
    });
  });

});
