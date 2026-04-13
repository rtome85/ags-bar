import { getThemeColors } from "./theme"

const { fg, accent } = getThemeColors()

export default `
menubutton > button {
  background: transparent;
  border: none;
  box-shadow: none;
}

menubutton > button:hover {
  background: alpha(currentColor, 0.08);
  border-radius: 999px;
}

scale trough {
  border-radius: 999px;
  background-color: alpha(currentColor, 0.15);
  min-height: 4px;
}

scale trough highlight {
  border-radius: 999px;
  background-color: ${fg};
}

label {
  color: ${fg};
}

.section-header {
  color: ${accent};
}

scale trough slider {
  border-radius: 999px;
  min-width: 14px;
  min-height: 14px;
  background-color: ${fg};
}
`
