import Gtk from "gi://Gtk?version=4.0"
import Pango from "gi://Pango"
import AstalBluetooth from "gi://AstalBluetooth?version=0.1"
import { createBinding, For, With, onCleanup } from "ags"

function btDeviceIcon(icon: string): string {
  const i = (icon || "").toLowerCase()
  if (i.includes("headset") || i.includes("headphone")) return "audio-headset-symbolic"
  if (i.includes("keyboard")) return "input-keyboard-symbolic"
  if (i.includes("mouse")) return "input-mouse-symbolic"
  if (i.includes("speaker") || i.includes("audio")) return "audio-speakers-symbolic"
  if (i.includes("phone")) return "phone-symbolic"
  if (i.includes("computer")) return "computer-symbolic"
  return "bluetooth-symbolic"
}

function SectionHeader({ label }: { label: string }) {
  return (
    <label
      xalign={0}
      label={label.toUpperCase()}
      css="font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 12px 0 6px 0; opacity: 0.5;"
    />
  )
}

const ACTION_BTN = "background: transparent; border-radius: 6px; padding: 5px; min-width: 0; min-height: 0;"
const SCAN_TIMEOUT_MS = 10_000

function DeviceRow({ device, adapter }: { device: AstalBluetooth.Device; adapter: AstalBluetooth.Adapter | null }) {
  const connected = createBinding(device, "connected")
  const connecting = createBinding(device, "connecting")
  const battery = createBinding(device, "batteryPercentage")

  // Subtitle: battery % when available, otherwise "Connected"
  const subtitle = battery((pct) => pct >= 0 ? `${Math.round(pct * 100)}% battery` : "Connected")

  return (
    <box
      css={connected((c) =>
        c
          ? "background: alpha(currentColor, 0.07); border-radius: 10px; padding: 7px 10px;"
          : "background: transparent; border-radius: 10px; padding: 7px 10px;"
      )}
      spacing={10}
    >
      {/* Fixed-width icon lane */}
      <image
        iconName={btDeviceIcon(device.icon)}
        pixelSize={15}
        valign={Gtk.Align.CENTER}
        css={connected((c) => (c ? "" : "opacity: 0.4;"))}
      />

      {/* Name + status subtitle */}
      <box orientation={Gtk.Orientation.VERTICAL} hexpand valign={Gtk.Align.CENTER} spacing={1}>
        <label
          xalign={0}
          ellipsize={Pango.EllipsizeMode.END}
          label={createBinding(device, "alias")}
          css="font-size: 13px; font-weight: 600;"
        />
        <label
          xalign={0}
          label={connecting((ing) => (ing ? "Connecting…" : subtitle.get()))}
          visible={connected((c) => c)}
          css="font-size: 11px; opacity: 0.5;"
        />
      </box>

      {/* Spinner while connecting */}
      <Gtk.Spinner
        spinning={connecting}
        visible={connecting}
        valign={Gtk.Align.CENTER}
        css="margin: 0 2px;"
      />

      {/* Connect / disconnect */}
      <button
        visible={connecting((ing) => !ing)}
        tooltipText={connected((c) => (c ? "Disconnect" : "Connect"))}
        valign={Gtk.Align.CENTER}
        onClicked={() => {
          if (device.connected) {
            device.disconnect_device(null)
          } else {
            device.connect_device(null)
          }
        }}
        css={ACTION_BTN}
      >
        <image
          iconName={connected((c) => (c ? "network-transmit-receive-symbolic" : "network-offline-symbolic"))}
          pixelSize={13}
          css={connected((c) => (c ? "" : "opacity: 0.4;"))}
        />
      </button>

      {/* Remove / unpair */}
      <button
        tooltipText="Remove"
        valign={Gtk.Align.CENTER}
        onClicked={() => {
          try {
            if (device.connected) device.disconnect_device(null)
            adapter?.remove_device(device)
          } catch (e) {
            console.error("Failed to remove device:", e)
          }
        }}
        css={ACTION_BTN}
      >
        <image iconName="user-trash-symbolic" pixelSize={13} css="opacity: 0.4;" />
      </button>
    </box>
  )
}

function AvailableDeviceRow({ device }: { device: AstalBluetooth.Device }) {
  const connecting = createBinding(device, "connecting")

  return (
    <box css="background: transparent; border-radius: 10px; padding: 7px 10px;" spacing={10}>
      <image
        iconName={btDeviceIcon(device.icon)}
        pixelSize={15}
        valign={Gtk.Align.CENTER}
        css="opacity: 0.4;"
      />
      <label
        hexpand
        xalign={0}
        ellipsize={Pango.EllipsizeMode.END}
        label={createBinding(device, "alias")}
        css="font-size: 13px; font-weight: 600; opacity: 0.7;"
      />
      <Gtk.Spinner
        spinning={connecting}
        visible={connecting}
        valign={Gtk.Align.CENTER}
        css="margin: 0 2px;"
      />
      <button
        tooltipText="Pair"
        valign={Gtk.Align.CENTER}
        visible={connecting((ing) => !ing)}
        onClicked={() => device.pair()}
        css={ACTION_BTN}
      >
        <image iconName="list-add-symbolic" pixelSize={13} />
      </button>
    </box>
  )
}

