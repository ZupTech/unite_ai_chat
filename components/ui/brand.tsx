"use client"

import Link from "next/link"
import Image from "next/image"
import { FC } from "react"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  return (
    <Link
      className="flex cursor-pointer flex-col items-center hover:opacity-50"
      href="https://myunite.ai"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="mb-2">
        <Image
          src="/DARK_BRAND_LOGO.png"
          alt="Brand Logo"
          width={50}
          height={50}
        />
      </div>

      <div className="text-4xl font-bold tracking-wide">
        How can I help you?
      </div>
    </Link>
  )
}
