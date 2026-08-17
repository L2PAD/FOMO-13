import { NewsSections } from "../models/news.model";

export class CreateNewsDto {
  title: string;

  date: Date;

  type: string;

  text: string;

  image: File;

  projectId?: string;

  page: string

  recommendations: string

  status?: string

  isAdminCreate?: boolean

  sourceUrl?: string

  newsSection?: NewsSections

  isUserCreator?: boolean
}