/** App logo: the icon (public/favicon.svg) plus the "MuNa" wordmark. */
export function Logo({ size = 'md' }: { size?: 'sm' | 'lg' | 'md' }) {
  const icon = { sm: 'size-7 rounded-lg', md: 'size-10 rounded-xl', lg: 'size-16 rounded-2xl' }[size]
  const text = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' }[size]
  return (
    <span className={`inline-flex items-center ${size === 'lg' ? 'flex-col gap-3' : 'gap-2'}`}>
      <img src="/favicon.svg" alt="" aria-hidden className={`${icon} shrink-0`} />
      <span className={`${text} font-black tracking-tight text-emerald-700 dark:text-emerald-400`}>MuNa</span>
    </span>
  )
}
