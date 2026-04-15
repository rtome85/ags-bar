import { createBinding, For, This, removeChild } from "ags"
import app from "ags/gtk4/app"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import style from "./style.scss"
import overrides from "./overrides"
import Bar from "./widget/Bar"
import NotificationPopups from "./widget/NotificationPopups"

// Loaded at priority 900 (above PRIORITY_USER=800) to win over the
// theme's `* { border-radius: 0 }` and button background rules.
const sliderOverride = new Gtk.CssProvider()
sliderOverride.load_from_string(overrides)

Gtk.StyleContext.add_provider_for_display(
  Gdk.Display.get_default()!,
  sliderOverride,
  900,
)

// When a monitor is removed, For tries to remove the Bar window from app.
// The AGS removeChild handler doesn't cover app.remove_window, so we override it here.
;(app as any)[removeChild] = (child: any) => child.destroy?.()

app.start({
  css: style,
  main() {
    const monitors = createBinding(app, "monitors")

    return (
      <This this={app}>
        <For each={monitors}>
          {(monitor) => <Bar gdkmonitor={monitor} />}
        </For>
        <NotificationPopups />
      </This>
    )
  },
})
