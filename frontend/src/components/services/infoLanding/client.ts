import { configureUrl } from '../config'
import {
  AnalyticsStats,
  AssetUploadResponse,
  CollectionResponse,
  InfoBootstrap,
  InfoRecord,
  OrderedEntity,
  ReorderItem,
} from './types'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: InfoRecord | InfoRecord[] | FormData
  admin?: boolean
}

export class InfoApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'InfoApiError'
    this.status = status
    this.details = details
  }
}

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, '')

const parseResponse = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text || undefined
}

const errorMessage = (payload: unknown, fallback: string): string => {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (!payload || typeof payload !== 'object') return fallback

  const record = payload as Record<string, unknown>
  const message = record.message || record.error || record.detail

  if (Array.isArray(message)) return message.join(', ')
  if (typeof message === 'string' && message.trim()) return message
  return fallback
}

const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers)
  const token = localStorage.getItem('fomoAccessToken') || ''
  const isFormData = options.body instanceof FormData

  if (options.admin) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (options.body && !isFormData) {
    headers.set('Content-Type', 'application/json')
  }

  const requestBody: BodyInit | undefined = isFormData
    ? (options.body as FormData)
    : options.body
    ? JSON.stringify(options.body)
    : undefined

  const response = await fetch(configureUrl(trimSlashes(path)), {
    ...options,
    headers,
    body: requestBody,
    credentials: 'include',
  })
  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new InfoApiError(
      errorMessage(payload, `Request failed with status ${response.status}`),
      response.status,
      payload,
    )
  }

  return payload as T
}

const unwrapData = <T>(payload: unknown, resource?: string): T => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload as T
  }

  const record = payload as Record<string, unknown>
  if (record.data !== undefined) return record.data as T
  if (record.settings !== undefined) return record.settings as T

  if (resource) {
    const key = resource.replace(/-/g, '_').replace(/\//g, '_')
    if (record[key] !== undefined) return record[key] as T
  }

  return payload as T
}

export const unwrapCollection = <T extends OrderedEntity>(
  payload: unknown,
  resource?: string,
): CollectionResponse<T> => {
  const value = unwrapData<unknown>(payload, resource)
  if (Array.isArray(value)) return { items: value as T[], total: value.length }
  if (!value || typeof value !== 'object') return { items: [], total: 0 }

  const record = value as Record<string, unknown>
  const possibleItems = record.items || record.results || record.rows || record.tasks
  const items = Array.isArray(possibleItems) ? (possibleItems as T[]) : []
  const total = typeof record.total === 'number' ? record.total : items.length
  return { items, total }
}

export const getEntityId = (entity: OrderedEntity): string =>
  String(entity.id || entity._id || '')

export const fetchInfoBootstrap = (): Promise<InfoBootstrap> =>
  request<InfoBootstrap>('info')

export const fetchPublicInfoResource = <T>(resource: string): Promise<T> =>
  request<T>(`info/${trimSlashes(resource)}`).then((payload) =>
    unwrapData<T>(payload, resource),
  )

export const fetchAdminInfoResource = <T>(resource: string): Promise<T> =>
  request<T>(`info/admin/${trimSlashes(resource)}`, { admin: true }).then((payload) =>
    unwrapData<T>(payload, resource),
  )

export const saveInfoSettings = <T extends InfoRecord>(
  resource: string,
  body: T,
): Promise<T> =>
  request<T>(`info/admin/${trimSlashes(resource)}`, {
    method: 'PUT',
    admin: true,
    body,
  }).then((payload) => unwrapData<T>(payload, resource))

export const createInfoItem = <T extends OrderedEntity>(
  resource: string,
  body: T,
): Promise<T> =>
  request<T>(`info/admin/${trimSlashes(resource)}`, {
    method: 'POST',
    admin: true,
    body,
  }).then((payload) => unwrapData<T>(payload, resource))

export const updateInfoItem = <T extends OrderedEntity>(
  resource: string,
  id: string,
  body: T,
): Promise<T> =>
  request<T>(`info/admin/${trimSlashes(resource)}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    admin: true,
    body,
  }).then((payload) => unwrapData<T>(payload, resource))

export const deleteInfoItem = (resource: string, id: string): Promise<void> =>
  request<void>(`info/admin/${trimSlashes(resource)}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    admin: true,
  })

export const reorderInfoItems = (
  resource: string,
  items: ReorderItem[],
): Promise<void> =>
  request<void>(`info/admin/${trimSlashes(resource)}/reorder`, {
    method: 'POST',
    admin: true,
    body: items,
  })

export const uploadInfoAsset = async (file: File): Promise<AssetUploadResponse> => {
  const body = new FormData()
  body.append('file', file)
  const response = await request<AssetUploadResponse>('info/admin/assets', {
    method: 'POST',
    admin: true,
    body,
  })
  const value = unwrapData<AssetUploadResponse>(response)
  return {
    ...value,
    url: value.url || value.full_url || '',
  }
}

export const fetchInfoAnalytics = (period: number): Promise<AnalyticsStats> =>
  request<AnalyticsStats>(`info/admin/analytics/stats?period=${period}`, {
    admin: true,
  }).then((payload) => unwrapData<AnalyticsStats>(payload))

export const clearInfoAnalytics = (): Promise<void> =>
  request<void>('info/admin/analytics/clear', {
    method: 'DELETE',
    admin: true,
  })
