import React, { useId } from 'react'
import { InfoRecord, InfoValue } from '../../../services/infoLanding'
import { buildDefaultRecord, FieldSchema } from '../sectionRegistry'
import { useInfoStyles } from '../styles'
import ImageUploadField from './ImageUploadField'

interface SchemaFormProps {
  fields: FieldSchema[]
  value: InfoRecord
  disabled?: boolean
  path?: string
  onChange: (value: InfoRecord) => void
}

const normalizeOrder = (items: InfoValue[]): InfoValue[] =>
  items.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item
    const record = item as InfoRecord
    return record.order === undefined ? record : { ...record, order: index }
  })

const SchemaForm = ({
  fields,
  value,
  disabled = false,
  path = 'info',
  onChange,
}: SchemaFormProps) => {
  const classes = useInfoStyles()
  const formId = useId().replace(/:/g, '')

  const updateField = (key: string, nextValue: InfoValue) => {
    onChange({ ...value, [key]: nextValue })
  }

  return (
    <div className={classes.formGrid}>
      {fields.map((field) => {
        const id = `${formId}-${path}-${field.key}`.replace(/[^a-zA-Z0-9-_]/g, '-')
        const current = value[field.key]
        const className = `${classes.field} ${field.fullWidth ? classes.fullWidth : ''}`

        if (field.kind === 'keyValue') {
          const keyValueRecord =
            current && typeof current === 'object' && !Array.isArray(current)
              ? (current as InfoRecord)
              : {}
          const entries = Object.entries(keyValueRecord).filter(
            ([, entryValue]) => typeof entryValue === 'string',
          ) as Array<[string, string]>

          const replaceEntries = (nextEntries: Array<[string, string]>) => {
            updateField(
              field.key,
              nextEntries.reduce<InfoRecord>((record, [entryKey, entryValue]) => {
                const normalizedKey = entryKey.trim()
                if (normalizedKey) record[normalizedKey] = entryValue
                return record
              }, {}),
            )
          }

          return (
            <div className={className} key={field.key}>
              <div className={classes.listBox}>
                <div className={classes.listHeading}>
                  <div>
                    <span className={classes.label}>{field.label}</span>
                    {field.help ? <p className={classes.help}>{field.help}</p> : null}
                  </div>
                  <button
                    className={`${classes.button} ${classes.buttonSecondary} ${classes.compactButton}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      let index = entries.length + 1
                      let nextKey = `social_${index}`
                      while (entries.some(([entryKey]) => entryKey === nextKey)) {
                        index += 1
                        nextKey = `social_${index}`
                      }
                      replaceEntries([...entries, [nextKey, '']])
                    }}
                  >
                    Add link
                  </button>
                </div>
                {entries.length ? (
                  <div className={classes.listItems}>
                    {entries.map(([entryKey, entryValue], index) => (
                      <div className={classes.nestedItem} key={`${entryKey}-${index}`}>
                        <div className={classes.formGrid}>
                          <div className={classes.field}>
                            <label
                              className={classes.label}
                              htmlFor={`${id}-key-${index}`}
                            >
                              Platform key
                            </label>
                            <input
                              id={`${id}-key-${index}`}
                              className={classes.input}
                              type="text"
                              value={entryKey}
                              disabled={disabled}
                              onChange={(event) => {
                                const next = [...entries]
                                next[index] = [event.target.value, entryValue]
                                replaceEntries(next)
                              }}
                            />
                          </div>
                          <div className={classes.field}>
                            <label
                              className={classes.label}
                              htmlFor={`${id}-value-${index}`}
                            >
                              Profile URL
                            </label>
                            <input
                              id={`${id}-value-${index}`}
                              className={classes.input}
                              type="url"
                              value={entryValue}
                              disabled={disabled}
                              placeholder="https://"
                              onChange={(event) => {
                                const next = [...entries]
                                next[index] = [entryKey, event.target.value]
                                replaceEntries(next)
                              }}
                            />
                          </div>
                        </div>
                        <div className={classes.actions} style={{ marginTop: 10 }}>
                          <button
                            className={`${classes.button} ${classes.buttonDanger} ${classes.compactButton}`}
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              replaceEntries(
                                entries.filter((_, entryIndex) => entryIndex !== index),
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={classes.mutedText}>No links yet.</p>
                )}
              </div>
            </div>
          )
        }

        if (field.kind === 'object') {
          const objectValue =
            current && typeof current === 'object' && !Array.isArray(current)
              ? (current as InfoRecord)
              : buildDefaultRecord(field.itemFields || [])
          return (
            <div className={className} key={field.key}>
              <div className={classes.listBox}>
                <div>
                  <span className={classes.label}>{field.label}</span>
                  {field.help ? <p className={classes.help}>{field.help}</p> : null}
                </div>
                <div className={classes.nestedItem}>
                  <SchemaForm
                    fields={field.itemFields || []}
                    value={objectValue}
                    disabled={disabled}
                    path={`${path}-${field.key}`}
                    onChange={(nextValue) => updateField(field.key, nextValue)}
                  />
                </div>
              </div>
            </div>
          )
        }

        if (field.kind === 'list') {
          const items = Array.isArray(current) ? current : []
          return (
            <div className={className} key={field.key}>
              <div className={classes.listBox}>
                <div className={classes.listHeading}>
                  <div>
                    <span className={classes.label}>{field.label}</span>
                    {field.help ? <p className={classes.help}>{field.help}</p> : null}
                  </div>
                  <button
                    className={`${classes.button} ${classes.buttonSecondary} ${classes.compactButton}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      const next = buildDefaultRecord(field.itemFields || [])
                      if (next.order !== undefined) next.order = items.length
                      updateField(field.key, [...items, next])
                    }}
                  >
                    Add {field.itemLabel?.toLowerCase() || 'item'}
                  </button>
                </div>
                {items.length ? (
                  <div className={classes.listItems}>
                    {items.map((item, index) => {
                      const itemValue =
                        item && typeof item === 'object' && !Array.isArray(item)
                          ? (item as InfoRecord)
                          : {}
                      return (
                        <div className={classes.nestedItem} key={`${field.key}-${index}`}>
                          <div className={classes.nestedHeader}>
                            <span className={classes.nestedTitle}>
                              {field.itemLabel || 'Item'} {index + 1}
                            </span>
                            <div className={classes.actions}>
                              <button
                                className={`${classes.button} ${classes.buttonSecondary} ${classes.compactButton}`}
                                type="button"
                                disabled={disabled || index === 0}
                                aria-label={`Move ${field.itemLabel || 'item'} ${index + 1} up`}
                                onClick={() => {
                                  const next = [...items]
                                  ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                                  updateField(field.key, normalizeOrder(next))
                                }}
                              >
                                ↑ Up
                              </button>
                              <button
                                className={`${classes.button} ${classes.buttonSecondary} ${classes.compactButton}`}
                                type="button"
                                disabled={disabled || index === items.length - 1}
                                aria-label={`Move ${field.itemLabel || 'item'} ${index + 1} down`}
                                onClick={() => {
                                  const next = [...items]
                                  ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
                                  updateField(field.key, normalizeOrder(next))
                                }}
                              >
                                ↓ Down
                              </button>
                              <button
                                className={`${classes.button} ${classes.buttonDanger} ${classes.compactButton}`}
                                type="button"
                                disabled={disabled}
                                aria-label={`Remove ${field.itemLabel || 'item'} ${index + 1}`}
                                onClick={() =>
                                  updateField(
                                    field.key,
                                    normalizeOrder(items.filter((_, itemIndex) => itemIndex !== index)),
                                  )
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <SchemaForm
                            fields={field.itemFields || []}
                            value={itemValue}
                            disabled={disabled}
                            path={`${path}-${field.key}-${index}`}
                            onChange={(nextItem) => {
                              const next = [...items]
                              next[index] = nextItem
                              updateField(field.key, next)
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className={classes.mutedText}>No items yet.</p>
                )}
              </div>
            </div>
          )
        }

        if (field.kind === 'boolean') {
          return (
            <div className={className} key={field.key}>
              <label className={classes.checkboxRow} htmlFor={id}>
                <input
                  id={id}
                  type="checkbox"
                  checked={Boolean(current)}
                  disabled={disabled}
                  onChange={(event) => updateField(field.key, event.target.checked)}
                />
                {field.label}
              </label>
              {field.help ? <p className={classes.help}>{field.help}</p> : null}
            </div>
          )
        }

        const label = (
          <label className={classes.label} htmlFor={id}>
            {field.label}
            {field.required ? <span className={classes.required}>*</span> : null}
          </label>
        )

        if (field.kind === 'image') {
          return (
            <div className={className} key={field.key}>
              {label}
              <ImageUploadField
                id={id}
                value={typeof current === 'string' ? current : ''}
                disabled={disabled}
                onChange={(next) => updateField(field.key, next)}
              />
              {field.help ? <p className={classes.help}>{field.help}</p> : null}
            </div>
          )
        }

        if (field.kind === 'textarea') {
          return (
            <div className={className} key={field.key}>
              {label}
              <textarea
                id={id}
                className={`${classes.input} ${classes.textarea}`}
                value={typeof current === 'string' ? current : ''}
                rows={field.rows || 4}
                required={field.required}
                disabled={disabled}
                placeholder={field.placeholder}
                onChange={(event) => updateField(field.key, event.target.value)}
              />
              {field.help ? <p className={classes.help}>{field.help}</p> : null}
            </div>
          )
        }

        if (field.kind === 'select') {
          return (
            <div className={className} key={field.key}>
              {label}
              <select
                id={id}
                className={classes.input}
                value={typeof current === 'string' ? current : ''}
                required={field.required}
                disabled={disabled}
                onChange={(event) => updateField(field.key, event.target.value)}
              >
                <option value="">Select…</option>
                {(field.options || []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {field.help ? <p className={classes.help}>{field.help}</p> : null}
            </div>
          )
        }

        if (field.kind === 'tags') {
          const tags = Array.isArray(current)
            ? current.filter((item): item is string => typeof item === 'string')
            : []
          return (
            <div className={className} key={field.key}>
              {label}
              <input
                id={id}
                className={classes.input}
                type="text"
                value={tags.join(', ')}
                disabled={disabled}
                placeholder="tag-one, tag-two"
                onChange={(event) =>
                  updateField(
                    field.key,
                    event.target.value
                      .split(',')
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  )
                }
              />
              {field.help ? <p className={classes.help}>{field.help}</p> : null}
            </div>
          )
        }

        const type =
          field.kind === 'number'
            ? 'number'
            : field.kind === 'url'
            ? 'url'
            : field.kind === 'datetime'
            ? 'datetime-local'
            : 'text'
        const displayValue =
          field.kind === 'datetime' && typeof current === 'string'
            ? current.slice(0, 16)
            : typeof current === 'string' || typeof current === 'number'
            ? current
            : ''

        return (
          <div className={className} key={field.key}>
            {label}
            <input
              id={id}
              className={classes.input}
              type={type}
              value={displayValue}
              required={field.required}
              disabled={disabled}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              onChange={(event) =>
                updateField(
                  field.key,
                  field.kind === 'number'
                    ? event.target.value === ''
                      ? 0
                      : Number(event.target.value)
                    : event.target.value,
                )
              }
            />
            {field.help ? <p className={classes.help}>{field.help}</p> : null}
          </div>
        )
      })}
    </div>
  )
}

export default SchemaForm
