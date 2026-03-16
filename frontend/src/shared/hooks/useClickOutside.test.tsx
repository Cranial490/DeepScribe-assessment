import { useRef } from "react"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render } from "@testing-library/react"
import { useClickOutside } from "@/shared/hooks/useClickOutside"

function TestComponent({ onOutsideClick }: { onOutsideClick: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useClickOutside(ref, onOutsideClick)

  return (
    <div>
      <div ref={ref}>inside</div>
      <button type="button">outside</button>
    </div>
  )
}

describe("useClickOutside", () => {
  it("calls handler when click occurs outside ref", () => {
    const onOutsideClick = vi.fn()
    const { getByText } = render(<TestComponent onOutsideClick={onOutsideClick} />)

    fireEvent.mouseDown(getByText("outside"))

    expect(onOutsideClick).toHaveBeenCalledTimes(1)
  })
})
