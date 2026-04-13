import { createBinding, For, This } from "ags"
import app from "ags/gtk4/app"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import style from "./style.scss"
import overrides from "./overrides"
import Bar from "./widget/Bar"

// Loaded at priority 900 (above PRIORITY_USER=800) to win over the
// theme's `* { border-radius: 0 }` and button background rules.
const sliderOverride = new Gtk.CssProvider()
sliderOverride.load_from_string(overrides)

Gtk.StyleContext.add_provider_for_display(
  Gdk.Display.get_default()!,
  sliderOverride,
  900,
)

app.start({
  css: style,
  main() {
    const monitors = createBinding(app, "monitors")

    return (
      <For each={monitors}>
        {(monitor) => (
          <This this={app}>
            <Bar gdkmonitor={monitor} />
          </This>
        )}
      </For>
    )
  },
})
