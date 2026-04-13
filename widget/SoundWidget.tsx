import Gtk from "gi://Gtk?version=4.0"
import AstalWp from "gi://AstalWp"
import { createBinding, For, With } from "ags"

const STREAM_ICONS: Record<string, string> = {
  firefox: "󰈹",
  "firefox-esr": "󰈹",
  chromium: "󰊯",
  "chromium-browser": "󰊯",
  "google-chrome": "󰊯",
  "google-chrome-stable": "󰊯",
  spotify: "󰓇",
  vlc: "󰕼",
  discord: "󰙯",
  slack: "󰒱",
  telegram: "󰔁",
  "telegram-desktop": "󰔁",
  zoom: "󰕧",
  mpv: "󰃽",
  rhythmbox: "󰠃",
  audacity: "󰗅",
  elisa: "󰝚",
  "org.gnome.music": "󰝚",
  "com.spotify.client": "󰓇",
  "com.discordapp.discord": "󰙯",
}

function streamNerdIcon(iconName: string): string {
  const key = iconName.toLowerCase()
  for (const [pattern, icon] of Object.entries(STREAM_ICONS)) {
    if (key.includes(pattern)) return icon
  }
  return "󰎵"
}

function nerdVolumeIcon(volume: number, muted: boolean): string {
  if (muted || volume < 0.01) return "󰝟"
  if (volume < 0.34) return "󰕿"
  if (volume < 0.67) return "󰖀"
  return "󰕾"
}

function SectionHeader({ label }: { label: string }) {
  return (
    <label
      xalign={0}
      label={label}
      cssClasses={["section-header"]}
      css="color: @accent_color; font-weight: bold; padding: 0 0 4px 0;"
    />
  )
}

export default function SoundWidget() {
  const wp = AstalWp.get_default()!
  const audio = wp.audio

  const speakers = createBinding(audio, "speakers")
  const microphones = createBinding(audio, "microphones")
  const streams = createBinding(audio, "streams")
  const defaultSpeaker = createBinding(audio, "defaultSpeaker")

  return (
    <menubutton>
      {/* Bar icon — nerd font only */}
      <With value={defaultSpeaker}>
        {(spk) => (
          <label
            css="font-family: 'JetBrainsMono Nerd Font'; font-size: 16px;"
            label={
              spk
                ? createBinding(
                    spk,
                    "volume",
                  )((v) => nerdVolumeIcon(v, spk.mute))
                : "󰝟"
            }
          />
        )}
      </With>

      {/* Popover */}
      <popover>
        <box
          orientation={Gtk.Orientation.VERTICAL}
          spacing={8}
          css="min-width: 300px; padding: 12px;"
        >
          {/* Applications — each For wrapped in its own box to anchor fragment position */}
          <SectionHeader label="Applications" />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
            <For each={streams}>
              {(stream) => (
                <box spacing={8} css="padding: 2px 0;">
                  <label
                    css="font-family: 'JetBrainsMono Nerd Font'; font-size: 16px; min-width: 20px;"
                    label={createBinding(
                      stream,
                      "icon",
                    )((icon) =>
                      streamNerdIcon(icon || stream.description || stream.name),
                    )}
                  />
                  <slider
                    hexpand
                    onChangeValue={({ value }) => stream.set_volume(value)}
                    value={createBinding(stream, "volume")}
                  />
                  <label
                    css="min-width: 36px;"
                    xalign={1}
                    label={createBinding(
                      stream,
                      "volume",
                    )((v) => `${Math.round(v * 100)}%`)}
                  />
                </box>
              )}
            </For>
          </box>

          <Gtk.Separator />

          {/* Playback Devices */}
          <SectionHeader label="Playback Devices" />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
            <For each={speakers}>
              {(sink) => (
                <button
                  onClicked={() => (sink.isDefault = true)}
                  css={createBinding(
                    sink,
                    "isDefault",
                  )((active) =>
                    active
                      ? "background: alpha(currentColor, 0.08);"
                      : "background: transparent;",
                  )}
                >
                  <box spacing={8}>
                    <image
                      iconName="audio-speakers-symbolic"
                      pixelSize={16}
                      css={createBinding(
                        sink,
                        "isDefault",
                      )((active) => (active ? "" : "opacity: 0.4;"))}
                    />
                    <label
                      hexpand
                      xalign={0}
                      label={createBinding(sink, "description")}
                    />
                  </box>
                </button>
              )}
            </For>
          </box>

          <Gtk.Separator />

          {/* Input Devices */}
          <SectionHeader label="Input Devices" />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
            <For each={microphones}>
              {(mic) => (
                <button
                  onClicked={() => (mic.isDefault = true)}
                  css={createBinding(
                    mic,
                    "isDefault",
                  )((active) =>
                    active
                      ? "background: alpha(currentColor, 0.08);"
                      : "background: transparent;",
                  )}
                >
                  <box spacing={8}>
                    <image
                      iconName="audio-input-microphone-symbolic"
                      pixelSize={16}
                      css={createBinding(
                        mic,
                        "isDefault",
                      )((active) => (active ? "" : "opacity: 0.4;"))}
                    />
                    <label
                      hexpand
                      xalign={0}
                      label={createBinding(mic, "description")}
                    />
                  </box>
                </button>
              )}
            </For>
          </box>
        </box>
      </popover>
    </menubutton>
  )
}
