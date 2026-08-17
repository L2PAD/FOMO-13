import React, { ChangeEvent, useMemo, useState } from 'react'
import { loaderApi } from '../../../services/config'
import { uploadInfoAsset } from '../../../services/infoLanding'
import { useInfoStyles } from '../styles'

interface ImageUploadFieldProps {
  id: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}

const resolvePreviewUrl = (value: string): string => {
  const source = value.trim()
  if (!source) return ''
  if (/^(https?:)?\/\//i.test(source) || /^(data|blob):/i.test(source)) return source
  if (source.startsWith('/')) return `${loaderApi}${source}`
  return `${loaderApi}/uploads/${source}`
}

const ImageUploadField = ({
  id,
  value,
  disabled = false,
  onChange,
}: ImageUploadFieldProps) => {
  const classes = useInfoStyles()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [previewFailed, setPreviewFailed] = useState(false)
  const previewUrl = useMemo(() => resolvePreviewUrl(value), [value])

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('The file exceeds the 5 MB limit.')
      return
    }

    setUploading(true)
    setError('')
    try {
      const uploaded = await uploadInfoAsset(file)
      const uploadedUrl = uploaded.full_url || uploaded.url
      if (!uploadedUrl) throw new Error('Upload completed without an asset URL.')
      onChange(uploadedUrl)
      setPreviewFailed(false)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={classes.imageField}>
      <div className={classes.imageControls}>
        <input
          id={id}
          className={classes.input}
          type="url"
          value={value}
          disabled={disabled || uploading}
          placeholder="Paste an image URL or upload a file"
          onChange={(event) => {
            setPreviewFailed(false)
            onChange(event.target.value)
          }}
        />
        <div className={classes.actions}>
          <label
            className={`${classes.button} ${classes.buttonSecondary} ${classes.uploadLabel}`}
          >
            {uploading ? 'Uploading…' : 'Upload image'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={disabled || uploading}
              onChange={handleFile}
            />
          </label>
          {value ? (
            <button
              className={`${classes.button} ${classes.buttonDanger}`}
              type="button"
              disabled={disabled || uploading}
              onClick={() => {
                setPreviewFailed(false)
                onChange('')
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
        {error ? <p className={classes.alert}>{error}</p> : null}
      </div>
      <div className={classes.imagePreview}>
        {previewUrl && !previewFailed ? (
          <img
            src={previewUrl}
            alt="Asset preview"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <span className={classes.mutedText}>
            {previewFailed ? 'Preview unavailable' : 'No image'}
          </span>
        )}
      </div>
    </div>
  )
}

export default ImageUploadField
