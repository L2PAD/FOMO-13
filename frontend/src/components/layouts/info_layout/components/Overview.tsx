import React, { useMemo } from 'react'
import { InfoBootstrap, InfoRecord, InfoValue } from '../../../services/infoLanding'
import { infoSections, ResourceEditorDefinition } from '../sectionRegistry'
import { useInfoStyles } from '../styles'
import { ErrorState, LoadingState } from './StateViews'

interface OverviewProps {
  data?: InfoBootstrap
  loading: boolean
  error: unknown
  onRetry: () => void
  onSelectSection: (sectionId: string) => void
}

const valueAt = (source: InfoRecord, path: string[]): InfoValue | undefined => {
  let current: InfoValue | undefined = source
  for (const key of path) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined
    }
    current = (current as InfoRecord)[key]
  }
  return current
}

const resolveBootstrapValue = (
  bootstrap: InfoBootstrap,
  editor: ResourceEditorDefinition,
): InfoValue | undefined => {
  const directKey = editor.bootstrapKey || editor.resource.replace(/[-/]/g, '_')
  const direct = bootstrap[directKey]
  if (direct !== undefined) return direct

  const aliases: Record<string, string[][]> = {
    'navigation_items': [['navigation']],
    'hero_settings': [['hero'], ['hero', 'settings']],
    'hero_buttons': [['hero', 'buttons'], ['hero', 'actions']],
    'about_settings': [['about']],
    'utilities_settings': [['utilities', 'settings']],
    'utilities': [['utilities', 'items']],
    'utility_nav_buttons': [['utilities', 'navButtons'], ['utilities', 'nav_buttons']],
    'platform_settings': [['platform']],
    'nft_mechanics_settings': [['nftMechanics'], ['nft_mechanics']],
    'drawer_cards': [['ecosystem'], ['ecosystem', 'items']],
    'roadmap': [['roadmap']],
    'roadmap_tasks': [['roadmap', 'tasks']],
    'evolution_levels': [['evolution', 'levels']],
    'evolution_badges': [['evolution', 'badges']],
    'team_members': [['team']],
    'partners': [['partners']],
    'faq': [['faq']],
    'community_settings': [['community']],
    'footer_settings': [['footer']],
    'cookie_consent_settings': [['cookieConsent'], ['cookie_consent']],
    'seo_settings': [['seo']],
  }

  for (const path of aliases[directKey] || []) {
    const resolved = valueAt(bootstrap, path)
    if (resolved !== undefined) return resolved
  }
  return undefined
}

const getCount = (value: InfoValue | undefined): number => {
  if (Array.isArray(value)) return value.length
  if (!value || typeof value !== 'object') return value === undefined ? 0 : 1

  const record = value as InfoRecord
  const items = record.items || record.tasks || record.results
  return Array.isArray(items) ? items.length : Object.keys(record).length ? 1 : 0
}

const formatDate = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return 'Not reported'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const Overview = ({
  data,
  loading,
  error,
  onRetry,
  onSelectSection,
}: OverviewProps) => {
  const classes = useInfoStyles()
  const editorRows = useMemo(
    () =>
      infoSections.filter((section) => section.group !== 'Advanced').flatMap((section) =>
        (section.editors || []).map((editor) => ({
          section,
          editor,
          value: data ? resolveBootstrapValue(data, editor) : undefined,
        })),
      ),
    [data],
  )

  if (loading) {
    return (
      <section className={classes.panel}>
        <LoadingState label="Loading landing bootstrap…" />
      </section>
    )
  }
  if (error || !data) {
    return (
      <section className={classes.panel}>
        <ErrorState error={error} onRetry={onRetry} />
      </section>
    )
  }

  const available = editorRows.filter((row) => row.value !== undefined).length
  const collectionRecords = editorRows.reduce(
    (total, row) => total + (row.editor.mode === 'collection' ? getCount(row.value) : 0),
    0,
  )
  const updatedAt = data.updated_at || data.updatedAt
  const version = data.version
  const status = data.status

  return (
    <>
      <div className={classes.overviewGrid}>
        <article className={classes.overviewCard}>
          <p className={classes.overviewLabel}>API status</p>
          <p className={classes.overviewValue}>
            {typeof status === 'string' && status ? status : 'Online'}
          </p>
          <p className={classes.overviewHint}>Public bootstrap responded successfully.</p>
        </article>
        <article className={classes.overviewCard}>
          <p className={classes.overviewLabel}>Resource coverage</p>
          <p className={classes.overviewValue}>
            {available}/{editorRows.length}
          </p>
          <p className={classes.overviewHint}>Resources present in the public bootstrap.</p>
        </article>
        <article className={classes.overviewCard}>
          <p className={classes.overviewLabel}>Collection records</p>
          <p className={classes.overviewValue}>{collectionRecords}</p>
          <p className={classes.overviewHint}>Visible through bootstrap collection payloads.</p>
        </article>
        <article className={classes.overviewCard}>
          <p className={classes.overviewLabel}>Bootstrap version</p>
          <p className={classes.overviewValue}>
            {typeof version === 'string' && version ? version : '—'}
          </p>
          <p className={classes.overviewHint}>Updated {formatDate(updatedAt)}</p>
        </article>
      </div>

      <section className={classes.panel}>
        <header className={classes.panelHeader}>
          <div>
            <h3 className={classes.panelTitle}>Publishing coverage</h3>
            <p className={classes.panelDescription}>
              Open a section to review its protected admin representation.
            </p>
          </div>
        </header>
        <div className={classes.panelBody}>
          <div className={classes.resourceList}>
            {infoSections
              .filter((section) => section.editors?.length)
              .map((section) => {
                const sectionRows = editorRows.filter(
                  (row) => row.section.id === section.id,
                )
                const populated = sectionRows.filter(
                  (row) => row.value !== undefined,
                ).length
                const records = sectionRows.reduce(
                  (total, row) => total + getCount(row.value),
                  0,
                )
                return (
                  <button
                    className={classes.resourceButton}
                    type="button"
                    key={section.id}
                    onClick={() => onSelectSection(section.id)}
                  >
                    <span>
                      <strong>{section.shortTitle}</strong>
                      <span
                        className={classes.mutedText}
                        style={{ display: 'block', marginTop: 3 }}
                      >
                        {populated}/{sectionRows.length} resources · {records} records
                      </span>
                    </span>
                    <span
                      className={`${classes.pill} ${
                        populated ? '' : classes.pillInactive
                      }`}
                    >
                      {populated ? 'Ready' : 'Empty'}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      </section>
    </>
  )
}

export default Overview
