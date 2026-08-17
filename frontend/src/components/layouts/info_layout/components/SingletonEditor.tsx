import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import {
  fetchAdminInfoResource,
  InfoRecord,
  saveInfoSettings,
} from '../../../services/infoLanding'
import { ResourceEditorDefinition, sanitizeRecord } from '../sectionRegistry'
import {
  formatApiError,
  hydrateRecord,
  recordFingerprint,
  validateRecord,
} from '../editorUtils'
import { useInfoStyles } from '../styles'
import SchemaForm from './SchemaForm'
import { ErrorState, LoadingState } from './StateViews'

interface SingletonEditorProps {
  definition: ResourceEditorDefinition
  onDirtyChange: (editorId: string, dirty: boolean) => void
}

const SingletonEditor = ({ definition, onDirtyChange }: SingletonEditorProps) => {
  const classes = useInfoStyles()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<InfoRecord>(() =>
    hydrateRecord(undefined, definition.fields),
  )
  const [baseline, setBaseline] = useState<InfoRecord>(() =>
    hydrateRecord(undefined, definition.fields),
  )
  const [validationError, setValidationError] = useState('')

  const query = useQuery(
    ['info-admin-settings', definition.resource],
    () => fetchAdminInfoResource<InfoRecord>(definition.resource),
    {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  )

  const dirty = useMemo(
    () => recordFingerprint(draft) !== recordFingerprint(baseline),
    [baseline, draft],
  )

  useEffect(() => {
    onDirtyChange(definition.id, dirty)
    return () => onDirtyChange(definition.id, false)
  }, [definition.id, dirty, onDirtyChange])

  useEffect(() => {
    if (!query.data || dirty) return
    const next = hydrateRecord(query.data, definition.fields)
    setDraft(next)
    setBaseline(next)
  }, [definition.fields, dirty, query.data])

  const mutation = useMutation(
    (payload: InfoRecord) => saveInfoSettings(definition.resource, payload),
    {
      onSuccess: (response) => {
        const next = hydrateRecord(response, definition.fields)
        setDraft(next)
        setBaseline(next)
        setValidationError('')
        queryClient.setQueryData(
          ['info-admin-settings', definition.resource],
          response,
        )
        queryClient.invalidateQueries('info-bootstrap')
        toast.success(`${definition.title} saved`)
      },
      onError: (error) => {
        toast.error(formatApiError(error))
      },
    },
  )

  const save = () => {
    const missing = validateRecord(draft, definition.fields)
    if (missing.length) {
      setValidationError(`Complete required fields: ${missing.slice(0, 5).join(', ')}`)
      return
    }
    setValidationError('')
    mutation.mutate(sanitizeRecord(draft, definition.fields))
  }

  return (
    <section className={classes.panel} aria-labelledby={`${definition.id}-title`}>
      <header className={classes.panelHeader}>
        <div>
          <h3 className={classes.panelTitle} id={`${definition.id}-title`}>
            {definition.title}
          </h3>
          <p className={classes.panelDescription}>{definition.description}</p>
        </div>
        <span className={`${classes.pill} ${!dirty ? classes.pillInactive : ''}`}>
          {dirty ? 'Unsaved changes' : 'Synced'}
        </span>
      </header>
      {query.isLoading ? (
        <LoadingState label={`Loading ${definition.title.toLowerCase()}…`} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : (
        <>
          <div className={classes.panelBody}>
            {validationError ? <p className={classes.alert}>{validationError}</p> : null}
            <SchemaForm
              fields={definition.fields}
              value={draft}
              disabled={mutation.isLoading}
              path={definition.id}
              onChange={setDraft}
            />
          </div>
          <div className={classes.saveBar}>
            <div>
              <p className={dirty ? classes.dirtyText : classes.mutedText}>
                {dirty
                  ? 'Review and publish these changes to the landing API.'
                  : 'This section matches the last server response.'}
              </p>
            </div>
            <div className={classes.actions}>
              <button
                className={`${classes.button} ${classes.buttonSecondary}`}
                type="button"
                disabled={!dirty || mutation.isLoading}
                onClick={() => {
                  setDraft(baseline)
                  setValidationError('')
                }}
              >
                Reset
              </button>
              <button
                className={classes.button}
                type="button"
                disabled={!dirty || mutation.isLoading}
                onClick={save}
              >
                {mutation.isLoading ? 'Saving…' : 'Save & publish'}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default SingletonEditor
