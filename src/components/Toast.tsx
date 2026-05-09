import { useEffect } from 'react'

interface ToastProps {
  message: string
  visible: boolean
  onClose?: () => void
  duration?: number
}

export default function Toast({ message, visible, onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => onClose?.(), duration)
    return () => clearTimeout(t)
  }, [visible, duration, onClose])

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50
        px-5 py-3 rounded-xl shadow-md bg-violet-100 text-violet-900
        text-base font-medium transition-opacity duration-300 whitespace-nowrap
        ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}
