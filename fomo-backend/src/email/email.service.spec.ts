import { HttpException, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailService } from './email.service';

jest.mock('resend', () => ({
  Resend: jest.fn(),
}));

describe('EmailService', () => {
  const mailFrom = 'FOMO <no-reply@fomo.cx>';
  const replyTo = 'support@fomo.cx';
  const apiUrl = 'https://api.fomo.cx';
  let sendMock: jest.Mock;
  let errorSpy: jest.SpyInstance;

  const createService = (overrides: Record<string, string | undefined> = {}) => {
    const configValues: Record<string, string | undefined> = {
      RESEND_API_KEY: 'resend_test_key',
      MAIL_FROM: mailFrom,
      MAIL_REPLY_TO: replyTo,
      API_URL: apiUrl,
      ...overrides,
    };

    return new EmailService({
      get: jest.fn((key: string) => configValues[key]),
    } as any);
  };

  const getPayload = () => sendMock.mock.calls[0][0];

  const expectInlineLogo = () => {
    const payload = getPayload();

    expect(payload.html).toContain('cid:fomo-main-logo');
    expect(payload.attachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filename: 'MainLogo.png',
          content: expect.any(Buffer),
          contentType: 'image/png',
          contentId: 'fomo-main-logo',
        }),
      ])
    );
  };

  beforeEach(() => {
    sendMock = jest.fn().mockResolvedValue({
      data: { id: 'email_123' },
      error: null,
      headers: null,
    });

    (Resend as unknown as jest.Mock).mockImplementation(() => ({
      emails: {
        send: sendMock,
      },
    }));

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends registration confirmation through Resend', async () => {
    const service = createService();

    await service.sendConfirmMail('user@example.com', 'ABCDE', 'alice');

    expect(getPayload()).toMatchObject({
      from: mailFrom,
      to: 'user@example.com',
      subject: 'FOMO registration',
      replyTo,
      tags: [{ name: 'category', value: 'registration' }],
    });
    expect(getPayload().html).toContain('ABCDE');
    expect(getPayload().html).toContain('<b>alice</b>');
    expectInlineLogo();
  });

  it('sends change email confirmation with the existing confirmation link', async () => {
    const service = createService();

    await service.sendChangeMail('new@example.com', 'old@example.com', { code: 'CHANGE1' } as any);

    expect(getPayload()).toMatchObject({
      from: mailFrom,
      to: 'new@example.com',
      subject: 'FOMO change email',
      replyTo,
      tags: [{ name: 'category', value: 'change_email' }],
    });
    expect(getPayload().html).toContain(
      `${apiUrl}/user/email/confirm-change?old=old@example.com&new=new@example.com&code=CHANGE1`
    );
    expectInlineLogo();
  });

  it('sends reset password email with the existing reset link', async () => {
    const service = createService();

    await service.sendResetPassword('user@example.com', 'RESET1', 'alice');

    expect(getPayload()).toMatchObject({
      from: mailFrom,
      to: 'user@example.com',
      subject: 'FOMO reset password',
      replyTo,
      tags: [{ name: 'category', value: 'reset_password' }],
    });
    expect(getPayload().html).toContain('<strong>RESET1</strong>');
    expect(getPayload().html).toContain(`${apiUrl}/auth/reset/RESET1`);
    expectInlineLogo();
  });

  it('sends support message with attachment buffer', async () => {
    const service = createService();
    const buffer = Buffer.from('attachment-content');

    await service.sendMessage('admin@example.com', {
      title: 'Need help',
      message: 'Message body',
      file: {
        originalName: 'proof.txt',
        buffer,
        mimetype: 'text/plain',
      },
    });

    expect(getPayload()).toMatchObject({
      from: mailFrom,
      to: 'admin@example.com',
      subject: 'FOMO Support',
      replyTo,
      tags: [{ name: 'category', value: 'support' }],
    });
    expect(getPayload().attachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          filename: 'proof.txt',
          content: buffer,
          contentType: 'text/plain',
        }),
      ])
    );
    expect(getPayload().html).toContain('Need help');
    expect(getPayload().html).toContain('Message body');
    expectInlineLogo();
  });

  it('sends notification email', async () => {
    const service = createService();

    await service.sendNotification('user@example.com', 'Project X', 'https://fomo.cx/project-x');

    expect(getPayload()).toMatchObject({
      from: mailFrom,
      to: 'user@example.com',
      subject: 'FOMO',
      replyTo,
      tags: [{ name: 'category', value: 'notification' }],
    });
    expect(getPayload().html).toContain('Project X');
    expect(getPayload().html).toContain('https://fomo.cx/project-x');
    expectInlineLogo();
  });

  it('throws HttpException and does not log reset codes when Resend rejects the send', async () => {
    const service = createService();

    sendMock.mockResolvedValueOnce({
      data: null,
      error: {
        name: 'invalid_api_key',
        statusCode: 401,
        message: 'Invalid API key',
      },
      headers: null,
    });

    await expect(service.sendResetPassword('user@example.com', 'SECRET_RESET_CODE')).rejects.toBeInstanceOf(
      HttpException
    );
    expect(String(errorSpy.mock.calls)).not.toContain('SECRET_RESET_CODE');
  });
});
