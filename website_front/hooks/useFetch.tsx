import { useState, useCallback, useEffect } from "react";
import { configureUrl } from "../helpers/fetchConfig";
import { IReturnData } from "../helpers/types";

const useFetch = (
  path: string,
  options?: object,
  isNotImmidiatly?: boolean
) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IReturnData | undefined>();

  const dataHandler = async () => {
    setLoading(true);

    const responce = await fetchData(path, options);

    if (!responce.success) {
      setLoading(false);
      return;
    }

    setData(responce);

    setLoading(false);
  };

  useEffect((): void => {
    if (!isNotImmidiatly) {
      dataHandler();
    }
  }, []);

  return { data, loading, dataHandler };
};

export const fetchData = async (path: string, options?: object) => {
  try {
    const responce = await fetch(configureUrl(path), {
      ...options,
      credentials: "include",
    });

    const data = await responce.json();

    return { success: true, data };
  } catch (error) {
    console.log(error);
    return { success: false, data: {} };
  }
};

export default useFetch;
