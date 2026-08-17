export class CreateAppealDto {
  reason: string;
  description: string;
  email: string;
  attachments?: string[];
}
