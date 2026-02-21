import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity } from "react-native";

interface CardButtonProps {
  title: string;
  subtitle?: string;
  icon?: ImageSourcePropType;
  colors?: string[];
  onPress: () => void;
}

export default function CardButton({
  title,
  subtitle,
  icon,
  colors = ["#6a11cb", "#2575fc"],
  onPress,
}: CardButtonProps) {
  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={colors as [string, string]} style={styles.card}>
        {icon && <Image source={icon} style={styles.icon} />}
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "46%",
    margin: "2%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  card: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    borderRadius: 16,
  },
  icon: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    color: "#f0f0f0",
    fontSize: 12,
    textAlign: "center",
  },
});
