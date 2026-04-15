# ags-bar

A GTK4 status bar for Wayland compositors, built with [AGS](https://aylur.github.io/ags/) (Astal/gnim) and TypeScript.

## Prerequisites

| Dependency | Purpose |
|---|---|
| `ags` | Runtime / JSX renderer (gnim-based) |
| `astal-bluetooth` | Bluetooth GLib introspection library |
| `astal-wp` | PipeWire / WirePlumber audio |
| `astal-network` | NetworkManager integration |
| `astal-battery` | UPower battery info |
| `astal-tray` | System tray (StatusNotifierItem) |
| `astal-mpris` | Media player control (MPRIS2) |
| `astal-power-profiles` | power-profiles-daemon |
| `JetBrainsMono Nerd Font` | Nerd Font glyphs used in labels |

## Running

```sh
ags run app.tsx
```

The bar renders on every connected monitor reactively — new monitors are picked
up automatically via `createBinding(app, "monitors")`.

## Project structure

```
app.tsx          Entry point; mounts Bar on each monitor
widget/
  Bar.tsx        Root bar widget; composes all modules
  BluetoothWidget.tsx  Bluetooth power toggle + device manager
  SoundWidget.tsx      MPRIS carousel + PipeWire volume/device selector
style.scss       Global bar styles
overrides.ts     CSS provider loaded at priority 900 to override theme defaults
```

## Widgets

### BluetoothWidget

Menubutton in the bar that opens a popover with:

- **Power header** — Nerd Font icon, "Bluetooth On/Off" label, and a toggle
  switch. Toggling calls `bt.toggle()`.
- **My Devices** — Paired devices. Each row shows:
  - Device icon (type-inferred), name, battery % (when available)
  - Spinner while connecting; connect/disconnect and remove buttons when idle
- **Available Devices** — Unpaired devices found by the adapter. Each row has
  a pair button that shows a spinner while pairing.
  - A **Scan** button starts `adapter.start_discovery()` and auto-stops after
    10 seconds (`SCAN_TIMEOUT_MS`). "Scanning…" text appears while active.
  - The scan timer is instance-scoped and cleared on component cleanup via
    `onCleanup`.

### SoundWidget

Menubutton showing a Nerd Font volume icon. Popover contains:

- **Media** — Carousel for all running MPRIS players with cover art, title,
  artist, previous track, play/pause, next track, and wraparound player
  navigation
- **Applications** — Per-stream volume sliders for active PipeWire clients
- **Playback Devices** — Speaker selection; active device highlighted
- **Input Devices** — Microphone selection; active device highlighted

### Bar (Bar.tsx)

Composes the following modules left-to-right (or in configured order):

| Module | Source |
|---|---|
| System Tray | Inline in Bar.tsx |
| Network | Inline in Bar.tsx |
| Battery | Inline in Bar.tsx |
| Power Profiles | Inline in Bar.tsx |
| Sound | `SoundWidget` |
| Bluetooth | `BluetoothWidget` |
| Clock | Inline in Bar.tsx |

## Design conventions

- **Active state**: `background: alpha(currentColor, 0.07–0.08); border-radius: 10px`
- **Action buttons**: `background: transparent; border-radius: 6px; padding: 5px`
- **Section headers**: 10px, weight 700, letter-spacing 1px, opacity 0.5
- **Icon sizes**: 15px for device icons, 13px for action icons, 16–18px for bar glyphs
- **Reactive bindings**: `createBinding(obj, "prop")` — transforms via `binding(val => ...)`
- **Nullable adapters**: Never force-unwrap (`!`) GLib objects that can be null during
  adapter transitions; use optional chaining (`?.`) or `With` guards instead
