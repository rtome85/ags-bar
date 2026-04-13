import Gtk from "gi://Gtk?version=4.0"
import Pango from "gi://Pango"
import { createState, createMemo, onCleanup, For } from "ags"
import { interval } from "ags/time"
import { execAsync } from "ags/process"

const ACTION_BTN = "background: transparent; border-radius: 6px; padding: 5px; min-width: 0; min-height: 0;"
const CHECK_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

function SectionHeader({ label }: { label: string }) {
  return (
    <label
      xalign={0}
      label={label.toUpperCase()}
      css="font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 12px 0 6px 0; opacity: 0.5;"
    />
  )
}

async function fetchUpdates(): Promise<string[]> {
  try {
    const out = await execAsync("checkupdates")
    return out.trim().split("\n").filter(Boolean)
  } catch {
    // checkupdates exits 1 when no updates are available
    return []
  }
}

export default function UpdatesWidget() {
  const [updates, setUpdates] = createState<string[]>([])
  const [isBusy, setBusy] = createState(false)

  // Combined derived states
  const hasUpdates = createMemo(() => updates.get().length > 0)
  const showUpdateBtn = createMemo(() => hasUpdates.get() && !isBusy.get())

  async function check() {
    setBusy(true)
    setUpdates(await fetchUpdates())
    setBusy(false)
  }

  async function runUpdate() {
    setBusy(true)
    try {
      await execAsync("omarchy-update")
      setUpdates(await fetchUpdates())
    } catch (e) {
      console.error("omarchy-update failed:", e)
    } finally {
      setBusy(false)
    }
  }

  // Initial check + poll every 10 minutes
  check()
  const timer = interval(CHECK_INTERVAL_MS, check)
  onCleanup(() => timer.cancel())

  return (
    <menubutton>
      {/* Bar icon */}
      <box spacing={5} valign={Gtk.Align.CENTER}>
        <label
          css="font-family: 'JetBrainsMono Nerd Font'; font-size: 16px;"
          label={updates((pkgs) => (pkgs.length > 0 ? "󰚰" : "󰸞"))}
        />
        <label
          visible={hasUpdates}
          label={updates((pkgs) => `${pkgs.length}`)}
          css="font-size: 11px; font-weight: 700;"
        />
      </box>

      <popover>
        <box orientation={Gtk.Orientation.VERTICAL} css="min-width: 280px; padding: 4px 12px 12px;">

          {/* Header card */}
          <box
            spacing={10}
            css="padding: 8px 10px; border-radius: 10px; background: alpha(currentColor, 0.05); margin: 4px 0;"
          >
            <label
              valign={Gtk.Align.CENTER}
              css="font-family: 'JetBrainsMono Nerd Font'; font-size: 18px;"
              label={updates((pkgs) => (pkgs.length > 0 ? "󰚰" : "󰸞"))}
            />
            <box orientation={Gtk.Orientation.VERTICAL} hexpand valign={Gtk.Align.CENTER} spacing={1}>
              <label xalign={0} label="System Updates" css="font-size: 14px; font-weight: 700;" />
              <label
                xalign={0}
                label={updates((pkgs) =>
                  pkgs.length > 0
                    ? `${pkgs.length} update${pkgs.length > 1 ? "s" : ""} available`
                    : "Up to date"
                )}
                css="font-size: 11px; opacity: 0.5;"
              />
            </box>

            {/* Spinner while busy */}
            <Gtk.Spinner
              spinning={isBusy}
              visible={isBusy}
              valign={Gtk.Align.CENTER}
              css="margin: 0 2px;"
            />

            {/* Refresh button — hidden while busy */}
            <button
              visible={isBusy((b) => !b)}
              tooltipText="Check for updates"
              valign={Gtk.Align.CENTER}
              onClicked={check}
              css={ACTION_BTN}
            >
              <image iconName="view-refresh-symbolic" pixelSize={13} css="opacity: 0.4;" />
            </button>

            {/* Update button — only when updates are available and not busy */}
            <button
              visible={showUpdateBtn}
              tooltipText="Update system"
              valign={Gtk.Align.CENTER}
              onClicked={runUpdate}
              css={ACTION_BTN}
            >
              <image iconName="system-software-update-symbolic" pixelSize={13} />
            </button>
          </box>

          {/* Package list */}
          <SectionHeader label="Packages" />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
            {/* Empty state */}
            <label
              xalign={0}
              visible={updates((pkgs) => pkgs.length === 0)}
              label="Everything is up to date"
              css="font-size: 12px; opacity: 0.4; padding: 6px 10px;"
            />
            {/* Package rows */}
            <For each={updates}>
              {(line) => {
                const [name, , , version] = line.split(" ")
                return (
                  <box
                    spacing={10}
                    css="background: transparent; border-radius: 10px; padding: 7px 10px;"
                  >
                    <image
                      iconName="package-x-generic-symbolic"
                      pixelSize={15}
                      valign={Gtk.Align.CENTER}
                      css="opacity: 0.4;"
                    />
                    <label
                      hexpand
                      xalign={0}
                      ellipsize={Pango.EllipsizeMode.END}
                      label={name}
                      css="font-size: 13px; font-weight: 600;"
                    />
                    <label
                      label={version ?? ""}
                      css="font-size: 11px; opacity: 0.5;"
                    />
                  </box>
                )
              }}
            </For>
          </box>

        </box>
      </popover>
    </menubutton>
  )
}
