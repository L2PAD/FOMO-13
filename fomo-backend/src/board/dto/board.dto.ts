
export class CreateBoardDto {
  name: string;
  users: string[];
  owner:string
  projectId:string
  
  img?:any
}

export class UpdateBoardDto {
  name?: string;

  users?: string[];

  projectId:string

  columns?:{name:string,tasks:string[]}[]

  img?:any
}

export class CreateTaskDto {
  title: string;

  status:number

  description?: string;

  img?:any

  isInviteUser?:string
}

export class UpdateTaskDto {
  title?: string;

  description?: string;

  status?: string;

  img?:any
  isInviteUser?:boolean
}