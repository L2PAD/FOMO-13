import React, { useMemo, useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import { toast } from 'react-toastify'
import {
  AnalyticsStats,
  clearInfoAnalytics,
  fetchInfoAnalytics,
  InfoRecord,
  InfoValue,
} from '../../../services/infoLanding'
import { formatApiError } from '../editorUtils'
import { useInfoStyles } from '../styles'
import ConfirmDialog from './ConfirmDialog'
import { ErrorState, LoadingState } from './StateViews'

const numeric = (value: InfoValue | undefined): number =>
  typeof value === 'number' ? value : Number(value || 0)

const formatNumber = (value: InfoValue | undefined): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(numeric(value))

const formatPercent = (value: InfoValue | undefined): string =>
  `${numeric(value).toFixed(1)}%`

const rowName = (row: InfoRecord): string =>
  String(row.name || row.country || row.city || row.source || row.label || 'Unknown')

const rowCount = (row: InfoRecord): string =>
  formatNumber(row.count || row.value || row.sessions)

const AnalyticsDashboard = () => {
  const classes = useInfoStyles()
  const [period, setPeriod] = useState(30)
  const [clearOpen, setClearOpen] = useState(false)

  const query = useQuery(
    ['info-analytics', period],
    () => fetchInfoAnalytics(period),
    {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  )

  const clearMutation = useMutation(clearInfoAnalytics, {
    onSuccess: () => {
      setClearOpen(false)
      query.refetch()
      toast.success('Landing analytics cleared')
    },
    onError: (error) => {
      toast.error(formatApiError(error))
    },
  })

  const stats = (query.data || {}) as AnalyticsStats
  const cards = useMemo(
    () => [
      ['Page views', formatNumber(stats.page_views)],
      ['Unique sessions', formatNumber(stats.unique_sessions)],
      ['Button clicks', formatNumber(stats.button_clicks)],
      ['Conversions', formatNumber(stats.conversions)],
      ['Conversion rate', formatPercent(stats.conversion_rate)],
      [
        'Avg. session',
        `${formatNumber(stats.avg_session_duration)} sec`,
      ],
      ['New visitors', formatNumber(stats.new_visitors)],
      ['Returning', formatNumber(stats.returning_visitors)],
      ['Desktop visitors', formatNumber(stats.desktop_visitors)],
      ['Mobile visitors', formatNumber(stats.mobile_visitors)],
    ],
    [stats],
  )

  const countries = Array.isArray(stats.top_countries)
    ? (stats.top_countries as InfoRecord[])
    : []
  const cities = Array.isArray(stats.top_cities)
    ? (stats.top_cities as InfoRecord[])
    : []
  const sources = Array.isArray(stats.detailed_sources)
    ? (stats.detailed_sources as InfoRecord[])
    : []

  return (
    <>
      <section className={classes.panel}>
        <header className={classes.panelHeader}>
          <div>
            <h3 className={classes.panelTitle}>Analytics snapshot</h3>
            <p className={classes.panelDescription}>
              Aggregated landing activity. Analytics collection and retention are enforced by
              the backend.
            </p>
          </div>
          <div className={classes.analyticsControls} aria-label="Analytics period">
            {[7, 30, 90].map((days) => (
              <button
                className={`${classes.button} ${
                  period === days ? '' : classes.buttonSecondary
                } ${classes.compactButton}`}
                type="button"
                key={days}
                aria-pressed={period === days}
                onClick={() => setPeriod(days)}
              >
                {days} days
              </button>
            ))}
            <button
              className={`${classes.button} ${classes.buttonDanger} ${classes.compactButton}`}
              type="button"
              onClick={() => setClearOpen(true)}
            >
              Clear data
            </button>
          </div>
        </header>
        {query.isLoading ? (
          <LoadingState label="Loading analytics…" />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        ) : (
          <div className={classes.panelBody}>
            <div className={classes.overviewGrid}>
              {cards.map(([label, value]) => (
                <article className={classes.overviewCard} key={label}>
                  <p className={classes.overviewLabel}>{label}</p>
                  <p className={classes.overviewValue}>{value}</p>
                  <p className={classes.overviewHint}>Last {period} days</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      {!query.isLoading && !query.isError ? (
        <section className={classes.panel}>
          <header className={classes.panelHeader}>
            <div>
              <h3 className={classes.panelTitle}>Audience & acquisition</h3>
              <p className={classes.panelDescription}>
                Top locations and detailed traffic sources.
              </p>
            </div>
          </header>
          <div className={classes.panelBody}>
            <div className={classes.formGrid}>
              {[
                ['Top countries', countries],
                ['Top cities', cities],
                ['Traffic sources', sources],
              ].map(([title, rows]) => (
                <div className={classes.fullWidth} key={title as string}>
                  <h4 className={classes.panelTitle}>{title as string}</h4>
                  <div className={classes.tableWrap}>
                    <table className={classes.table}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Count</th>
                          <th>Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rows as InfoRecord[]).length ? (
                          (rows as InfoRecord[]).map((row, index) => (
                            <tr key={`${rowName(row)}-${index}`}>
                              <td>{rowName(row)}</td>
                              <td>{rowCount(row)}</td>
                              <td>
                                {row.percent !== undefined
                                  ? formatPercent(row.percent)
                                  : '—'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3}>No data for this period.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={clearOpen}
        title="Clear all landing analytics?"
        description="Aggregated analytics will be permanently deleted. Content and CMS settings are not affected."
        confirmLabel="Clear analytics"
        busy={clearMutation.isLoading}
        onCancel={() => setClearOpen(false)}
        onConfirm={() => clearMutation.mutate()}
      />
    </>
  )
}

export default AnalyticsDashboard
