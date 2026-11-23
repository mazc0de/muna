import { useState, type ComponentProps } from 'react'
import { IconEye, IconEyeOff } from './icons'

type Props = Omit<ComponentProps<'input'>, 'type'>

/** Password field with a show/hide toggle. `className` goes on the wrapper. */
export function PasswordInput({ className = '', ...props }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={`relative ${className}`}>
      <input {...props} type={visible ? 'text' : 'password'} className="input pr-12" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg p-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  )
}
