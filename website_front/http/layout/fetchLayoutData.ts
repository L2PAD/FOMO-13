import { API } from "../../config/api";

export interface ILayoutBanner {
  text?: string;
  link?: string;
  isVisible?: boolean;
}

export interface ILayoutResponse {
  banner?: ILayoutBanner;
  header?: any;
  footer?: any;
  updates?: any[];
}

export default async (): Promise<{ isSuccess: boolean; layout: ILayoutResponse }> => {
  try {
    const res = await fetch(`${API}/layout`, {
      method: "GET",
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, layout: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, layout: {} };
  }
};
