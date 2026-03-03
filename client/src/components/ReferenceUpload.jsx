import { useRef } from 'react'
import { readFileAsDataUrl } from '../lib/imageDataUrl'

export function ReferenceUpload({ value, disabled, onChange }) {
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
      ) : (
        <p className="support-copy">Prompt-only, image-only, or hybrid input all work here.</p>
      )}
    </div>
  )
}
