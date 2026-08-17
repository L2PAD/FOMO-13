import { ILegal, ISocial, IFooterApps } from '../../types/global_types';
import getAccessToken from '../../utils/getAccessToken';
import { configureUrl } from '../config';
import { IReturnData } from '../types';

export interface IFooter {
  social: ISocial;
  legal: ILegal;
  apps?: IFooterApps;
}

const responseError = (payload: unknown, fallback: string): string => {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (!payload || typeof payload !== 'object') return fallback;
  const data = payload as { message?: unknown; error?: unknown };
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  if (typeof data.error === 'string' && data.error.trim()) return data.error;
  return fallback;
};

export default async (footer: IFooter): Promise<IReturnData> => {
  try {
    const token = getAccessToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(configureUrl('layout'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(footer),
    });
    const text = await response.text();
    let payload: unknown = undefined;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (_error) {
        payload = text;
      }
    }

    if (!response.ok) {
      return {
        success: false,
        data: responseError(payload, `Could not update footer (${response.status})`),
      };
    }

    return { success: true, data: payload || 'Footer updated' };
  } catch (error) {
    return {
      success: false,
      data: error instanceof Error ? error.message : 'Could not update footer',
    };
  }
};
