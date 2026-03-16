import { useEffect } from "react"
import type { RefObject } from "react"

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutsideClick: () => void,
) {
  useEffect(() => {
    function onDocumentMouseDown(event: MouseEvent) {
      if (!ref.current) {
        return
      }

      if (!ref.current.contains(event.target as Node)) {
        onOutsideClick()
      }
    }

    document.addEventListener("mousedown", onDocumentMouseDown)
    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown)
    }
  }, [onOutsideClick, ref])
}
