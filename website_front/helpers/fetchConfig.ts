import { API } from "../config/api";

export const configureUrl = (path: string): string => {
  return `${API}/${path}`;
};

export const configureFetchForm = (
  method: "POST" | "PUT" | "DELETE",
  body: object,
  headers: any
) => {
  const data = new FormData();

  Object.entries(body).forEach((item) => {
    let isReturn = false;
    const key: string = item[0];
    let value: any = item[1];

    if (key === "fullness") {
      value = value + "%";
    }
    if (key === "investors") {
      data.append(
        key,
        value?.map((item: any) => item?._id)
      );
      isReturn = true;
    }

    if (key === "participated") {
      data.append(
        key,
        value?.map((item: any) => item?._id)
      );
      isReturn = true;
    }

    if (key === "projects") {
      data.append(
        key,
        value?.map((item: any) => item?._id)
      );
      isReturn = true;
    }

    if (key === "regionData") {
      data.append(key, JSON.stringify(value));
      isReturn = true;
    }

    if (key === "socialmedia") {
      data.append(key, JSON.stringify(value));
      isReturn = true;
    }

    if (!isReturn) data.append(key, value);
  });

  return {
    method,
    headers,
    body: data,
  };
};
