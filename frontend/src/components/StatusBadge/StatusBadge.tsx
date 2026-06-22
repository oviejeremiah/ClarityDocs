import { DocumentStatus, DocumentType } from '../../types/document.types';

interface StatusBadgeProps {
  status: DocumentStatus;
}

interface TypeBadgeProps {
  type: DocumentType;
}

const statusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  [DocumentStatus.PENDING]: {
    label: 'Pending',
    className: 'badge badge--pending',
  },
  [DocumentStatus.PROCESSING]: {
    label: 'Processing',
    className: 'badge badge--processing',
  },
  [DocumentStatus.COMPLETED]: {
    label: 'Completed',
    className: 'badge badge--completed',
  },
  [DocumentStatus.FAILED]: {
    label: 'Failed',
    className: 'badge badge--failed',
  },
};

const typeConfig: Record<DocumentType, { label: string; className: string }> =
  {
    [DocumentType.INVOICE]: {
      label: 'Invoice',
      className: 'badge badge--invoice',
    },
    [DocumentType.CONTRACT]: {
      label: 'Contract',
      className: 'badge badge--contract',
    },
    [DocumentType.REPORT]: {
      label: 'Report',
      className: 'badge badge--report',
    },
    [DocumentType.UNKNOWN]: {
      label: 'Unknown',
      className: 'badge badge--unknown',
    },
  };

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <span className={config.className}>{config.label}</span>;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const config = typeConfig[type];
  return <span className={config.className}>{config.label}</span>;
}