// Small SVG icons (stroke uses currentColor).
type P = { className?: string }
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

export const IconTag = ({ className = 'size-6' }: P) => (
  <svg {...base} className={className}>
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </svg>
)
export const IconCart = ({ className = 'size-6' }: P) => (
  <svg {...base} className={className}>
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="18" cy="20" r="1.5" />
    <path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
  </svg>
)
export const IconPlus = ({ className = 'size-6' }: P) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const IconSearch = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)
export const IconBack = ({ className = 'size-6' }: P) => (
  <svg {...base} className={className}>
    <path d="M15 18 9 12l6-6" />
  </svg>
)
export const IconPencil = ({ className = 'size-4' }: P) => (
  <svg {...base} className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
)
export const IconTrash = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </svg>
)
export const IconX = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)
export const IconLogout = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
)
export const IconChevron = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)
export const IconEye = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
export const IconEyeOff = ({ className = 'size-5' }: P) => (
  <svg {...base} className={className}>
    <path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-2.8 3.9M6.6 6.6C3.9 8.4 2 12 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20" />
  </svg>
)
