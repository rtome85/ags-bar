import Astal from "gi://Astal?version=4.0"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import Pango from "gi://Pango"
import AstalNotifd from "gi://AstalNotifd"
import app from "ags/gtk4/app"
import { onCleanup } from "ags"
import { markUnread, markRead } from "./notificationState"

const DISMISS_MS = 5000
const ACTION_BTN =
  "background: transparent; border-radius: 6px; padding: 4px; min-width: 0; min-height: 0;"

function spawnPopup(notification: AstalNotifd.Notification, gdkmonitor: Gdk.Monitor) {
  const { TOP, RIGHT } = Astal.WindowAnchor
  const actions = notification.actions ?? []
  let timer: ReturnType<typeof setTimeout>
  let win: Astal.Window
  let dismissed = false

  function close() {
    dismissed = true
    clearTimeout(timer)
    win?.destroy()
  }

  function handleRead() {
    if (dismissed) return
    notification.dismiss()
    markRead(notification.id)
    close()
  }

  function handleTimeout() {
    if (dismissed) return
    markUnread(notification.id)
    close()
  }

  function invokeAction(actionId: string) {
    if (dismissed) return
    notification.invoke(actionId)
    handleRead()
  }

  win = (
    <window
      visible
      namespace="notification-popup"
      gdkmonitor={gdkmonitor}
      anchor={TOP | RIGHT}
      marginTop={8}
      marginRight={8}
      application={app}
      layer={Astal.Layer.OVERLAY}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      keymode={Astal.Keymode.NONE}
      css="background: transparent;"
    >
      <box
        orientation={Gtk.Orientation.VERTICAL}
        css={`
          background: @theme_bg_color;
          border-radius: 12px;
          border: 1px solid alpha(currentColor, 0.08);
          min-width: 360px;
        `}
      >
        {/* Main content row — clicking it marks as read */}
        <button
          onClicked={handleRead}
          css="background: transparent; border-radius: 12px 12px 0 0; padding: 0;"
        >
          <box spacing={12} css="padding: 12px 14px;">
            <image
              iconName={notification.appIcon || "dialog-information-symbolic"}
              pixelSize={20}
              valign={Gtk.Align.START}
              css="margin-top: 2px; opacity: 0.75;"
            />
            <box
              orientation={Gtk.Orientation.VERTICAL}
              hexpand
              valign={Gtk.Align.CENTER}
              spacing={3}
            >
              <label
                xalign={0}
                ellipsize={Pango.EllipsizeMode.END}
                label={notification.summary || notification.appName}
                css="font-size: 13px; font-weight: 700;"
              />
              <label
                xalign={0}
                wrap
                wrapMode={Pango.WrapMode.WORD_CHAR}
                lines={2}
                ellipsize={Pango.EllipsizeMode.END}
                label={notification.body}
                visible={!!notification.body}
                css="font-size: 12px; opacity: 0.6;"
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
              onClicked={handleTimeout}
              css={ACTION_BTN}
            >
              <image iconName="window-close-symbolic" pixelSize={11} css="opacity: 0.35;" />
            </button>
          </box>
        </button>

        {/* Action buttons — only rendered when actions exist */}
        {actions.length > 0 && (
          <box
            css={`
              padding: 0 10px 10px;
              border-top: 1px solid alpha(currentColor, 0.06);
            `}
            spacing={6}
          >
            {actions.map((action) => (
              <button
                hexpand
                onClicked={() => invokeAction(action.id)}
                css={`
                  background: alpha(currentColor, 0.06);
                  border-radius: 8px;
                  padding: 6px 10px;
                  font-size: 12px;
                  font-weight: 600;
                `}
              >
                <label label={action.label} />
              </button>
            ))}
          </box>
        )}
      </box>
    </window>
  ) as unknown as Astal.Window

  timer = setTimeout(handleTimeout, DISMISS_MS)
}

export default function NotificationPopups({ gdkmonitor }: { gdkmonitor: Gdk.Monitor }) {
  const notifd = AstalNotifd.get_default()
  let listenerWin: Astal.Window

  const handle = notifd.connect("notified", (_: unknown, id: number) => {
    const notification = notifd.get_notification(id)
    if (!notification) return
    spawnPopup(notification, gdkmonitor)
  })

  onCleanup(() => {
    notifd.disconnect(handle)
    listenerWin?.destroy()
  })

  return (
    <window
      $={(self) => (listenerWin = self)}
      visible={false}
      namespace="notification-listener"
      gdkmonitor={gdkmonitor}
      application={app}
      layer={Astal.Layer.BACKGROUND}
      css="background: transparent;"
    >
      <box />
    </window>
  )
}
