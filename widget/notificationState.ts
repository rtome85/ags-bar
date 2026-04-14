import { createState } from "ags"

export const [unreadIds, setUnreadIds] = createState<number[]>([])

export function markUnread(id: number) {
  setUnreadIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
}

export function markRead(id: number) {
  setUnreadIds((prev) => prev.filter((i) => i !== id))
}

export function clearAll() {
  setUnreadIds([])
}
