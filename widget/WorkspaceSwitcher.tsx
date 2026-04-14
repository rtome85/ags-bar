import AstalHyprland from "gi://AstalHyprland?version=0.1"
import Gdk from "gi://Gdk?version=4.0"
import { createBinding, For } from "ags"

const ACTIVE_CSS =
  "background: transparent; border-radius: 6px; padding: 5px 10px;" +
  " border: 1px solid currentColor; min-width: 0; min-height: 0;"

const INACTIVE_CSS =
  "background: transparent; border-radius: 6px; padding: 5px 10px;" +
  " border: 1px solid transparent; min-width: 0; min-height: 0;"

export default function WorkspaceSwitcher({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  const hyprland = AstalHyprland.get_default()
  const monitorName = gdkmonitor.connector ?? ""

  const workspaces = createBinding(hyprland, "workspaces")

  // Exclude special/scratchpad workspaces (id < 0), filter to this monitor only
  const monitorWorkspaces = workspaces((ws) =>
    ws
      .filter((w) => w.id > 0 && w.monitor?.name === monitorName)
      .sort((a, b) => a.id - b.id)
  )

  // Bind directly to this monitor's activeWorkspace so it fires on every switch.
  // createBinding(hyprland, "monitors") only fires when the list changes, not when
  // a monitor's activeWorkspace property changes — so we bind the monitor object itself.
  const hyprMonitor = hyprland.get_monitors().find((m) => m.name === monitorName)
  const activeWorkspaceId = hyprMonitor
    ? createBinding(hyprMonitor, "activeWorkspace")((ws) => ws?.id ?? -1)
    : createBinding(hyprland, "focusedWorkspace")((ws) => ws?.id ?? -1)

  return (
    <box spacing={2} css="padding: 5px 10px;">
      <For each={monitorWorkspaces}>
        {(workspace) => (
          <button
            onClicked={() => hyprland.dispatch("workspace", `${workspace.id}`)}
            css={activeWorkspaceId((activeId) =>
              activeId === workspace.id ? ACTIVE_CSS : INACTIVE_CSS
            )}
          >
            <label
              css="font-size: 12px; font-weight: 700;"
              label={`${workspace.id}`}
            />
          </button>
        )}
      </For>
    </box>
  )
}
