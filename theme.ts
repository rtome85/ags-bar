import GLib from "gi://GLib"

const THEME_DIR = `${GLib.get_home_dir()}/.config/omarchy/current/theme`

function parseColorFromFile(filePath: string, colorName: string): string | null {
  try {
    const [ok, contents] = GLib.file_get_contents(filePath)
    if (!ok) return null
    const text = new TextDecoder().decode(contents as Uint8Array)

    // CSS format: @define-color foreground #hexcolor;
    const cssMatch = text.match(
      new RegExp(`@define-color\\s+${colorName}\\s+(#[0-9a-fA-F]{3,8}|[\\w(),.% ]+?)\\s*;`, "i"),
    )
    if (cssMatch) return cssMatch[1].trim()

    // TOML format: accent = "#hexcolor"
    const tomlMatch = text.match(new RegExp(`^${colorName}\\s*=\\s*["']?(#[0-9a-fA-F]{3,8})["']?`, "mi"))
    if (tomlMatch) return tomlMatch[1].trim()

    return null
  } catch {
    return null
  }
}

export function getThemeColors() {
  const fg = parseColorFromFile(`${THEME_DIR}/waybar.css`, "foreground") ?? "#cdd6f4"
  const bg = parseColorFromFile(`${THEME_DIR}/waybar.css`, "background") ?? "#1e1e2e"
  const accent = parseColorFromFile(`${THEME_DIR}/colors.toml`, "accent") ?? "#f5c2e7"
  return { fg, bg, accent }
}
