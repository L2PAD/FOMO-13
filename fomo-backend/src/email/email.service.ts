import { Injectable, HttpException, Logger } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common/enums';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Resend } from 'resend';
import type { Attachment, CreateEmailOptions } from 'resend';
import { MessageTelegramDto } from 'src/telegram/dto/message.dto';
import { User } from 'src/user/user.model';

const EMAIL_LOGO_CONTENT_ID = 'fomo-main-logo';
const EMAIL_LOGO_CID_URL = `cid:${EMAIL_LOGO_CONTENT_ID}`;
const EMAIL_LOGO_FILENAME = 'MainLogo.png';

const NewEmailTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{TITLE_BODY}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6fb; font-family:'Gilroy', Arial, Helvetica, sans-serif; color:#1f2a37;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6fb;">
      <tr>
        <td align="center" style="padding:40px 0;">
          
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" 
                 style="background-color:#00053014; border-radius:12px;">
            <tr>
              <td style="padding:4px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                       style="background-color:#ffffff; border-radius:12px;">
                  <tr>
                    <td class="header" align="center" style="padding:32px 24px 8px;">
                      <a target="_blank" href="https://fomo.cx">
                        <img
                          src="{LOGO_URL}"
                          alt="FOMO Logo"
                          width="120"
                          style="display:block; border:0;"
                        />
                      </a>
                      <h2 style="font-size:24px; font-weight:600; margin:24px 0; line-height:32px; color:#031b4e;">
                        {TITLE_H1}
                      </h2>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 32px;">
                      <p style="font-size:16px; line-height:1.6; color:#333;">Hi <b>{{username}}</b>,</p>
                      <p style="font-size:16px; line-height:1.6; color:#333;">
                        {TEXT_P}
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding:28px 32px 16px;">
                      <a href="{{activationLink}}"
                         style="background-color:#04a584; color:#ffffff; font-weight:500;
                                text-decoration:none; padding:10px 32px; border-radius:8px; display:inline-block;">
                        {{activationLinkText}}
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 32px;">
                    
                      <p style="color:#738094; font-size:14px; line-height:20px;">
                        See you inside,<br />
                        <strong>The FOMO Team</strong>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="left" style="font-size:13px; line-height:1.5; color:#738094; padding:20px 32px 40px; background-color:#f7f8fa; border-radius:0 0 12px 12px;">
                      {FOOTER_TEXT}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`

const NewUpdateEmailTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>{TITLE_BODY}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6fb; font-family:'Gilroy', Arial, Helvetica, sans-serif; color:#1f2a37;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6fb;">
      <tr>
        <td align="center" style="padding:40px 0;">
          
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" 
                 style="background-color:#00053014; border-radius:12px;">
            <tr>
              <td style="padding:4px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
                       style="background-color:#ffffff; border-radius:12px;">
                  <tr>
                    <td class="header" align="center" style="padding:32px 24px 8px;">
                      <a target="_blank" href="https://fomo.cx">
                        <img
                          src="{LOGO_URL}"
                          alt="FOMO Logo"
                          width="120"
                          style="display:block; border:0;"
                        />
                      </a>
                      <h2 style="font-size:24px; font-weight:600; margin:24px 0; line-height:32px; color:#031b4e;">
                        {TITLE_H1}
                      </h2>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 32px;">
                      <p style="font-size:16px; line-height:1.6; color:#333;">Hi <b>{{username}}</b>,</p>
                      <p style="font-size:16px; line-height:1.6; color:#333;">
                        {TEXT_P}
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="padding:28px 32px 16px;font-size:18px; line-height:1.6;font-weight:600;">
                        {{activationLinkText}}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 32px;">
                    
                      <p style="color:#738094; font-size:14px; line-height:20px;">
                        See you inside,<br />
                        <strong>The FOMO Team</strong>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="left" style="font-size:13px; line-height:1.5; color:#738094; padding:20px 32px 40px; background-color:#f7f8fa; border-radius:0 0 12px 12px;">
                      {FOOTER_TEXT}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`

const MessageTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{TITLE_BODY}</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 720px;
            margin: 0 auto;
            padding: 20px 50px;
            border: 2px solid rgb(0, 192, 153);
            border-radius: 8px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo {
            max-width: 220px;
            height: auto;
        }
        .content {
            text-align: left;
            font-size:18px;
        }
        .activation-link {
            display: block;
            margin-top: 20px;
            color:rgb(0, 192, 153);
            font-size:20px;
        }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img class="logo" src="{LOGO_URL}" alt="FOMO Logo">
                <h1>FOMO Support: {TITLE_H1}</h1>
            </div>
            <div class="content">
                <p>{TEXT_P}</p>
                <p>If you have any questions, feel free to contact us.</p>
            </div>
        </div>
    </body>
    </html>
