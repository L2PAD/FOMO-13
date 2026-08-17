import React, { useEffect, useRef } from 'react'
import { useInfoStyles } from '../styles'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) => {
  const classes = useInfoStyles()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return undefined
    cancelRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [busy, onCancel, open])

  if (!open) return null

  return (
    <div
      className={classes.modalBackdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !busy) onCancel()
      }}
    >
      <div
        className={classes.modal}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="info-confirm-title"
        aria-describedby="info-confirm-description"
      >
        <h2 id="info-confirm-title" className={classes.modalTitle}>
          {title}
        </h2>
        <p id="info-confirm-description" className={classes.modalDescription}>
          {description}
        </p>
        <div className={classes.actions}>
          <button
            ref={cancelRef}
            className={`${classes.button} ${classes.buttonSecondary}`}
            type="button"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`${classes.button} ${classes.buttonDanger}`}
            type="button"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
