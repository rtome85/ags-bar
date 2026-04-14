import Gtk from "gi://Gtk?version=4.0"
import Pango from "gi://Pango"
import GLib from "gi://GLib"
import AstalNotifd from "gi://AstalNotifd"
import { createBinding, For } from "ags"
import { unreadIds, clearAll, markRead } from "./notificationState"

const ACTION_BTN =
  "background: transparent; border-radius: 6px; padding: 5px; min-width: 0; min-height: 0;"

function SectionHeader({ label }: { label: string }) {
  return (
    <label
      xalign={0}
      label={label.toUpperCase()}
      css="font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 12px 0 6px 0; opacity: 0.5;"
    />
  )
}

function timeAgo(unixTime: number): string {
  const now = GLib.DateTime.new_now_local().to_unix()
  const diff = now - unixTime
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function NotificationRow({
  notification,
}: {
  notification: AstalNotifd.Notification
}) {
  return (
    <box
      css="background: alpha(currentColor, 0.04); border-radius: 10px; padding: 9px 10px;"
      spacing={10}
    >
      <image
        iconName={notification.appIcon || "dialog-information-symbolic"}
        pixelSize={16}
        valign={Gtk.Align.START}
        css="margin-top: 2px; opacity: 0.7;"
      />
      <box
        orientation={Gtk.Orientation.VERTICAL}
        hexpand
        valign={Gtk.Align.CENTER}
        spacing={2}
      >
        <box spacing={4}>
          <label
            hexpand
            xalign={0}
            ellipsize={Pango.EllipsizeMode.END}
            label={notification.summary || notification.appName}
            css="font-size: 13px; font-weight: 600;"
          />
          <label
            xalign={1}
            label={timeAgo(notification.time)}
            css="font-size: 10px; opacity: 0.4;"
          />
        </box>
        <label
          xalign={0}
          wrap
          wrapMode={Pango.WrapMode.WORD_CHAR}
          lines={2}
          ellipsize={Pango.EllipsizeMode.END}
          label={notification.body}
          visible={!!notification.body}
          css="font-size: 11px; opacity: 0.5;"
        />
        <label
          xalign={0}
          label={notification.appName}
          css="font-size: 10px; opacity: 0.35; font-weight: 600; letter-spacing: 0.5px;"
        />
      </box>
      <button
        tooltipText="Dismiss"
        valign={Gtk.Align.START}
        onClicked={() => { notification.dismiss(); markRead(notification.id) }}
        css={ACTION_BTN}
      >
        <image iconName="window-close-symbolic" pixelSize={11} css="opacity: 0.35;" />
      </button>
    </box>
  )
}

function clearUnread() {
  const notifd = AstalNotifd.get_default()
  notifd.notifications.forEach((n) => n.dismiss())
  clearAll()
}

export default function NotificationCenter() {
  const notifd = AstalNotifd.get_default()
  const notifications = createBinding(notifd, "notifications")

  // Badge count is driven by unread IDs, not total notifications
  const count = unreadIds((ids) => ids.length)

  return (
    <menubutton
    >
      {/* Bar icon — bell with unread badge */}
      <box spacing={4} valign={Gtk.Align.CENTER}>
        <label
          css="font-family: 'JetBrainsMono Nerd Font'; font-size: 16px;"
          label={count((n) => (n > 0 ? "󱅫" : "󰂚"))}
        />
        <label
          visible={count((n) => n > 0)}
          label={count((n) => `${n}`)}
          css="font-size: 11px; font-weight: 700;"
        />
      </box>

      <popover>
        <box
          orientation={Gtk.Orientation.VERTICAL}
          css="min-width: 320px; padding: 4px 12px 12px;"
        >
          {/* Header card */}
          <box
            spacing={10}
            css="padding: 8px 10px; border-radius: 10px; background: alpha(currentColor, 0.05); margin: 4px 0;"
          >
            <label
              valign={Gtk.Align.CENTER}
              css="font-family: 'JetBrainsMono Nerd Font'; font-size: 18px;"
              label="󰂚"
            />
            <box
              orientation={Gtk.Orientation.VERTICAL}
              hexpand
              valign={Gtk.Align.CENTER}
              spacing={1}
            >
              <label xalign={0} label="Notifications" css="font-size: 14px; font-weight: 700;" />
              <label
                xalign={0}
                label={notifications((ns) =>
                  ns.length > 0 ? `${ns.length} notifications` : "No new notifications"
                )}
                css="font-size: 11px; opacity: 0.5;"
              />
            </box>
            <button
              tooltipText="Clear all"
              valign={Gtk.Align.CENTER}
              visible={notifications((ns) => ns.length > 0)}
              onClicked={clearUnread}
              css={ACTION_BTN}
            >
              <image iconName="user-trash-symbolic" pixelSize={13} css="opacity: 0.4;" />
            </button>
          </box>

          <SectionHeader label="Recent" />

          <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
            <For each={notifications}>
              {(notification) => <NotificationRow notification={notification} />}
            </For>

            <box
              orientation={Gtk.Orientation.VERTICAL}
              visible={notifications((ns) => ns.length === 0)}
              halign={Gtk.Align.CENTER}
              spacing={6}
              css="padding: 24px 0; opacity: 0.35;"
            >
              <label
                css="font-family: 'JetBrainsMono Nerd Font'; font-size: 32px;"
                label="󰂚"
              />
              <label css="font-size: 12px;" label="All caught up" />
            </box>
          </box>
        </box>
      </popover>
    </menubutton>
  )
}
