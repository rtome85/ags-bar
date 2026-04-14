import Gtk from "gi://Gtk?version=4.0"
import { createState, onCleanup } from "ags"
import { interval } from "ags/time"
import { execAsync } from "ags/process"

const CHECK_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

async function fetchUpdateCount(): Promise<number> {
  const [pacman, aur] = await Promise.allSettled([
    execAsync("checkupdates"),
    execAsync("yay -Qua"),
  ])
  const pacmanCount = pacman.status === "fulfilled"
    ? pacman.value.trim().split("\n").filter(Boolean).length
    : 0
  const aurCount = aur.status === "fulfilled"
    ? aur.value.trim().split("\n").filter(Boolean).length
    : 0
  return pacmanCount + aurCount
}

export default function UpdatesWidget() {
  const [count, setCount] = createState(0)

  async function check() {
    setCount(await fetchUpdateCount())
  }

  check()
  const timer = interval(CHECK_INTERVAL_MS, check)
  onCleanup(() => timer.cancel())

  return (
    <button
      onClicked={() => execAsync(["hyprctl", "dispatch", "exec", "[float] ghostty -e omarchy-update"])}
      css="background: transparent; border-radius: 6px; padding: 0 4px;"
      tooltipText="Open system updater"
    >
      <box spacing={5} valign={Gtk.Align.CENTER}>
        <label
          css="font-family: 'JetBrainsMono Nerd Font'; font-size: 16px;"
          label={count((n) => (n > 0 ? "󰚰" : "󰸞"))}
        />
        <label
          visible={count((n) => n > 0)}
          label={count((n) => `${n}`)}
          css="font-size: 11px; font-weight: 700;"
        />
      </box>
    </button>
  )
}
