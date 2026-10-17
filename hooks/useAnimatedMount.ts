import type { Variants } from 'framer-motion'

export function useAnimatedMount() {
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  }

  const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
  }

  function stagger(i: number): { transition: { delay: number } } {
    return { transition: { delay: i * 0.06 } }
  }

  return { fadeUp, fadeIn, stagger }
}