`;

const NotificationTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{TITLE_BODY}</title>
        <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 720px;
            margin: 0 auto;
            padding: 20px 50px;
            border: 2px solid rgb(0, 192, 153);
            border-radius: 8px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo {
            max-width: 220px;
            height: auto;
        }
        .content {
            text-align: left;
            font-size:18px;
        }
        .activation-link {
            display: block;
            margin-top: 20px;
            color:rgb(0, 192, 153);
            font-size:20px;
        }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img class="logo" src="{LOGO_URL}" alt="FOMO Logo">
                <h1>FOMO Notification</h1>
            </div>
            <div class="content">
                <p>{TEXT_P}</p>
                <p>If you have any questions, feel free to contact us.</p>
                <a href="{LINK_A}">{ITEM_NAME}</a>
            </div>
        </div>
    </body>
    </html>
`;

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private resend?: Resend;
    private emailLogoAttachment?: Attachment | null;

    constructor(
        private readonly configService: ConfigService
    ) {
        // this.sendConfirmMail('boikod887@gmail.com', 'test', 'test')
    }

    private getResendClient(): Resend {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');

        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not configured');
        }

        if (!this.resend) {
            this.resend = new Resend(apiKey);
        }

        return this.resend;
    }

    private getMailFrom(): string {
        const from = this.configService.get<string>('MAIL_FROM');

        if (!from) {
            throw new Error('MAIL_FROM is not configured');
        }

        return from;
    }

    private getReplyTo(): string | undefined {
        const replyTo = this.configService.get<string>('MAIL_REPLY_TO');

        return replyTo || undefined;
    }

    private getPublicEmailLogoUrl(): string {
        const assetBaseUrl = this.configService.get<string>('ASSET_PUBLIC_BASE_URL') || 'https://api.fomo.cx/uploads';
        const trimmedAssetBaseUrl = assetBaseUrl.replace(/\/+$/, '');

        return `${trimmedAssetBaseUrl}/${EMAIL_LOGO_FILENAME}`;
    }

    private getEmailLogoUrl(): string {
        return this.getEmailLogoAttachment() ? EMAIL_LOGO_CID_URL : this.getPublicEmailLogoUrl();
    }

    private getEmailLogoAttachment(): Attachment | null {
        if (this.emailLogoAttachment !== undefined) {
            return this.emailLogoAttachment;
        }

        const logoPath = join(process.cwd(), 'uploads', EMAIL_LOGO_FILENAME);

        if (!existsSync(logoPath)) {
            this.emailLogoAttachment = null;
            return this.emailLogoAttachment;
        }

        this.emailLogoAttachment = {
            filename: EMAIL_LOGO_FILENAME,
            content: readFileSync(logoPath),
            contentType: 'image/png',
            contentId: EMAIL_LOGO_CONTENT_ID,
        };

        return this.emailLogoAttachment;
    }

    private getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }

        return String(error);
    }

    private async sendMail(options: {
        category: 'registration' | 'change_email' | 'reset_password' | 'support' | 'notification';
        to: string;
        subject: string;
        html: string;
        attachments?: Attachment[];
    }): Promise<void> {
        const payload: CreateEmailOptions = {
            from: this.getMailFrom(),
            to: options.to,
            subject: options.subject,
            html: options.html,
            tags: [
                {
                    name: 'category',
                    value: options.category,
                },
            ],
        };

        const replyTo = this.getReplyTo();

        if (replyTo) {
            payload.replyTo = replyTo;
        }

        const attachments = [...(options.attachments || [])];

        if (options.html.includes(EMAIL_LOGO_CID_URL)) {
            const logoAttachment = this.getEmailLogoAttachment();

            if (logoAttachment) {
                attachments.unshift(logoAttachment);
            }
        }

        if (attachments.length) {
            payload.attachments = attachments;
        }

        try {
            const { data, error } = await this.getResendClient().emails.send(payload);

            if (error) {
                this.logger.error(
                    `Email send failed category=${options.category} to=${options.to} subject="${options.subject}" code=${error.name} status=${error.statusCode} message=${error.message}`
                );
                throw new HttpException('Send mail error', HttpStatus.BAD_GATEWAY);
            }

            this.logger.log(
                `Email sent category=${options.category} to=${options.to} subject="${options.subject}" id=${data?.id || 'unknown'}`
            );
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }

            this.logger.error(
                `Email send failed category=${options.category} to=${options.to} subject="${options.subject}" message=${this.getErrorMessage(error)}`
            );
            throw new HttpException('Send mail error', HttpStatus.BAD_GATEWAY);
        }
    }

    async sendConfirmMail(email: string, authCode: string, username?: string) {
        try {
            const mailOptions = {
                category: 'registration' as const,
                to: email,
                subject: 'FOMO registration',
                html: NewUpdateEmailTemplate
                    .replace('{LOGO_URL}', this.getEmailLogoUrl())
                    .replace('{TITLE_BODY}', 'FOMO Registration Confirmation')
                    .replace('{{username}}', username || email)
                    .replace('{FOOTER_TEXT}', `
                    Need help? Just drop us a line at
                      <a href="mailto:support@email.com" style="color:#738094; text-decoration:none;">support@email.com</a>
                      — we’ve got your back.
                        `)
                    .replace('{TITLE_H1}', `
                        Welcome aboard!
Let's get your account ready 🚀
                        `)
                    .replace('{TEXT_P}',
                        `
                        Thanks for signing up with <strong>FOMO</strong> – we’re excited to have you on board!
To complete your registration, please confirm your email address by code below:
                        `
                    )
                    .replace('{{activationLinkText}}', authCode)
            }

            await this.sendMail(mailOptions)
        } catch (error) {
            throw error
        }
    }

    async sendChangeMail(newEmail: string, oldEmail: string, userData: User) {
        try {
            const mailOptions = {
                category: 'change_email' as const,
                to: newEmail,
                subject: 'FOMO change email',
                html: NewEmailTemplate
                    .replace('{LOGO_URL}', this.getEmailLogoUrl())
                    .replace('{TITLE_BODY}', 'FOMO')
                    .replace('{TITLE_H1}', 'Change email confirmation at FOMO')
                    .replace('{TEXT_P}', 'Forward link to change email:')
                    .replace('{{activationLink}}', `${this.configService.get('API_URL')}/user/email/confirm-change?old=${oldEmail}&new=${newEmail}&code=${userData.code}`)
                    .replace('{{activationLinkText}}', 'Confirm change email')

            }

            await this.sendMail(mailOptions)
        } catch (error) {
            throw error
        }
    }

    async sendResetPassword(email: string, code: string, username?: string) {
        try {
            const mailOptions = {
                category: 'reset_password' as const,
                to: email,
                subject: 'FOMO reset password',
                html: NewEmailTemplate
                    .replace('{LOGO_URL}', this.getEmailLogoUrl())
                    .replace('{TITLE_BODY}', 'FOMO')
                    .replace('{TITLE_H1}', 'Change your password at FOMO')
                    .replace('{{username}}', username || email)
                    .replace('{FOOTER_TEXT}', `
                    Got questions? Reach out to us anytime at 
                      <a href="mailto:support@email.com" style="color:#738094; text-decoration:none;">support@email.com</a>
                      — we’ve got your back.
                        `)
                    .replace('{TEXT_GRAY}', 'If you didn’t request this change, you can safely ignore this email — your current password will remain unchanged.')
                    .replace('{TEXT_P}',
                        `
                        We received a request to reset the password for your FOMO account.
                        <br/>
                        <br/>
                        Your temporary password: <strong>${code}</strong>
                        <br/>
                        <br/>
                        To complete the reset, please confirm it by clicking the button below:
                        `
                    )
                    .replace('{{activationLink}}', `${this.configService.get('API_URL')}/auth/reset/${code}`)
                    .replace('{{activationLinkText}}', 'Confirm password reset')
            }

            await this.sendMail(mailOptions)
        } catch (error) {
            throw error
        }
    }

    async sendMessage(userEmail: string, body: MessageTelegramDto) {
        const mailOptions: any = {
            category: 'support' as const,
            to: userEmail,
            subject: 'FOMO Support',
            html: MessageTemplate
                .replace('{LOGO_URL}', this.getEmailLogoUrl())
                .replace('{TITLE_BODY}', 'FOMO Support')
                .replace('{TITLE_H1}', body.title)
                .replace('{TEXT_P}', body.message),
        }

        if (body.file) {
            mailOptions.attachments = [
                {
                    filename: body.file.originalName,
                    content: body.file.buffer,
                    contentType: body.file.mimetype
                }
            ]
        }

        await this.sendMail(mailOptions)
    }

    async sendNotification(userEmail: string, itemName: string, link: string) {
        const mailOptions: any = {
            category: 'notification' as const,
            to: userEmail,
            subject: 'FOMO',
            html: NotificationTemplate
                .replace('{LOGO_URL}', this.getEmailLogoUrl())
                .replace('{TITLE_BODY}', 'FOMO')
                .replace('{TEXT_P}', `The project <b>${itemName}</b> has been updated, you can see it at the link`)
                .replace('{LINK_A}', link)
                .replace('{ITEM_NAME}', itemName)
        }

        await this.sendMail(mailOptions)
    }
}
