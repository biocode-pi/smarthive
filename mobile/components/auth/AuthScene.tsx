import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface AuthSceneProps {
  style?: ViewStyle;
  sky?: string;
  skyDeep?: string;
}

export function AuthScene({ style, sky = "#bfe2f6", skyDeep = "#7fc1e6" }: AuthSceneProps) {
  return (
    <View style={[styles.scene, { backgroundColor: sky }, style]} pointerEvents="none">
      <View style={[styles.skyTop, { backgroundColor: skyDeep }]} />

      <View style={[styles.cloud, styles.cloudA]} />
      <View style={[styles.cloud, styles.cloudB]} />
      <View style={[styles.cloud, styles.cloudC]} />

      <View style={styles.mountainBack} />
      <View style={styles.mountainFront} />

      <View style={styles.field} />

      <View style={[styles.tree, styles.treeA]}>
        <View style={[styles.treeTop, { backgroundColor: "#2f7d42" }]} />
        <View style={[styles.treeTop, styles.treeMid, { backgroundColor: "#357c45" }]} />
        <View style={styles.trunk} />
      </View>
      <View style={[styles.tree, styles.treeB]}>
        <View style={[styles.treeTop, { backgroundColor: "#28663a" }]} />
        <View style={styles.trunk} />
      </View>
      <View style={[styles.tree, styles.treeC]}>
        <View style={[styles.treeTop, { backgroundColor: "#2a6d3a", width: 80, height: 80 }]} />
        <View style={[styles.treeTop, styles.treeMid, { backgroundColor: "#357c45", width: 70, height: 70 }]} />
        <View style={styles.trunk} />
      </View>

      <View style={styles.bee}>
        <View style={styles.beeBody} />
        <View style={[styles.beeStripe, { left: 8 }]} />
        <View style={[styles.beeStripe, { left: 22 }]} />
        <View style={styles.beeWingL} />
        <View style={styles.beeWingR} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    overflow: "hidden",
    position: "relative",
  },
  skyTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%",
    opacity: 0.6,
  },
  cloud: {
    position: "absolute",
    backgroundColor: "#ffffff",
    opacity: 0.85,
    borderRadius: 999,
  },
  cloudA: { top: 24, left: 30, width: 90, height: 18 },
  cloudB: { top: 50, right: 40, width: 110, height: 20 },
  cloudC: { top: 90, left: 140, width: 70, height: 14 },
  mountainBack: {
    position: "absolute",
    bottom: "32%",
    left: -40,
    right: -40,
    height: 110,
    backgroundColor: "#6e9bb0",
    transform: [{ skewY: "-5deg" }],
    opacity: 0.85,
  },
  mountainFront: {
    position: "absolute",
    bottom: "30%",
    left: -60,
    right: -60,
    height: 80,
    backgroundColor: "#5e8da0",
    transform: [{ skewY: "4deg" }],
    opacity: 0.85,
  },
  field: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "32%",
    backgroundColor: "#5fa758",
  },
  tree: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  treeTop: {
    width: 60,
    height: 60,
    borderRadius: 999,
  },
  treeMid: {
    marginTop: -40,
  },
  trunk: {
    width: 8,
    height: 14,
    backgroundColor: "#5a3b1f",
  },
  treeA: { bottom: "24%", left: 18 },
  treeB: { bottom: "22%", left: 80 },
  treeC: { bottom: "26%", right: 30 },
  bee: {
    position: "absolute",
    top: "30%",
    left: "55%",
    width: 40,
    height: 24,
  },
  beeBody: {
    position: "absolute",
    left: 0,
    top: 4,
    width: 40,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#f6c43a",
  },
  beeStripe: {
    position: "absolute",
    top: 4,
    width: 6,
    height: 18,
    backgroundColor: "#1a1a1a",
    borderRadius: 2,
  },
  beeWingL: {
    position: "absolute",
    left: -8,
    top: -2,
    width: 22,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    opacity: 0.75,
  },
  beeWingR: {
    position: "absolute",
    right: -8,
    top: -2,
    width: 22,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    opacity: 0.75,
  },
});
