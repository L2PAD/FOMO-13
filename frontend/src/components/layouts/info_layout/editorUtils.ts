import { InfoRecord, InfoValue } from '../../services/infoLanding'
import { buildDefaultRecord, FieldSchema } from './sectionRegistry'

const snakeToCamel = (value: string): string =>
  value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())

const legacyCandidates = (key: string): string[] => {
  const candidates = [key, snakeToCamel(key)]

  if (key.endsWith('_en')) {
    const base = key.slice(0, -3)
    candidates.push(base, snakeToCamel(base))
  }
  if (!key.endsWith('_en') && !key.endsWith('_ru')) {
    candidates.push(`${key}_en`, snakeToCamel(`${key}_en`))
  }
  if (key === 'navigation_sections') candidates.push('nav_sections', 'navSections')
  if (key === 'whitepaper_url') candidates.push('whitepaper_button_link', 'whitepaperButtonLink')
  if (key === 'image_url') candidates.push('image', 'imageUrl')
  if (key === 'profile_image') candidates.push('profile_image_url', 'profileImageUrl')
  if (key === 'title_en') candidates.push('name_en', 'nameEn')
  if (key === 'title_ru') candidates.push('name_ru', 'nameRu')
  if (key === 'link') candidates.push('href')
  if (key === 'section_badge_en') candidates.push('badge_text_en', 'badge_en', 'badge')
  if (key === 'section_badge_ru') candidates.push('badge_text_ru', 'badge_ru')
  if (key === 'section_title_en') candidates.push('title_en', 'title')
  if (key === 'section_title_ru') candidates.push('title_ru')
  if (key === 'section_description_en') candidates.push('subtitle_en', 'subtitle')
  if (key === 'section_description_ru') candidates.push('subtitle_ru')
  if (key === 'bottom_hint_en') candidates.push('click_hint')
  if (key === 'bottom_hint_ru') candidates.push('click_back_hint')
  if (key === 'badge_en') candidates.push('section_badge_en', 'section_badge')
  if (key === 'badge_ru') candidates.push('section_badge_ru')
  if (key === 'subtitle_en') candidates.push('section_subtitle_en', 'section_subtitle')
  if (key === 'subtitle_ru') candidates.push('section_subtitle_ru')
  if (key === 'site_title') candidates.push('title')
  if (key === 'site_description') candidates.push('description')
  if (key === 'site_keywords') candidates.push('keywords')

  return Array.from(new Set(candidates))
}

const valueFromAliases = (source: InfoRecord, key: string): InfoValue | undefined => {
  for (const candidate of legacyCandidates(key)) {
    if (source[candidate] !== undefined) return source[candidate]
  }
  return undefined
}

export const hydrateRecord = (
  source: InfoRecord | null | undefined,
  fields: FieldSchema[],
): InfoRecord => {
  const defaults = buildDefaultRecord(fields)
  if (!source) return defaults

  return fields.reduce<InfoRecord>((record, field) => {
    const incoming = valueFromAliases(source, field.key)
    const normalizedIncoming =
      field.key === 'primary' &&
      incoming === undefined &&
      typeof source.variant === 'string'
        ? source.variant === 'primary'
        : incoming

    if (field.kind === 'list') {
      record[field.key] = Array.isArray(incoming)
        ? incoming.map((item) =>
            item && typeof item === 'object' && !Array.isArray(item)
              ? hydrateRecord(item as InfoRecord, field.itemFields || [])
              : item,
          )
        : defaults[field.key]
      return record
    }

    if (field.kind === 'object') {
      record[field.key] =
        incoming && typeof incoming === 'object' && !Array.isArray(incoming)
          ? hydrateRecord(incoming as InfoRecord, field.itemFields || [])
          : defaults[field.key]
      return record
    }

    record[field.key] =
      normalizedIncoming !== undefined ? normalizedIncoming : defaults[field.key]
    return record
  }, {})
}

export const recordFingerprint = (value: InfoRecord): string => JSON.stringify(value)

export const validateRecord = (
  value: InfoRecord,
  fields: FieldSchema[],
  prefix = '',
): string[] =>
  fields.reduce<string[]>((errors, field) => {
    const current = value[field.key]
    const label = prefix ? `${prefix} · ${field.label}` : field.label

    if (
      field.required &&
      (current === undefined ||
        current === null ||
        (typeof current === 'string' && !current.trim()))
    ) {
      errors.push(label)
    }

    if (field.kind === 'list' && Array.isArray(current)) {
      current.forEach((item, index) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          errors.push(
            ...validateRecord(
              item as InfoRecord,
              field.itemFields || [],
              `${label} ${index + 1}`,
            ),
          )
        }
      })
    }
    if (
      field.kind === 'object' &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      errors.push(
        ...validateRecord(current as InfoRecord, field.itemFields || [], label),
      )
    }
    return errors
  }, [])

export const getRecordTitle = (
  value: InfoRecord,
  titleKeys: string[] = [],
  fallback = 'Untitled item',
): string => {
  for (const key of titleKeys) {
    const candidate = valueFromAliases(value, key)
    if (typeof candidate === 'string' && candidate.trim()) return candidate
  }
  return fallback
}

export const formatApiError = (error: unknown): string =>
  error instanceof Error ? error.message : 'The request could not be completed.'
