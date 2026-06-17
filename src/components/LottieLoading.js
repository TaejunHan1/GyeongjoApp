import React from "react";
import { StyleSheet, Text, View } from "react-native";
import LottieView from "lottie-react-native";

const APP_LOADING_LOTTIE = require("../../assets/lottie/app-loading.json");

export default function LottieLoading({
  text = "불러오는 중...",
  size = 72,
  color = "#8B95A1",
  showText = true,
  horizontal = false,
  style,
  textStyle,
}) {
  return (
    <View style={[styles.container, horizontal && styles.horizontal, style]}>
      <LottieView
        source={APP_LOADING_LOTTIE}
        autoPlay
        loop
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
      {showText && (
        <Text
          style={[
            styles.text,
            horizontal && styles.horizontalText,
            { color },
            textStyle,
          ]}
        >
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  horizontal: {
    flexDirection: "row",
  },
  horizontalText: {
    marginTop: 0,
    marginLeft: 6,
  },
});
