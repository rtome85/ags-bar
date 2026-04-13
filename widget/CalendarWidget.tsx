import Gtk from "gi://Gtk?version=4.0"
import GLib from "gi://GLib"
import { createPoll } from "ags/time"

function SectionHeader({ label }: { label: string }) {
  return (
    <label
      xalign={0}
      label={label.toUpperCase()}
      css="font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 12px 0 6px 0; opacity: 0.5;"
    />
  )
}

export default function CalendarWidget() {
  const time = createPoll("", 1000, () => GLib.DateTime.new_now_local().format("%H:%M")!)
  const date = createPoll("", 1000, () =>
    GLib.DateTime.new_now_local().format("%A, %d %B %Y")!
  )
  const barLabel = createPoll("", 1000, () =>
    GLib.DateTime.new_now_local().format("󰃭  %a %d %b  %H:%M")!
  )

  return (
    <menubutton>
      {/* Bar icon */}
      <label
        css="font-family: 'JetBrainsMono Nerd Font'; font-size: 13px;"
        label={barLabel}
      />

      <popover>
        <box orientation={Gtk.Orientation.VERTICAL} css="min-width: 260px; padding: 4px 12px 12px;">

          {/* Date/time header card */}
          <box
            spacing={10}
            css="padding: 8px 10px; border-radius: 10px; background: alpha(currentColor, 0.05); margin: 4px 0;"
          >
            <label
              valign={Gtk.Align.CENTER}
              css="font-family: 'JetBrainsMono Nerd Font'; font-size: 18px;"
              label="󰃭"
            />
            <box orientation={Gtk.Orientation.VERTICAL} hexpand valign={Gtk.Align.CENTER} spacing={1}>
              <label xalign={0} label={time} css="font-size: 14px; font-weight: 700;" />
              <label xalign={0} label={date} css="font-size: 11px; opacity: 0.5;" />
            </box>
          </box>

          <SectionHeader label="Calendar" />
          <Gtk.Calendar css="border-radius: 10px; padding: 4px;" />

        </box>
      </popover>
    </menubutton>
  )
}
