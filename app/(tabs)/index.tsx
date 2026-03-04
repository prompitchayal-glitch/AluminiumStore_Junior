import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Href, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ColorValue,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import 'react-native-gesture-handler';
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../config"; // ใช้ config เดิม
import { MotiText, MotiView } from "../lib/moti";

type MenuItem = {
  title: string;
  subtitle: string;
  icon: any;
  colors: readonly [ColorValue, ColorValue];
  path: Href;
  iconSize?: number; 
};

// ใช้สำหรับเก็บสถานะว่ามีการ Login ในเซสชั่นปัจจุบันแล้วหรือยัง (เมื่อเริ่มต้นแอปจะเป็น false)
let sessionLoggedIn = false;

export default function Index() {
  const router = useRouter();
  const [booting, setBooting] = useState(true);
  const [loggedIn, setLoggedIn] = useState(sessionLoggedIn);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  //  เปิดแอปให้ไปหน้า Login ก่อนเสมอ
  useEffect(() => {
    (async () => {
      // ตรวจสอบจาก memory แทน AsyncStorage เพื่อให้ต้อง Login ใหม่ทุกครั้งที่ปิดและเปิดแอปใหม่ (เซสชั่นใหม่)
      if (!sessionLoggedIn) {
        setLoggedIn(false);
      } else {
        setLoggedIn(true);
      }
      setBooting(false);
    })();
  }, []);



  const menuItems: MenuItem[] = [
    {
      title: "ข้อมูลลูกค้า",
      subtitle: "เพิ่ม/แก้ไข/ลบ และดูรายชื่อทั้งหมด",
      icon: require("../../assets/cus.png"),
      colors: ["#8094b3ff", "#85bde2ff"],
      path: "/(tabs)/CustomerScreen",
      iconSize: 55,
    },
    {
      title: "พนักงาน",
      subtitle: "จัดการข้อมูลพนักงาน สาย ขาด ลา",
      icon: require("../../assets/emp.png"),
      colors: ["#8094b3ff", "#85bde2ff"],
      path: "/(tabs)/EmployeeManageScreen",
      iconSize: 80,
    },
    {
      title: "รายละเอียดงาน",
      subtitle: "ดูรายการงาน และอะไหล่ในแต่ละงาน",
      icon: require("../../assets/job.png"),
      colors: ["#8094b3ff", "#85bde2ff"],
      path: "/(tabs)/JobListScreen",
      iconSize: 55,
    },
    {
      title: "รายได้",
      subtitle: "ดูรายได้ประจำเดือน / จังหวัด / ประเภทงาน",
      icon: require("../../assets/summary.png"),
      colors: ["#8094b3ff", "#85bde2ff"],
      path: "/(tabs)/summary_income_Province_Typejob",
      iconSize: 55,
    },
    {
  title: "พนักงานในแต่ละงาน",
  subtitle: "ดูรายชื่อพนักงานที่รับผิดชอบแต่ละงาน",
  icon: require("../../assets/emp_of_job.png"), // ใส่ไอคอนของคุณเอง
  colors: ["#8094b3ff", "#85bde2ff"],
  path: "/(tabs)/JobOfEmployeeScreen",
  iconSize: 55,
},

  ];

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }
    try {
      setLoadingLogin(true);
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data?.success) {
        // อัปเดตสถานะใน Memory
        sessionLoggedIn = true;
        setLoggedIn(true);
        setUsername("");
        setPassword("");
      } else {
        Alert.alert("ล็อกอินไม่สำเร็จ ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", data?.message || "กรุณาตรวจสอบข้อมูลอีกครั้ง");
      }
    } catch (e) {
      Alert.alert("Error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = async () => {
    // ล้างทั้ง Memory และ AsyncStorage (ถ้ามี)
    sessionLoggedIn = false;
    await AsyncStorage.removeItem("loggedIn");
    setLoggedIn(false);
    router.replace("/"); // เด้งกลับหน้า Login
  };



  if (booting) {
    return (
      <View style={[stylesFull.center, { backgroundColor: "#f0f4f8", flex: 1 }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* ==========================================================
     ✅ ส่วน LOGIN ใหม่ (เพิ่มลูกเล่น เคลื่อนไหว แสงเงา ฟองลอย)
     ========================================================== */
  if (!loggedIn) {
    return (
      <LinearGradient
        colors={["#b6b6b6ff", "#ffffffff"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        {/* เอฟเฟกต์ฟองลอย */}
        <MotiView
          from={{ translateY: 20, opacity: 0 }}
          animate={{ translateY: -20, opacity: 1 }}
          transition={{
            loop: true,
            type: "timing",
            duration: 3000,
          }}
          style={{
            position: "absolute",
            top: 100,
            left: 50,
            width: 80,
            height: 80,
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: 40,
          }}
        />
        <MotiView
          from={{ translateY: 30, opacity: 0 }}
          animate={{ translateY: -10, opacity: 1 }}
          transition={{
            loop: true,
            type: "timing",
            duration: 4000,
          }}
          style={{
            position: "absolute",
            bottom: 150,
            right: 50,
            width: 100,
            height: 100,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 50,
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ width: "100%", alignItems: "center" }}
        >
          <MotiText
            from={{ opacity: 0, translateY: -40 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", delay: 400 }}
            style={stylesLogin.title}
          >
             CEO Login 
          </MotiText>

          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 800 }}
            style={stylesLogin.loginCard}
          >
            <LinearGradient
              colors={["#ffffffdd", "#f7f7ffcc"]}
              style={stylesLogin.cardGradient}
            >
              <MotiView
                from={{ translateY: 20, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                transition={{ delay: 1000 }}
              >
                <TextInput
                  placeholder="Username"
                  style={stylesLogin.input}
                  placeholderTextColor="#888"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </MotiView>

              <MotiView
                from={{ translateY: 20, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                transition={{ delay: 1200 }}
              >
                <TextInput
                  placeholder="Password"
                  style={stylesLogin.input}
                  secureTextEntry
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                />
              </MotiView>

              <MotiView
                from={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1500, type: "spring" }}
              >
                <TouchableOpacity
                  style={stylesLogin.button}
                  onPress={handleLogin}
                  disabled={loadingLogin}
                >
                  <LinearGradient
                    colors={["#6a11cb", "#2575fc"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={stylesLogin.buttonInner}
                  >
                    <Text style={stylesLogin.buttonText}>
                      {loadingLogin ? "Loading..." : "LOGIN"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </MotiView>
            </LinearGradient>
          </MotiView>

          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2500 }}
            style={{
              marginTop: 30,
              color: "#726f6fff",
              fontSize: 14,
              fontWeight: "300",
            }}
          >
            © 2025 Aluminium .
          </MotiText>
        </KeyboardAvoidingView>
      </LinearGradient>
    );
  }

  /* ==========================================================
     ✅ ส่วน Dashboard เดิม (ไม่แตะต้อง)
     ========================================================== */
  return (
    <LinearGradient colors={["#ebe8e8ff", "#ebe8e8ff", "#ebe8e8ff"]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.header}> Management Aluminuim</Text>
        </View>

        <Text style={styles.sub}>ภาพรวมทั้งหมด</Text>

        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={() => router.push(item.path as Href)}
              style={styles.cardWrapper}
            >
              <MotiView
                from={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.15, type: "spring" }}
              >
                <LinearGradient
                  colors={item.colors}
                  style={styles.card}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image
                    source={item.icon}
                    style={[styles.icon, { width: item.iconSize, height: item.iconSize }]}
                  />
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSub}>{item.subtitle}</Text>
                </LinearGradient>
              </MotiView>
            </TouchableOpacity>
          ))}
        </View>

        {/* ✅ ปุ่มออกจากระบบ ขวาล่าง */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtnBottom}>
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ======= styles ======= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  headerRow: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: "900",
    color: "#222",
    textAlign: "center",
  },
  sub: {
    fontSize: 15,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    width: 50,
    height: 50,
    resizeMode: "contain",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    color: "#f0f0f0",
    textAlign: "center",
  },

  logoutBtnBottom: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#ff4d4d",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    elevation: 6,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});

/* ✅ สไตล์เฉพาะส่วน LOGIN (เพิ่ม animation, glow, motion) */
const stylesLogin = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    marginBottom: 40,
  },
  loginCard: {
    width: "85%",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  input: {
    width: 250,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  button: {
    width: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 20,
  },
  buttonInner: {
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});

const stylesFull = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});
