import { useEffect } from "react"

export const AutoRefresh = () => {
  useEffect(() => {
    const needsSecondRefresh = localStorage.getItem("needsSecondRefresh")

    if (needsSecondRefresh === "true") {
      console.log("Preparing second refresh...")
      localStorage.removeItem("needsSecondRefresh") // Limpar a flag

      // Aguardar 1 segundo e então fazer o refresh
      setTimeout(() => {
        console.log("Executing second refresh...")
        window.location.reload()
      }, 1000)
    }
  }, [])

  return null
}
