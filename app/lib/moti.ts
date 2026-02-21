// lib/moti.ts
import { Platform } from "react-native";

let MotiView: any;
let MotiText: any;

if (Platform.OS === "web") {
  const { View, Text } = require("react-native");
  MotiView = View;
  MotiText = Text;
} else {
  const moti = require("moti");
  MotiView = moti.MotiView;
  MotiText = moti.MotiText;
}

export { MotiText, MotiView };

