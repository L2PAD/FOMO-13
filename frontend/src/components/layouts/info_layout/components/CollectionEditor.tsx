import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import {
  createInfoItem,
  deleteInfoItem,
  fetchAdminInfoResource,
  getEntityId,
  InfoRecord,
  OrderedEntity,
  reorderInfoItems,
  updateInfoItem,
  unwrapCollection,
} from '../../../services/infoLanding'
import { ResourceEditorDefinition, sanitizeRecord } from '../sectionRegistry'
import {
  formatApiError,
  getRecordTitle,
  hydrateRecord,
  recordFingerprint,
  validateRecord,
} from '../editorUtils'
import { useInfoStyles } from '../styles'
import ConfirmDialog from './ConfirmDialog'
import SchemaForm from './SchemaForm'
import { EmptyState, ErrorState, LoadingState } from './StateViews'

interface CollectionEditorProps {
  definition: ResourceEditorDefinition
  onDirtyChange: (editorId: string, dirty: boolean) => void
}

interface DeleteTarget {
  id: string
  title: string
}

const CollectionEditor = ({ definition, onDirtyChange }: CollectionEditorProps) => {
  const classes = useInfoStyles()
  const queryClient = useQueryClient()
  const queryKey = ['info-admin-collection', definition.resource]
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [draft, setDraft] = useState<InfoRecord>(() =>
    hydrateRecord(undefined, definition.fields),
  )
  const [editorBaseline, setEditorBaseline] = useState<InfoRecord>(draft)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)
  const [validationError, setValidationError] = useState('')

  const query = useQuery(
    queryKey,
    async () =>
      unwrapCollection<OrderedEntity>(
        await fetchAdminInfoResource<unknown>(definition.resource),
        definition.resource,
      ),
    {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  )

  const items = useMemo(
    () =>
      [...(query.data?.items || [])].sort(
        (first, second) => Number(first.order || 0) - Number(second.order || 0),
      ),
    [query.data],
  )
  const editorDirty =
    editorOpen && recordFingerprint(draft) !== recordFingerprint(editorBaseline)

  useEffect(() => {
    onDirtyChange(definition.id, editorDirty)
    return () => onDirtyChange(definition.id, false)
  }, [definition.id, editorDirty, onDirtyChange])

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingId('')
    setCloseConfirmOpen(false)
    setValidationError('')
    const empty = hydrateRecord(undefined, definition.fields)
    setDraft(empty)
    setEditorBaseline(empty)
  }

  const refresh = () => {
    queryClient.invalidateQueries(queryKey)
    queryClient.invalidateQueries('info-bootstrap')
  }

  const saveMutation = useMutation(
    async (payload: InfoRecord) => {
      const body = sanitizeRecord(payload, definition.fields) as OrderedEntity
      if (editingId) {
        return updateInfoItem(definition.resource, editingId, body)
      }
      return createInfoItem(definition.resource, body)
    },
    {
      onSuccess: () => {
        toast.success(editingId ? 'Item updated' : 'Item created')
        closeEditor()
        refresh()
      },
      onError: (error) => {
        toast.error(formatApiError(error))
      },
    },
  )

  const deleteMutation = useMutation(
    ({ id }: DeleteTarget) => deleteInfoItem(definition.resource, id),
    {
      onSuccess: () => {
        toast.success('Item deleted')
        setDeleteTarget(null)
        refresh()
      },
      onError: (error) => {
        toast.error(formatApiError(error))
      },
    },
  )

  const reorderMutation = useMutation(
    (nextItems: OrderedEntity[]) =>
      reorderInfoItems(
        definition.resource,
        nextItems
          .map((item, index) => ({ id: getEntityId(item), order: index }))
          .filter((item) => item.id),
      ),
    {
      onSuccess: () => {
        refresh()
        toast.success('Display order updated')
      },
      onError: (error) => {
        toast.error(formatApiError(error))
      },
    },
  )

  const toggleMutation = useMutation(
    ({ item, active }: { item: OrderedEntity; active: boolean }) => {
      const id = getEntityId(item)
      const source: InfoRecord = { ...item }
      source['is_active'] = active
      const body = sanitizeRecord(
        hydrateRecord(source, definition.fields),
        definition.fields,
      ) as OrderedEntity
      return updateInfoItem(definition.resource, id, body)
    },
    {
      onSuccess: () => {
        refresh()
        toast.success('Visibility updated')
      },
      onError: (error) => {
        toast.error(formatApiError(error))
      },
    },
  )

  const openCreate = () => {
    const source: InfoRecord = { order: items.length }
    source['is_active'] = true
    const next = hydrateRecord(
      source,
      definition.fields,
    )
    setEditingId('')
    setDraft(next)
    setEditorBaseline(next)
    setValidationError('')
    setEditorOpen(true)
  }

  const requestClose = () => {
    if (editorDirty) {
      setCloseConfirmOpen(true)
      return
    }
    closeEditor()
  }

  const openEdit = (item: OrderedEntity) => {
    const next = hydrateRecord(item, definition.fields)
    setEditingId(getEntityId(item))
    setDraft(next)
    setEditorBaseline(next)
    setValidationError('')
    setEditorOpen(true)
  }

  const save = () => {
    const missing = validateRecord(draft, definition.fields)
    if (missing.length) {
      setValidationError(`Complete required fields: ${missing.slice(0, 5).join(', ')}`)
      return
    }
    setValidationError('')
    saveMutation.mutate(draft)
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    reorderMutation.mutate(next)
  }

  const hasActiveField = definition.fields.some((field) => field.key === 'is_active')

  return (
    <section className={classes.panel} aria-labelledby={`${definition.id}-title`}>
      <header className={classes.panelHeader}>
        <div>
          <h3 className={classes.panelTitle} id={`${definition.id}-title`}>
            {definition.title}
          </h3>
          <p className={classes.panelDescription}>{definition.description}</p>
        </div>
        <span className={classes.pill}>
          {query.data?.total ?? items.length} item{items.length === 1 ? '' : 's'}
        </span>
      </header>
      <div className={classes.collectionToolbar}>
        <p className={classes.mutedText}>
          Create, edit, reorder, and control public visibility.
        </p>
        <button
          className={classes.button}
          type="button"
          disabled={editorOpen}
          onClick={openCreate}
        >
          Add item
        </button>
      </div>
      {query.isLoading ? (
        <LoadingState label={`Loading ${definition.title.toLowerCase()}…`} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : items.length ? (
        <div className={classes.collectionGrid}>
          {items.map((item, index) => {
            const id = getEntityId(item)
            const title = getRecordTitle(
              item,
              definition.titleKeys,
              `${definition.title} #${index + 1}`,
            )
            const active = item.is_active !== false
            return (
              <article className={classes.itemCard} key={id || `${definition.id}-${index}`}>
                <div className={classes.itemTop}>
                  <div style={{ minWidth: 0 }}>
                    <h4 className={classes.itemTitle}>{title}</h4>
                    <p className={classes.itemMeta}>
                      {id ? `ID ${id}` : `Position ${index + 1}`}
                    </p>
                  </div>
                  {hasActiveField ? (
                    <span
                      className={`${classes.pill} ${
                        active ? '' : classes.pillInactive
                      }`}
                    >
                      {active ? 'Visible' : 'Hidden'}
                    </span>
                  ) : null}
                </div>
                <div className={classes.itemActions}>
                  {definition.reorder ? (
                    <>
                      <button
                        className={`${classes.button} ${classes.buttonSecondary} ${classes.compactButton}`}
                        type="button"
                        disabled={index === 0 || reorderMutation.isLoading}
                        aria-label={`Move ${title} up`}
                        onClick={() => move(index, -1)}
                      >
                        ↑ Up
                      </button>
                      <button
                        className={`${classes.button} ${classes.buttonSecondary} ${classes.compactButton}`}
                        type="button"
                        disabled={index === items.length - 1 || reorderMutation.isLoading}
                        aria-label={`Move ${title} down`}
                        onClick={() => move(index, 1)}
                      >
                        ↓ Down
                      </button>
                    </>
                  ) : null}
                  {hasActiveField && id ? (
                    <button
                      className={`${classes.button} ${classes.buttonSecondary} ${classes.compactButton}`}
                      type="button"
                      disabled={toggleMutation.isLoading}
                      onClick={() => toggleMutation.mutate({ item, active: !active })}
                    >
                      {active ? 'Hide' : 'Show'}
                    </button>
                  ) : null}
                  <button
                    className={`${classes.button} ${classes.buttonSecondary} ${classes.compactButton}`}
                    type="button"
                    disabled={editorOpen}
                    onClick={() => openEdit(item)}
                  >
                    Edit
                  </button>
                  {id ? (
                    <button
                      className={`${classes.button} ${classes.buttonDanger} ${classes.compactButton}`}
                      type="button"
                      disabled={editorOpen}
                      onClick={() => setDeleteTarget({ id, title })}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No items yet"
          description="Create the first item to make this resource available to the landing."
          action={
            <button className={classes.button} type="button" onClick={openCreate}>
              Create first item
            </button>
          }
        />
      )}
      {editorOpen ? (
        <div className={classes.editorDrawer}>
          <div className={classes.editorDrawerHeader}>
            <div>
              <h4 className={classes.panelTitle}>
                {editingId ? 'Edit item' : 'Create item'}
              </h4>
              <p className={classes.panelDescription}>
                Required fields are marked with an asterisk.
              </p>
            </div>
            <button
              className={`${classes.button} ${classes.buttonSecondary}`}
              type="button"
              disabled={saveMutation.isLoading}
              onClick={requestClose}
            >
              Close
            </button>
          </div>
          <div className={classes.editorDrawerBody}>
            {validationError ? <p className={classes.alert}>{validationError}</p> : null}
            <SchemaForm
              fields={definition.fields}
              value={draft}
              disabled={saveMutation.isLoading}
              path={`${definition.id}-editor`}
              onChange={setDraft}
            />
            <div className={classes.saveBar}>
              <p className={editorDirty ? classes.dirtyText : classes.mutedText}>
                {editorDirty ? 'This item has unsaved changes.' : 'No changes yet.'}
              </p>
              <div className={classes.actions}>
                <button
                  className={`${classes.button} ${classes.buttonSecondary}`}
                  type="button"
                  disabled={!editorDirty || saveMutation.isLoading}
                  onClick={() => {
                    setDraft(editorBaseline)
                    setValidationError('')
                  }}
                >
                  Reset
                </button>
                <button
                  className={classes.button}
                  type="button"
                  disabled={!editorDirty || saveMutation.isLoading}
                  onClick={save}
                >
                  {saveMutation.isLoading
                    ? 'Saving…'
                    : editingId
                    ? 'Save changes'
                    : 'Create item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this item?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” will be removed from the CMS and public landing. This cannot be undone.`
            : ''
        }
        busy={deleteMutation.isLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
      <ConfirmDialog
        open={closeConfirmOpen}
        title="Discard item changes?"
        description="The current item contains unpublished changes. Closing the editor will discard them."
        confirmLabel="Discard changes"
        onCancel={() => setCloseConfirmOpen(false)}
        onConfirm={closeEditor}
      />
    </section>
  )
}

export default CollectionEditor
