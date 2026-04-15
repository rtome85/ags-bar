import Gtk from "gi://Gtk?version=4.0"
import Pango from "gi://Pango"
import AstalWp from "gi://AstalWp"
import AstalMpris from "gi://AstalMpris"
import AstalApps from "gi://AstalApps"
import { createBinding, createComputed, createState, For, With } from "ags"

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

const ACTION_BTN =
  "background: transparent; border-radius: 6px; padding: 5px; min-width: 0; min-height: 0;"
const MEDIA_ACTION_BTN =
  "background: transparent; border-radius: 6px; padding: 3px; min-width: 0; min-height: 0;"

function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return ((index % length) + length) % length
}

function playerKey(player: AstalMpris.Player): string {
  const track = player.trackid || player.title || player.identity || player.entry
  return `${player.entry}:${track}`
}

function isPlayerProxy(player: AstalMpris.Player): boolean {
  const busName = player.busName || player.bus_name || ""
  const entry = player.entry || ""
  const identity = player.identity || ""

  return [busName, entry, identity].some((value) =>
    value.toLowerCase().includes("playerctld"),
  )
}

function uniquePlayers(players: Array<AstalMpris.Player>): Array<AstalMpris.Player> {
  const seen = new Set<string>()

  return players.filter((player) => {
    if (isPlayerProxy(player)) return false

    const key = playerKey(player)
    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

function setPlayback(player: AstalMpris.Player, shouldPlay: boolean) {
  if (!shouldPlay) {
    if (player.canPause) {
      player.pause()
    } else {
      player.play_pause()
    }
    return
  }

  if (player.canPlay) {
    player.play()
  } else {
    player.play_pause()
  }
  return true
}

function PlayerIcon({ player, apps }: { player: AstalMpris.Player; apps: AstalApps.Apps }) {
  const [app] = apps.exact_query(player.entry)

  return app?.iconName ? (
    <image iconName={app.iconName} pixelSize={15} />
  ) : (
    <image iconName="multimedia-player-symbolic" pixelSize={15} />
  )
}

function MprisPlayerCard({ player, apps }: { player: AstalMpris.Player; apps: AstalApps.Apps }) {
  const coverArt = createBinding(player, "coverArt")
  const title = createBinding(player, "title")
  const artist = createBinding(player, "artist")
  const identity = createBinding(player, "identity")
  const [localPlaying, setLocalPlaying] = createState(
    player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING,
  )

  function handlePlaybackToggle() {
    const nextPlaying = !localPlaying.get()
    setLocalPlaying(nextPlaying)
    setPlayback(player, nextPlaying)
  }

  return (
    <box
      spacing={10}
      widthRequest={296}
      css="background: alpha(currentColor, 0.04); border-radius: 10px; padding: 8px 10px;"
    >
      <box
        overflow={Gtk.Overflow.HIDDEN}
        widthRequest={64}
        heightRequest={64}
        css="border-radius: 8px; background: alpha(currentColor, 0.06); min-width: 64px; min-height: 64px;"
      >
        <image file={coverArt} pixelSize={64} visible={coverArt(Boolean)} />
        <image
          iconName="audio-x-generic-symbolic"
          pixelSize={24}
          visible={coverArt((art) => !art)}
          css="opacity: 0.45;"
        />
      </box>

      <box
        orientation={Gtk.Orientation.VERTICAL}
        widthRequest={120}
        valign={Gtk.Align.CENTER}
        spacing={4}
      >
        <box spacing={6}>
          <PlayerIcon player={player} apps={apps} />
          <label
            hexpand
            xalign={0}
            ellipsize={Pango.EllipsizeMode.END}
            widthChars={1}
            maxWidthChars={13}
            label={identity((name) => name || player.entry || "Media player")}
            css="font-size: 11px; font-weight: 700; opacity: 0.5;"
          />
        </box>
        <label
          xalign={0}
          ellipsize={Pango.EllipsizeMode.END}
          widthChars={1}
          maxWidthChars={15}
          label={title((value) => value || "Unknown track")}
          css="font-size: 13px; font-weight: 700;"
        />
        <label
          xalign={0}
          ellipsize={Pango.EllipsizeMode.END}
          widthChars={1}
          maxWidthChars={15}
          label={artist((value) => value || "Unknown artist")}
          css="font-size: 11px; opacity: 0.5;"
        />
      </box>

      <box
        valign={Gtk.Align.CENTER}
        halign={Gtk.Align.END}
        widthRequest={62}
        spacing={1}
      >
        <button
          onClicked={() => player.previous()}
          visible={createBinding(player, "canGoPrevious")}
          tooltipText="Previous track"
          css={MEDIA_ACTION_BTN}
        >
          <image iconName="media-skip-backward-symbolic" pixelSize={12} />
        </button>
        <button
          onClicked={handlePlaybackToggle}
          visible={createBinding(player, "canControl")}
          tooltipText="Play or pause"
          css={MEDIA_ACTION_BTN}
        >
          <image
            iconName={localPlaying((playing) =>
              playing
                ? "media-playback-pause-symbolic"
                : "media-playback-start-symbolic"
            )}
            pixelSize={13}
          />
        </button>
        <button
          onClicked={() => player.next()}
          visible={createBinding(player, "canGoNext")}
          tooltipText="Next track"
          css={MEDIA_ACTION_BTN}
        >
          <image iconName="media-skip-forward-symbolic" pixelSize={12} />
        </button>
      </box>
    </box>
  )
}

function MprisPanel() {
  const mpris = AstalMpris.get_default()
  const apps = new AstalApps.Apps()
  const players = createBinding(mpris, "players")
  const visiblePlayers = createComputed(() => uniquePlayers(players()))
  const [index, setIndex] = createState(0)

  const currentPlayer = createComputed(() => {
    const list = visiblePlayers()
    if (list.length === 0) return null
    return list[wrapIndex(index(), list.length)]
  })

  function move(direction: -1 | 1) {
    const length = visiblePlayers.get().length
    if (length <= 1) return
    setIndex((current) => wrapIndex(current + direction, length))
  }

  return (
    <box orientation={Gtk.Orientation.VERTICAL} visible={visiblePlayers((list) => list.length > 0)}>
      <box spacing={8}>
        <SectionHeader label="Media" />
        <box hexpand />
        <button
          onClicked={() => move(-1)}
          sensitive={visiblePlayers((list) => list.length > 1)}
          tooltipText="Previous player"
          valign={Gtk.Align.CENTER}
          css={ACTION_BTN}
        >
          <image iconName="go-previous-symbolic" pixelSize={13} />
        </button>
        <label
          visible={visiblePlayers((list) => list.length > 1)}
          label={createComputed(() => {
            const list = visiblePlayers()
            if (list.length <= 1) return ""
            return `${wrapIndex(index(), list.length) + 1}/${list.length}`
          })}
          valign={Gtk.Align.CENTER}
          css="font-size: 11px; font-weight: 700; opacity: 0.5;"
        />
        <button
          onClicked={() => move(1)}
          sensitive={visiblePlayers((list) => list.length > 1)}
          tooltipText="Next player"
          valign={Gtk.Align.CENTER}
          css={ACTION_BTN}
        >
          <image iconName="go-next-symbolic" pixelSize={13} />
        </button>
      </box>

      <With value={currentPlayer}>
        {(player) => player && <MprisPlayerCard player={player} apps={apps} />}
      </With>
    </box>
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
          widthRequest={320}
          css="min-width: 320px; max-width: 320px; padding: 4px 12px 12px;"
        >
          <MprisPanel />

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
