import React from 'react'
import { useInfoStyles } from '../styles'

export const LoadingState = ({ label = 'Loading content…' }: { label?: string }) => {
  const classes = useInfoStyles()
  return (
    <div className={classes.stateBox} role="status" aria-live="polite">
      <span className={classes.spinner} aria-hidden="true" />
      <p className={classes.mutedText}>{label}</p>
    </div>
  )
}

export const ErrorState = ({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) => {
  const classes = useInfoStyles()
  const message = error instanceof Error ? error.message : 'The request could not be completed.'

  return (
    <div className={classes.stateBox} role="alert">
      <h3 className={classes.errorTitle}>Unable to load this resource</h3>
      <p className={classes.mutedText}>{message}</p>
      <button
        className={`${classes.button} ${classes.buttonSecondary}`}
        type="button"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  )
}

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) => {
  const classes = useInfoStyles()
  return (
    <div className={classes.stateBox}>
      <h3 className={classes.panelTitle}>{title}</h3>
      <p className={classes.mutedText}>{description}</p>
      {action}
    </div>
  )
}
