import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadDocument } from '../../hooks/useUploadDocument';
import { ErrorBanner } from '../ErrorBanner/ErrorBanner';

export function UploadZone({ onSuccess }: { onSuccess?: () => void }) {
  const { mutate: upload, isPending, error } = useUploadDocument();
  const [localError, setLocalError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      setLocalError(null);

      if ((rejectedFiles as File[]).length > 0) {
        setLocalError('Only PDF files under 10MB are accepted.');
        return;
      }

      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      upload(file, {
       onSuccess: () => onSuccess?.(),
       onError: (err) => setLocalError(err.message),
      });
    },
    [upload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
    disabled: isPending,
  });

  return (
    <div className="upload-section">
      {(error ?? localError) && (
        <ErrorBanner
          message={error?.message ?? localError ?? ''}
          onDismiss={() => setLocalError(null)}
        />
      )}

      <div
        {...getRootProps()}
        className={`upload-zone${isDragActive ? ' upload-zone--active' : ''}${isPending ? ' upload-zone--disabled' : ''}`}
      >
        <input {...getInputProps()} />

        {isPending ? (
          <div className="upload-zone__content">
            <div className="spinner" aria-label="Uploading" />
            <p className="upload-zone__text">Uploading and queuing for AI processing…</p>
          </div>
        ) : (
          <div className="upload-zone__content">
            <div className="upload-zone__icon">
              <i className="ti ti-cloud-upload" aria-hidden="true" style={{ fontSize: '20px' }} />
            </div>
            <p className="upload-zone__text">
              {isDragActive
                ? 'Drop your PDF here'
                : 'Drag and drop a PDF, or click to browse'}
            </p>
            <p className="upload-zone__hint">
              PDF · JPEG · PNG · CSV · XLSX · DOCX · TXT · Max 20MB
            </p>
            <button className="btn btn--primary" type="button" disabled={isPending}>
              Choose file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}