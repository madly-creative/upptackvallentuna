import "./styles/main.css";
import "./styles/theme.css";
import "./js/app.js";
import { initPwa } from "./lib/pwa.js";
import { mountPaletteSwitch } from "./lib/paletteSwitch.js";

initPwa();
mountPaletteSwitch();
