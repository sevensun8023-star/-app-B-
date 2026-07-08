import { useRef, useCallback } from 'react'

interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  threshold?: number
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }: SwipeOptions) {
  const startX = useRef(0)
  const startY = useRef(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current
      const dy = e.changedTouches[0].clientY - startY.current
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return
      if (dx < 0) onSwipeLeft?.()
      else onSwipeRight?.()
    },
    [onSwipeLeft, onSwipeRight, threshold],
  )

  return { onTouchStart, onTouchEnd }
}
