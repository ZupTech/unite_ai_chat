import { useEffect, useState } from "react"

export const useLocalStorage = (key: string) => {
  const [value, setValue] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem(key)
  })

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) setValue(e.newValue)
    }

    const checkValue = () => {
      const currentValue = localStorage.getItem(key)
      if (currentValue !== value) setValue(currentValue)
    }

    window.addEventListener("storage", handleStorageChange)
    const interval = setInterval(checkValue, 300)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [key, value])

  return value
}
