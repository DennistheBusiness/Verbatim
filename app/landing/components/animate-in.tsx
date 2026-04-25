"use client"

import { motion, type Variants } from "framer-motion"

interface AnimateInProps {
  children: React.ReactNode
  delay?: number
  className?: string
  direction?: "up" | "left" | "right" | "none"
  duration?: number
}

export function AnimateIn({
  children,
  delay = 0,
  className,
  direction = "up",
  duration = 0.7,
}: AnimateInProps) {
  const offsets = {
    up:    { y: 28, x: 0 },
    left:  { x: -24, y: 0 },
    right: { x: 24, y: 0 },
    none:  { x: 0, y: 0 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] } },
}
