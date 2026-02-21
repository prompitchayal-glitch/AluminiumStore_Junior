import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Keyboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../config";

export default function SummaryIncomeScreen() {
  const router = useRouter();
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [income, setIncome] = useState<number | null>(null);
  const [topProvince, setTopProvince] = useState<{ Province: string; JobCount: number } | null>(null);
  const [jobPopular, setJobPopular] = useState<{ JobType: string; JobCount: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncome = async () => {
    if (!month || !year) return;
    Keyboard.dismiss();
    const res = await fetch(
      `${API_URL}/income/month?month=${month}&year=${year}&_=${Date.now()}`
    );
    const data = await res.json();
    setIncome(data.TotalIncome);
  };

  const fetchTopProvince = async () => {
    const res = await fetch(
      `${API_URL}/top-province?month=${month}&year=${year}&_=${Date.now()}`
    );
    const data = await res.json();
    setTopProvince(data);
  };

  const fetchJobPopular = async () => {
    const res = await fetch(`${API_URL}/view/job-popular?_=${Date.now()}`);
    const data = await res.json();
    setJobPopular(data);
  };

  useEffect(() => {
    fetchJobPopular();
  }, []);

  // รีโหลดอัตโนมัติทุกครั้งที่กลับมาหน้านี้
  useFocusEffect(
  useCallback(() => {
    fetchJobPopular();
  }, [])
);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchJobPopular(),
      month && year ? fetchIncome() : Promise.resolve(),
      month && year ? fetchTopProvince() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [month, year]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>

        <Text style={styles.title}>รายได้รวมรายเดือน</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="เดือน (1-12)"
            keyboardType="numeric"
            placeholderTextColor="#aaa"
            value={month}
            onChangeText={setMonth}
          />
          <TextInput
            style={styles.input}
            placeholder="ปี (เช่น 2025)"
            keyboardType="numeric"
            placeholderTextColor="#aaa"
            value={year}
            onChangeText={setYear}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            await fetchIncome();
            await fetchTopProvince();
          }}
        >
          <Text style={styles.buttonText}>ดูรายได้</Text>
        </TouchableOpacity>

        {income !== null && (
          <View style={styles.dashboardCard}>
            <Text style={styles.dashboardLabel}>ยอดรวมทั้งหมด</Text>
            <Text style={styles.dashboardValue}>{income.toLocaleString()} บาท</Text>
          </View>
        )}

        {topProvince && (
          <View style={[styles.dashboardCard, { marginTop: 16, backgroundColor: "#fdf8e1" }]}>
            <Text style={[styles.dashboardLabel, { color: "#555" }]}>
              จังหวัดที่ทำงานมากที่สุดในเดือนนี้
            </Text>
            <Text style={[styles.dashboardValue, { color: "#FF9800", fontSize: 30 }]}>
              {topProvince.Province}
            </Text>
            <Text style={{ color: "#666", fontSize: 16 }}>
              จำนวนงานทั้งหมด: {topProvince.JobCount} งาน
            </Text>
          </View>
        )}

        <View style={[styles.dashboardCard, { marginTop: 30, backgroundColor: "#e8f5ff" }]}>
          <Text style={[styles.dashboardLabel, { color: "#005b96", fontSize: 20 }]}>
            ประเภทงานยอดนิยม
          </Text>

          {jobPopular.length > 0 ? (
            jobPopular.map((job, index) => (
              <View key={index} style={styles.popularRow}>
                <Text style={styles.jobTypeText}>{index + 1}. {job.JobType}</Text>
                <Text style={styles.jobCountText}>{job.JobCount} งาน</Text>
              </View>
            ))
          ) : (
            <Text style={{ color: "#777", marginTop: 8 }}>ไม่พบข้อมูลงานยอดนิยม</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb", padding: 20 },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backText: { fontSize: 16, marginLeft: 6, color: "#333" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    color: "#333",
  },
  inputContainer: { width: "100%", gap: 10, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  dashboardCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
    marginTop: 20,
  },
  dashboardLabel: { fontSize: 18, color: "#666", marginBottom: 10 },
  dashboardValue: { fontSize: 36, fontWeight: "bold", color: "#4CAF50" },
  popularRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 6,
  },
  jobTypeText: { fontSize: 16, color: "#333", fontWeight: "600" },
  jobCountText: { fontSize: 16, color: "#007ACC", fontWeight: "600" },
});
