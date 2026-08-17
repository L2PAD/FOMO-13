import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useQuery } from 'react-query'
import { fetchInfoBootstrap, InfoBootstrap } from '../../services/infoLanding'
import { getInfoSection, infoSections } from './sectionRegistry'
import { useInfoStyles } from './styles'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import CollectionEditor from './components/CollectionEditor'
import ConfirmDialog from './components/ConfirmDialog'
import Overview from './components/Overview'
import SingletonEditor from './components/SingletonEditor'

const sectionGroups = [
  'Overview',
  'Landing content',
  'Engagement',
  'System',
  'Advanced',
] as const

const getPreviewUrl = (data?: InfoBootstrap): string => {
  const payloadValue = data?.preview_url || data?.previewUrl
  if (typeof payloadValue === 'string' && payloadValue) return payloadValue
  return (
    process.env.REACT_APP_INFO_LANDING_URL ||
    process.env.REACT_APP_FOMO_INFO_URL ||
    ''
  )
}

const InfoLayout = () => {
  const classes = useInfoStyles()
  const history = useHistory()
  const location = useLocation()
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const requestedSection = queryParams.get('section') || 'overview'
  const activeSection = getInfoSection(requestedSection)
  const [dirtyEditors, setDirtyEditors] = useState<Record<string, boolean>>({})
  const [pendingSection, setPendingSection] = useState('')

  const bootstrapQuery = useQuery<InfoBootstrap>(
    'info-bootstrap',
    fetchInfoBootstrap,
    {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  )

  const hasDirty = Object.values(dirtyEditors).some(Boolean)
  const previewUrl = getPreviewUrl(bootstrapQuery.data)

  const onDirtyChange = useCallback((editorId: string, dirty: boolean) => {
    setDirtyEditors((previous) => {
      if (previous[editorId] === dirty) return previous
      const next = { ...previous, [editorId]: dirty }
      if (!dirty) delete next[editorId]
      return next
    })
  }, [])

  useEffect(() => {
    if (requestedSection === activeSection.id) return
    const params = new URLSearchParams(location.search)
    params.set('section', activeSection.id)
    history.replace({ pathname: location.pathname, search: `?${params.toString()}` })
  }, [activeSection.id, history, location.pathname, location.search, requestedSection])

  useEffect(() => {
    if (!hasDirty) return undefined
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasDirty])

  const navigateToSection = (sectionId: string, force = false) => {
    if (sectionId === activeSection.id) return
    if (hasDirty && !force) {
      setPendingSection(sectionId)
      return
    }
    const params = new URLSearchParams(location.search)
    params.set('section', sectionId)
    setDirtyEditors({})
    setPendingSection('')
    history.push({ pathname: location.pathname, search: `?${params.toString()}` })
  }

  const statusLabel = bootstrapQuery.isLoading
    ? 'Synchronizing'
    : bootstrapQuery.isError
    ? 'API unavailable'
    : 'Landing API online'

  return (
    <main className={classes.page}>
      <section className={classes.hero}>
        <span className={classes.heroGlow} aria-hidden="true" />
        <div className={classes.heroContent}>
          <div>
            <span className={classes.eyebrow}>FOMO Info · Content studio</span>
            <h1 className={classes.heroTitle}>Landing CMS</h1>
            <p className={classes.heroDescription}>
              Manage every public landing resource through the protected main backend. Changes
              are published per section, with explicit ordering and visibility controls.
            </p>
          </div>
          <div className={classes.heroActions}>
            <span className={classes.statusChip}>
              <span className={classes.statusDot} aria-hidden="true" />
              {statusLabel}
            </span>
            <button
              className={`${classes.button} ${classes.buttonGhostOnDark}`}
              type="button"
              disabled={bootstrapQuery.isFetching}
              onClick={() => bootstrapQuery.refetch()}
            >
              {bootstrapQuery.isFetching ? 'Refreshing…' : 'Refresh status'}
            </button>
            {previewUrl ? (
              <a
                className={`${classes.button} ${classes.buttonGhostOnDark}`}
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open landing preview
              </a>
            ) : (
              <span className={classes.statusChip} title="Set REACT_APP_INFO_LANDING_URL">
                Preview URL not configured
              </span>
            )}
          </div>
        </div>
      </section>

      <div className={classes.workspace}>
        <nav className={classes.sidebar} aria-label="Landing CMS sections">
          {sectionGroups.map((group) => {
            const sections = infoSections.filter((section) => section.group === group)
            if (!sections.length) return null
            return (
              <div className={classes.navGroup} key={group}>
                <p className={classes.navGroupTitle}>{group}</p>
                {sections.map((section) => (
                  <button
                    className={`${classes.navButton} ${
                      activeSection.id === section.id ? classes.navButtonActive : ''
                    }`}
                    type="button"
                    key={section.id}
                    aria-current={activeSection.id === section.id ? 'page' : undefined}
                    onClick={() => navigateToSection(section.id)}
                  >
                    {section.shortTitle}
                  </button>
                ))}
              </div>
            )
          })}
        </nav>

        <div className={classes.content}>
          <header className={classes.sectionIntro}>
            <h2 className={classes.sectionTitle}>{activeSection.title}</h2>
            <p className={classes.sectionDescription}>{activeSection.description}</p>
          </header>

          {activeSection.special === 'overview' ? (
            <Overview
              data={bootstrapQuery.data}
              loading={bootstrapQuery.isLoading}
              error={bootstrapQuery.error}
              onRetry={() => bootstrapQuery.refetch()}
              onSelectSection={navigateToSection}
            />
          ) : activeSection.special === 'analytics' ? (
            <AnalyticsDashboard />
          ) : (
            activeSection.editors?.map((editor) =>
              editor.mode === 'singleton' ? (
                <SingletonEditor
                  key={editor.id}
                  definition={editor}
                  onDirtyChange={onDirtyChange}
                />
              ) : (
                <CollectionEditor
                  key={editor.id}
                  definition={editor}
                  onDirtyChange={onDirtyChange}
                />
              ),
            )
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingSection)}
        title="Discard unsaved changes?"
        description="The current editor contains unpublished changes. Switching sections will discard them."
        confirmLabel="Discard & switch"
        onCancel={() => setPendingSection('')}
        onConfirm={() => navigateToSection(pendingSection, true)}
      />
    </main>
  )
}

export default InfoLayout
