export interface ILoginData {
  email: string;
  password: string;
}

export interface IReturnData {
  success: boolean;
  data?: any;
}

export interface IFetchData {
  success: boolean;
  data: Array<any>;
}
