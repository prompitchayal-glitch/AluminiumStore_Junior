import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native"; // เพิ่มการ import
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../config";

type JobRecord = {
  Job_id: string;
  Job_name: string;
  Employee_id: string;
  FirstName: string;
  LastName: string;
};

export default function JobOfEmployeeScreen() {
  const router = useRouter();
  const [data, setData] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetch(`${API_URL}/view/job-of-emp`)
        .then((res) => res.json())
        .then((d) => setData(d))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }, [])
  );

  // 🧠 Group by งาน
  const grouped = Object.values(
    data.reduce((acc: any, row) => {
      if (!acc[row.Job_id]) {
        acc[row.Job_id] = {
          Job_id: row.Job_id,
          Job_name: row.Job_name,
          employees: [],
        };
      }
      acc[row.Job_id].employees.push({
        id: row.Employee_id,
        name: `${row.FirstName} ${row.LastName}`,
      });
      return acc;
    }, {})
  );


  const fetchJobs = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${API_URL}/view/job-of-emp`);
    const data = await res.json();
    setData(data);
  } catch (err) {
    console.error(err);
    alert("เกิดข้อผิดพลาดในการโหลดข้อมูล");
  } finally {
    setLoading(false);
  }
};


  const addEmployeeToJob = async (jobId: string, empId: string) => {
  try {
    const res = await fetch(`${API_URL}/add/job-of-emp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Job_id: jobId, Employee_id: empId }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message); // 🔹 แสดง error จาก trigger
    } else {
      alert("เพิ่มพนักงานเรียบร้อย");
      // 🔹 อัปเดต list ของงาน-พนักงานใหม่
      fetchJobs();
    }

  } catch (err) {
    console.error(err);
    alert("เกิดข้อผิดพลาดในการติดต่อ server");
  }
};


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#555" />
        <Text style={{ marginTop: 10 }}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#ebe8e8ff", "#ebe8e8ff", "#ebe8e8ff"]} style={{ flex: 1 }}>
      {/* ปุ่มกลับ */}
      <View style={{ marginTop: 60, marginLeft: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>รายชื่อพนักงานในแต่ละงาน</Text>

        {grouped.map((job: any, idx) => (
          <LinearGradient
            key={idx}
            colors={["#cee0e0ff", "#ffffffff"]}
            style={styles.card}
          >
            <Text style={styles.jobTitle}>
              JobID: {job.Job_id} ชื่องาน: {job.Job_name}
            </Text>
            {job.employees.map((emp: any, i: number) => (
              <Text key={i} style={styles.empText}>
                EmpID: {emp.id} ชื่อ: {emp.name}
              </Text>
            ))}
          </LinearGradient>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 8,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 8,
  },
  empText: {
    fontSize: 15,
    color: "#444",
    marginLeft: 10,
  },
});
