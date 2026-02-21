import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { API_URL } from "../../config";

export default function WorkScheduleScreen() {
  const router = useRouter();
  const [scheduleId, setScheduleId] = useState("");
  const [empId, setEmpId] = useState("");
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [checkInTime, setCheckInTime] = useState("");

  const handleSave = async () => {
    if (!scheduleId.trim() || !empId.trim() || !checkInTime.trim()) {
      Alert.alert("❌ ข้อมูลไม่ครบ", "กรุณากรอก Schedule ID, Employee ID และเวลาเข้างาน");
      return;
    }

    const timePattern = /^([0-1]?[0-9]|2[0-3])[:.]([0-5][0-9])$/;
    const match = checkInTime.match(timePattern);
    if (!match) {
      Alert.alert("❌ รูปแบบเวลาไม่ถูกต้อง", "กรุณากรอกเวลาเป็นรูปแบบ HH:mm หรือ H.mm เช่น 09:00 หรือ 9.05");
      return;
    }

    const hh = parseInt(match[1]);
    const mm = parseInt(match[2]);
    if (hh > 17 || (hh === 17 && mm >= 30)) {
      Alert.alert("❌ เวลาเข้างานผิด", "เวลาเข้างานต้องน้อยกว่า 17:30");
      return;
    }

    const datetimeObj = new Date(checkInDate);
    datetimeObj.setHours(hh, mm, 0, 0);
    const datetimePlus7 = new Date(datetimeObj.getTime() + 7 * 60 * 60 * 1000);

    const yyyy = datetimePlus7.getFullYear();
    const mmMonth = String(datetimePlus7.getMonth() + 1).padStart(2, "0");
    const dd = String(datetimePlus7.getDate()).padStart(2, "0");
    const hhStr = String(datetimePlus7.getHours()).padStart(2, "0");
    const mmStr = String(datetimePlus7.getMinutes()).padStart(2, "0");
    const datetime = `${yyyy}-${mmMonth}-${dd} ${hhStr}:${mmStr}:00`;

    const payload = { Schedule_id: scheduleId, Emp_id: empId, CheckIn: datetime };

    try {
      const res = await fetch(`${API_URL}/sp/work-schedule/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Alert.alert(
          "✅ บันทึกสำเร็จ",
          `เวลาเข้างาน: ${hh.toString().padStart(2, "0")}:${mm
            .toString()
            .padStart(2, "0")} (+7h เซิร์ฟเวอร์)`
        );
        setScheduleId("");
        setEmpId("");
        setCheckInTime("");
        setCheckInDate(new Date());
      } else {
        const err = await res.json();
        Alert.alert("❌ เกิดข้อผิดพลาด", err.error || "ไม่ทราบสาเหตุ");
      }
    } catch (error: any) {
      Alert.alert("❌ เกิดข้อผิดพลาด", error.message || "ไม่สามารถเชื่อมต่อ server");
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔙 ปุ่มย้อนกลับ */}
      <TouchableOpacity
  style={styles.backButton}
  onPress={() => router.push("/EmployeeManageScreen")}
>
  <Ionicons name="arrow-back" size={26} color="#333" />
  <Text style={styles.backText}>ย้อนกลับ</Text>
</TouchableOpacity>


      {/* 🕒 หัวข้อ */}
      <Text style={styles.title}> บันทึกเวลาเข้างาน</Text>

      {/* ฟอร์มข้อมูล */}
      <Text style={styles.label}>รหัสบันทึก (Schedule ID):</Text>
      <TextInput
        style={[styles.input]}
        placeholder="เช่น sch_20251017_01"
        placeholderTextColor="#666"
        value={scheduleId}
        onChangeText={setScheduleId}
      />

      <Text style={styles.label}>รหัสพนักงาน (Employee ID):</Text>
      <TextInput
        style={[styles.input]}
        placeholder="เช่น emp_01"
        placeholderTextColor="#666"
        value={empId}
        onChangeText={setEmpId}
      />

      <Text style={styles.label}>เลือกวันเข้างาน:</Text>

      {Platform.OS === "web" ? (
        <input
          type="date"
          style={styles.dateInputWeb}
          value={checkInDate.toISOString().slice(0, 10)}
          onChange={(e) => {
            const selectedDate = new Date(e.target.value);
            setCheckInDate(selectedDate);
          }}
        />
      ) : (
        <>
          <TouchableOpacity
            style={[styles.input, { backgroundColor: "#F0F0F0" }]}
            onPress={() => setDatePickerVisible(true)}
          >
            <Text style={{ color: "black" }}>
              {checkInDate.toLocaleDateString("sv-SE")}
            </Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            date={checkInDate}
            onConfirm={(date) => {
              const localDate = new Date(
                date.getTime() + date.getTimezoneOffset() * 60000
              );
              setDatePickerVisible(false);
              setCheckInDate(localDate);
            }}
            onCancel={() => setDatePickerVisible(false)}
          />
        </>
      )}

      <Text style={styles.label}>เวลาเข้างาน:</Text>
      <TextInput
        style={[styles.input]}
        placeholder="เช่น 9.00 หรือ 09:00"
        placeholderTextColor="#777"
        value={checkInTime}
        onChangeText={setCheckInTime}
        keyboardType="default"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* ปุ่มด้านล่าง */}
      <View style={styles.bottomBtns}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.btnText}> บันทึกเวลา</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.btnText}> ปิดหน้าบันทึก</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF", padding: 20 },

  // ✅ ปุ่มย้อนกลับ (ขยับลงมาและเว้นช่องจากหัวข้อ)
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,          // ✅ เพิ่มระยะจากขอบบน
    marginBottom: 15,       // ✅ เพิ่มช่องว่างก่อนหัวข้อ
  },
  backText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 6,
  },

  // ✅ หัวข้อหลัก
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#333",
    marginBottom: 20,
    paddingHorizontal: 5,
    textAlign: "left",
  },

  label: { fontWeight: "600", marginBottom: 5, marginLeft: 3 },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#F0F0F0",
    color: "black",
  },
  dateInputWeb: {
    width: "100%",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CCC",
    backgroundColor: "#F0F0F0",
    marginBottom: 15,
    fontSize: 16,
  },
  bottomBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  closeBtn: {
    flex: 1,
    backgroundColor: "#FF7F50",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#FFF", fontWeight: "600" },
});
