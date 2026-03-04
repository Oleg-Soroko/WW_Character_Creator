import { useRef } from 'react'
import { readFileAsDataUrl } from '../lib/imageDataUrl'

export function ReferenceUpload({ value, disabled, onChange, compact = false }) {
  const inputRef = useRef(null)

  const handleSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      onChange(null)
      return
    }

    const previewUrl = await readFileAsDataUrl(file)
    onChange({
      file,
      previewUrl,
    })
  }

  const handleRemove = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }

    onChange(null)
  }

  if (compact) {
    return (
      <div className="reference-upload reference-upload--compact">
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleSelect}
          disabled={disabled}
        />
        <button
          type="button"
          className={`icon-button icon-button--reference ${value ? 'is-attached' : ''}`}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          aria-label={value ? 'Change reference image' : 'Upload reference image'}
          title={value ? 'Change reference image' : 'Upload reference image'}
        >
          {value?.previewUrl ? (
            <img
              className="icon-button__thumb"
              src={value.previewUrl}
              alt=""
              aria-hidden="true"
            />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M4.75 7.25A2.5 2.5 0 0 1 7.25 4.75h9.5a2.5 2.5 0 0 1 2.5 2.5v9.5a2.5 2.5 0 0 1-2.5 2.5h-9.5a2.5 2.5 0 0 1-2.5-2.5v-9.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M7.5 15.75l3.05-3.05a1 1 0 0 1 1.41 0l1.59 1.59 2.95-2.95"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.25 9.5h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18 3.5v4m-2-2h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <span className="visually-hidden">
            {value ? 'Change reference image' : 'Upload reference image'}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="reference-upload">
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleSelect}
        disabled={disabled}
      />
      <button
        type="button"
        className="ghost-button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        {value ? 'Change Reference' : 'Upload Reference'}
      </button>
      {value ? (
        <div className="reference-preview">
          <img src={value.previewUrl} alt={value.file.name} />
          <div>
            <p>{value.file.name}</p>
            <button type="button" className="text-button" onClick={handleRemove}>
              Remove
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
