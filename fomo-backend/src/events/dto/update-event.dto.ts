export class UpdateEventDto {
  _id?:string

  projectId:string

  name?: string;

  date?: Date;

  status?: string;

  stars?: number;
}