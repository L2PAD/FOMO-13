import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";

export interface IAdminTabColumn {
  key: string;
  label: string;
  enabled: boolean;
  order: number;
  blockName?: string;
  name?: string;
}

export interface IAdminTab {
  _id: string;
  image?: string;
  name: string;
  key: string;
  description?: string;
  type?: string;
  isActive: boolean;
  isGlobal: boolean;
  isAdminCreated: boolean;
  sortOrder: number;
  columns: IAdminTabColumn[];
  filters?: Record<string, any>;
  tabs?: Array<any>;
  createdAt?: string;
  updatedAt?: string;
}

const request = async (path: string, options?: RequestInit) => {
  const token: string = getAccessToken();

  const response = await fetch(configureUrl(path), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    credentials: "include",
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  return {
    success: response.status < 300,
    data,
  };
};

export const fetchAdminTabs = async (search = "") => {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return request(`admin/tabs${query}`, { method: "GET" });
};

export const fetchAdminTabById = async (id: string) => {
  return request(`admin/tabs/${id}`, { method: "GET" });
};

export const createAdminTab = async (body: Partial<IAdminTab>) => {
  return request("admin/tabs", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

export const updateAdminTab = async (id: string, body: Partial<IAdminTab>) => {
  return request(`admin/tabs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
};

export const deleteAdminTab = async (id: string) => {
  return request(`admin/tabs/${id}`, {
    method: "DELETE",
  });
};

export const toggleAdminTabActive = async (id: string) => {
  return request(`admin/tabs/${id}/toggle-active`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
};

export const reorderAdminTabs = async (
  items: Array<{ id: string; sortOrder: number }>
) => {
  return request("admin/tabs/reorder", {
    method: "PATCH",
    body: JSON.stringify({ items }),
  });
};
