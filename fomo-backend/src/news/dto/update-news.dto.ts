export class UpdateNewsDto {
  title?: string;

  date?: Date;

  type?: string;

  text?: string;

  image?: File;

  recommendations: string
}