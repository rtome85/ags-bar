import Gtk from "gi://Gtk?version=4.0"
import Pango from "gi://Pango"
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
      label={label.toUpperCase()}
      css="font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 12px 0 6px 0; opacity: 0.5;"
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
      {/* Bar icon */}
      <With value={defaultSpeaker}>
        {(spk) => (
          <label
            css="font-family: 'JetBrainsMono Nerd Font'; font-size: 16px;"
            label={
              spk
                ? createBinding(spk, "volume")((v) => nerdVolumeIcon(v, spk.mute))
                : "󰝟"
            }
          />
        )}
      </With>

      <popover>
        <box
          orientation={Gtk.Orientation.VERTICAL}
          css="min-width: 320px; padding: 4px 12px 12px;"
        >
          {/* Applications */}
          <SectionHeader label="Applications" />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2} css="margin-bottom: 8px;">
            <For each={streams}>
              {(stream) => (
                <box spacing={10} css="background: transparent; border-radius: 10px; padding: 7px 10px;">
                  {/* Fixed-width icon lane */}
                  <label
                    css="font-family: 'JetBrainsMono Nerd Font'; font-size: 16px; min-width: 22px;"
                    xalign={0.5}
                    label={createBinding(stream, "icon")((icon) =>
                      streamNerdIcon(icon || stream.description || stream.name),
                    )}
                  />
                  {/* App name */}
                  <label
                    xalign={0}
                    ellipsize={Pango.EllipsizeMode.END}
                    label={createBinding(stream, "description")((d) =>
                      d || stream.name || "Unknown",
                    )}
                    css="font-size: 13px; font-weight: 600; min-width: 80px;"
                  />
                  {/* Slider */}
                  <slider
                    hexpand
                    onChangeValue={({ value }) => stream.set_volume(value)}
                    value={createBinding(stream, "volume")}
                  />
                  {/* Fixed-width percentage */}
                  <label
                    xalign={1}
                    css="min-width: 36px; font-size: 12px; opacity: 0.5;"
                    label={createBinding(stream, "volume")((v) => `${Math.round(v * 100)}%`)}
                  />
                </box>
              )}
            </For>
          </box>

          <Gtk.Separator css="margin: 8px 0;" />

          {/* Playback Devices */}
          <SectionHeader label="Playback Devices" />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
            <For each={speakers}>
              {(sink) => (
                <button
                  onClicked={() => (sink.isDefault = true)}
                  css={createBinding(sink, "isDefault")((active) =>
                    active
                      ? "background: alpha(currentColor, 0.07); border-radius: 10px; padding: 7px 10px;"
                      : "background: transparent; border-radius: 10px; padding: 7px 10px;",
                  )}
                >
                  <box spacing={10}>
                    <image
                      iconName="audio-speakers-symbolic"
                      pixelSize={15}
                      css={createBinding(sink, "isDefault")((active) =>
                        active ? "" : "opacity: 0.35;",
                      )}
                    />
                    <label
                      hexpand
                      xalign={0}
                      ellipsize={Pango.EllipsizeMode.END}
                      label={createBinding(sink, "description")}
                      css="font-size: 13px;"
                    />
                    <image
                      iconName="object-select-symbolic"
                      pixelSize={13}
                      visible={createBinding(sink, "isDefault")}
                    />
                  </box>
                </button>
              )}
            </For>
          </box>

          {/* <Gtk.Separator css="margin: 8px 0;" /> */}

          {/* Input Devices */}
          <SectionHeader label="Input Devices" />
          <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
            <For each={microphones}>
              {(mic) => (
                <button
                  onClicked={() => (mic.isDefault = true)}
                  css={createBinding(mic, "isDefault")((active) =>
                    active
                      ? "background: alpha(currentColor, 0.07); border-radius: 10px; padding: 7px 10px;"
                      : "background: transparent; border-radius: 10px; padding: 7px 10px;",
                  )}
                >
                  <box spacing={10}>
                    <image
                      iconName="audio-input-microphone-symbolic"
                      pixelSize={15}
                      css={createBinding(mic, "isDefault")((active) =>
                        active ? "" : "opacity: 0.35;",
                      )}
                    />
                    <label
                      hexpand
                      xalign={0}
                      ellipsize={Pango.EllipsizeMode.END}
                      label={createBinding(mic, "description")}
                      css="font-size: 13px;"
                    />
                    <image
                      iconName="object-select-symbolic"
                      pixelSize={13}
                      visible={createBinding(mic, "isDefault")}
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
