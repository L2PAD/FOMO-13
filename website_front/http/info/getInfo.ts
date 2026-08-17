import { configureUrl } from "../../helpers/fetchConfig";
import { IReturnData } from "../../helpers/types";

export default async (): Promise<IReturnData> => {
  try {
    const responce = await fetch(configureUrl(`info`));

    const data = await responce.json();

    return { success: responce.status < 300, data };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};