export default function BluetoothWidget() {
  const bt = AstalBluetooth.get_default()

  // Instance-scoped timer — no cross-instance interference
  let scanTimer: ReturnType<typeof setTimeout> | null = null

  function startScan(adp: AstalBluetooth.Adapter) {
    if (scanTimer) clearTimeout(scanTimer)
    adp.start_discovery()
    scanTimer = setTimeout(() => {
      adp.stop_discovery()
      scanTimer = null
    }, SCAN_TIMEOUT_MS)
  }

  function stopScan(adp: AstalBluetooth.Adapter) {
    if (scanTimer) {
      clearTimeout(scanTimer)
      scanTimer = null
    }
    adp.stop_discovery()
  }

  onCleanup(() => {
    if (scanTimer) clearTimeout(scanTimer)
    scanTimer = null
  })

  const devices = createBinding(bt, "devices")
  const isPowered = createBinding(bt, "isPowered")
  const adapter = createBinding(bt, "adapter")

  const myDevices = devices((devs) => devs.filter((d) => d.paired))
  const availableDevices = devices((devs) => devs.filter((d) => !d.paired))

  return (
    <menubutton>
      {/* Bar icon */}
      <label
        css="font-family: 'JetBrainsMono Nerd Font'; font-size: 16px;"
        label={isPowered((p) => (p ? "󰂯" : "󰂲"))}
      />

      <popover>
        <box orientation={Gtk.Orientation.VERTICAL} css="min-width: 280px; padding: 4px 12px 12px;">

          {/* Power header card */}
          <box
            spacing={10}
            css="padding: 8px 10px; border-radius: 10px; background: alpha(currentColor, 0.05); margin: 4px 0;"
          >
            <label
              valign={Gtk.Align.CENTER}
              css="font-family: 'JetBrainsMono Nerd Font'; font-size: 18px;"
              label={isPowered((p) => (p ? "󰂯" : "󰂲"))}
            />
            <box orientation={Gtk.Orientation.VERTICAL} hexpand valign={Gtk.Align.CENTER} spacing={1}>
              <label xalign={0} label="Bluetooth" css="font-size: 14px; font-weight: 700;" />
              <label
                xalign={0}
                label={isPowered((p) => (p ? "On" : "Off"))}
                css="font-size: 11px; opacity: 0.5;"
              />
            </box>
            <switch
              active={isPowered}
              valign={Gtk.Align.CENTER}
              onStateSet={(_self, _state) => {
                bt.toggle()
                return false
              }}
              css="transform: scale(0.75); transform-origin: center right;"
            />
          </box>

          {/* <Gtk.Separator css="margin: 8px 0;" /> */}

          {/* My Devices */}
          <SectionHeader label="My Devices" />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2} css="margin-bottom: 8px;">
            <For each={myDevices}>
              {(device) => <DeviceRow device={device} adapter={bt.adapter} />}
            </For>
          </box>

          {/* <Gtk.Separator css="margin: 8px 0;" /> */}

          {/* Available Devices header + scan button */}
          <box spacing={8}>
            <label
              hexpand
              xalign={0}
              valign={Gtk.Align.CENTER}
              label="AVAILABLE DEVICES"
              css="font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 12px 0 6px 0; opacity: 0.5;"
            />
            <With value={adapter}>
              {(adp) =>
                adp ? (
                  <button
                    valign={Gtk.Align.CENTER}
                    tooltipText={createBinding(adp, "discovering")((d) => (d ? "Stop scan" : "Scan"))}
                    onClicked={() => {
                      if (adp.discovering) {
                        stopScan(adp)
                      } else {
                        startScan(adp)
                      }
                    }}
                    css={ACTION_BTN}
                  >
                    <image
                      iconName="view-refresh-symbolic"
                      pixelSize={13}
                      css={createBinding(adp, "discovering")((d) => (d ? "" : "opacity: 0.4;"))}
                    />
                  </button>
                ) : (
                  <label label="" />
                )
              }
            </With>
          </box>

          <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
            <For each={availableDevices}>
              {(device) => <AvailableDeviceRow device={device} />}
            </For>
            <With value={adapter}>
              {(adp) =>
                adp ? (
                  <label
                    label="Scanning…"
                    visible={createBinding(adp, "discovering")}
                    css="font-size: 11px; opacity: 0.5; padding: 4px 10px;"
                  />
                ) : (
                  <label label="" />
                )
              }
            </With>
          </box>

        </box>
      </popover>
    </menubutton>
  )
}
