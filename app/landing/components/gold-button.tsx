"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GoldButtonProps {
  href: string
  children: React.ReactNode
  variant?: "filled" | "outline" | "ghost"
  className?: string
  size?: "sm" | "md" | "lg"
}

export function GoldButton({
  href,
  children,
  variant = "filled",
  className,
  size = "md",
}: GoldButtonProps) {
  const sizes = {
    sm: "px-5 py-2.5 text-sm",
    md: "px-7 py-3.5 text-base",
    lg: "px-9 py-4 text-lg",
  }

  const variants = {
    filled:  "bg-[#c9a447] text-[#080808] font-semibold hover:bg-[#e8c96c]",
    outline: "border border-[#c9a447]/60 text-[#c9a447] hover:border-[#c9a447] hover:bg-[#c9a447]/5",
    ghost:   "text-[#c9a447] hover:text-[#e8c96c]",
  }

  return (
    <motion.a
      href={href}
      whileHover={
        variant === "filled"
          ? { boxShadow: "0 0 28px rgba(201,164,71,0.35)", scale: 1.02 }
          : { scale: 1.02 }
      }
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full tracking-wide transition-colors",
        sizes[size],
        variants[variant],
        className
      )}
    >
      {children}
    </motion.a>
  )
}
