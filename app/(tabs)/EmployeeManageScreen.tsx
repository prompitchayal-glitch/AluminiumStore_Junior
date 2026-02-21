import { Ionicons } from "@expo/vector-icons"; // เพิ่มไอคอน
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_URL } from "../../config";

type EmployeeRow = {
  Employee_id: string;
  FirstName: string;
  LastName: string;
  Phone: string;
  Email?: string;
  Street?: string;
  City?: string;
  Province?: string;
  PostalCode?: string;
  HireDate?: string;
};

type LateRow = {
  Employee_id: string;
  FirstName: string;
  LastName: string;
  LateDate: string;
  CheckIn?: string;
};

export default function EmployeeManageScreen() {
  const router = useRouter();

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [lateList, setLateList] = useState<LateRow[]>([]);
  const [loading, setLoading] = useState(true);

  // ฟอร์มเพิ่ม/แก้ไข
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);

  // Modal ดูพนักงานมาสาย
  const [lateVisible, setLateVisible] = useState(false);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [monthModal, setMonthModal] = useState(false);
  const [yearModal, setYearModal] = useState(false);

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  const years = [year - 1, year, year + 1];

  const [form, setForm] = useState<EmployeeRow>({
    Employee_id: "",
    FirstName: "",
    LastName: "",
    Phone: "",
    Email: "",
    Street: "",
    City: "",
    Province: "",
    PostalCode: "",
    HireDate: new Date().toISOString().slice(0, 10),
  });

  // โหลดพนักงานทั้งหมด
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/employees`);
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error("❌ fetchEmployees error:", err);
    } finally {
      setLoading(false);
    }
  };

  // โหลดพนักงานมาสาย
  const fetchLateEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/employee/late?month=${month}&year=${year}`);
      const data = await res.json();
      setLateList(data);
    } catch (err) {
      console.error("❌ fetchLateEmployees error:", err);
      setLateList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  // ✅ เรียกข้อมูลมาสายใหม่ทุกครั้งที่เดือนหรือปีเปลี่ยน
  useEffect(() => {
    if (lateVisible) fetchLateEmployees();
  }, [month, year, lateVisible]);

  // เปิด modal เพิ่ม
  const openModalForAdd = () => {
    setForm({
      Employee_id: "",
      FirstName: "",
      LastName: "",
      Phone: "",
      Email: "",
      Street: "",
      City: "",
      Province: "",
      PostalCode: "",
      HireDate: new Date().toISOString().slice(0, 10), // new Date() = เวลาปัจจุบัน | 
      // toISOString() = แปลงเป็นสตริงแบบ ISO (UTC) เช่น 2025-11-04T00:12:34.567Z  |
      //.slice(0, 10) = ตัดเอา 10 ตัวแรก ⇒ 2025-11-04
    });
    setEditingEmployee(null);
    setModalVisible(true);
  };

  // เปิด modal แก้ไข
  const openModalForEdit = (emp: EmployeeRow) => {
    setForm(emp);
    setEditingEmployee(emp);
    setModalVisible(true);
  };

  // เพิ่ม/แก้ไขข้อมูล
  const handleSave = async () => {
    const required = ["Employee_id", "FirstName", "LastName", "Phone", "Street", "City", "Province", "PostalCode"];
    for (let key of required) {
      if (!form[key as keyof EmployeeRow] || form[key as keyof EmployeeRow]?.trim() === "") {
        alert(`กรุณากรอก ${key} ให้ครบ`);
        return;
      }
    }

    try {
      const method = editingEmployee ? "PUT" : "POST";
      const url = editingEmployee
        ? `${API_URL}/sp/employees/update/${editingEmployee.Employee_id}`
        : `${API_URL}/sp/employees/add`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      fetchEmployees();
      setModalVisible(false);
    } catch (err) {
      console.error("❌ handleSave error:", err);
    }
  };

  // ลบพนักงาน
  const doDelete = async (id: string) => {
  try {
    const res = await fetch(
      `${API_URL}/sp/employees/delete/${encodeURIComponent(id.trim())}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      let msg = "";
      try {
        const j = await res.json();
        msg = j?.error || j?.detail || JSON.stringify(j);
      } catch {
        msg = await res.text();
      }
      throw new Error(msg || `HTTP ${res.status}`);
    }

    const j = await res.json(); // success: true, message, total, id
    await fetchEmployees();
    Alert.alert("สำเร็จ", `ลบพนักงานรหัส ${j?.id || id} เรียบร้อย`);
  } catch (err: any) {
    console.error("❌ handleDelete error:", err);
    Alert.alert("ผิดพลาด", String(err?.message || err));
  }
};


// ใช้ได้ทั้งเว็บและมือถือ: เว็บใช้ window.confirm, มือถือใช้ Alert.alert แล้ว resolve เป็น boolean
const confirmAsyncWebSafe = (title: string, message: string) => {
  const msg = `${title}\n\n${message}`;
  if (typeof globalThis !== "undefined" && typeof (globalThis as any).confirm === "function") {
    return Promise.resolve((globalThis as any).confirm(msg));
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "ยกเลิก", style: "cancel", onPress: () => resolve(false) },
        { text: "ลบ", style: "destructive", onPress: () => resolve(true) },
      ]
    );
  });
};


const handleDelete = async (id: string) => {
  const ok = await confirmAsyncWebSafe("ยืนยันการลบ", `ต้องการลบพนักงานรหัส ${id} ใช่หรือไม่`);
  if (ok) {
    await doDelete(id);
  }
};






  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* 🔙 ปุ่มย้อนกลับ */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}
>
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={styles.backText}></Text>
        </TouchableOpacity>
        <Text style={styles.header}> พนักงานทั้งหมด</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#635BFF" style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            data={employees}
            keyExtractor={(item) => item.Employee_id}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }) => (
  <View style={styles.card}>
    <View style={styles.nameRow}>
      <Text style={styles.empId}>{item.Employee_id}</Text>
      <Text style={styles.name}>{item.FirstName} {item.LastName}</Text>
    </View>

    <Text style={styles.sub}>โทร: {item.Phone}</Text>
    {item.Email && <Text style={styles.sub}>อีเมล: {item.Email}</Text>}
    <View style={styles.rowBtn}>
      <TouchableOpacity style={styles.editBtn} onPress={() => openModalForEdit(item)}>
        <Text style={styles.btnText}>แก้ไข</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.Employee_id)}>
        <Text style={styles.btnText}>ลบ</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

          />
        )}

        {/* ปุ่มเพิ่มพนักงาน */}
        <TouchableOpacity style={styles.fabAdd} onPress={openModalForAdd}>
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>

        {/* ปุ่มดูพนักงานมาสาย */}
        <TouchableOpacity style={styles.fabLate} onPress={() => { setLateVisible(true); fetchLateEmployees(); }}>
          <Text style={styles.fabText}>⏰</Text>
        </TouchableOpacity>

        <TouchableOpacity
  style={styles.scheduleBtn}
  onPress={() => router.push("./WorkScheduleScreen")}
>
  <Text style={styles.btnText}>⏰ บันทึกเวลา</Text>
</TouchableOpacity>


        {/* ---------------- Modal เพิ่ม / แก้ไข ---------------- */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingEmployee ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}</Text>

              {[
  { label: "รหัสพนักงาน เช่น (emp_01)", key: "Employee_id" },
  { label: "ชื่อ", key: "FirstName" },
  { label: "นามสกุล", key: "LastName" },
  { label: "เบอร์โทรศัพท์", key: "Phone" },
  { label: "อีเมล (ถ้ามี)", key: "Email" },
  { label: "ที่อยู่", key: "Street" },
  { label: "เมือง/อำเภอ", key: "City" },
  { label: "จังหวัด", key: "Province" },
  { label: "รหัสไปรษณีย์", key: "PostalCode" },
  { label: "วันที่เริ่มงาน (YYYY-MM-DD)", key: "HireDate" },
].map((f) => (
  <TextInput
    key={f.key}
    style={styles.input}
    placeholder={f.label}
    placeholderTextColor="#28285fff"     // ✅ เพิ่ม: สี placeholder น้ำเงินอ่อน
    value={(form as any)[f.key]}
    onChangeText={(text) => setForm({ ...form, [f.key]: text })}
  />
))}


              <View style={{ flexDirection: "row", marginTop: 12 }}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.btnText}>{editingEmployee ? "บันทึก" : "เพิ่ม"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>ยกเลิก</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ---------------- Modal ดูพนักงานมาสาย ---------------- */}
        <Modal visible={lateVisible} animationType="slide">
          <SafeAreaView style={styles.safe}>
            <View style={styles.container}>
              {/* ปุ่มปิด */}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setLateVisible(false)}>
                <Text style={styles.closeText}>❌</Text>
              </TouchableOpacity>

              <Text style={styles.header}>⏰ พนักงานมาสาย</Text>

              <View style={styles.row}>
                <TouchableOpacity style={styles.selector} onPress={() => setMonthModal(true)}>
                  <Text style={styles.label}>เดือน</Text>
                  <Text style={styles.value}>{months[month - 1]}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.selector} onPress={() => setYearModal(true)}>
                  <Text style={styles.label}>ปี</Text>
                  <Text style={styles.value}>{year}</Text>
                </TouchableOpacity>
              </View>

              {/* Modal เดือน */}
              <Modal visible={monthModal} transparent animationType="fade">
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>เลือกเดือน</Text>
                    {months.map((m, index) => (
                      <Pressable key={index} style={styles.modalItem} onPress={() => {
                        setMonth(index + 1);
                        setMonthModal(false);
                      }}>
                        <Text style={styles.modalText}>{m}</Text>
                      </Pressable>
                    ))}
                    <Pressable onPress={() => setMonthModal(false)}>
                      <Text style={styles.cancelText}>ปิด</Text>
                    </Pressable>
                  </View>
                </View>
              </Modal>

              {/* Modal ปี */}
              <Modal visible={yearModal} transparent animationType="fade">
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>เลือกปี</Text>
                    {years.map((y) => (
                      <Pressable key={y} style={styles.modalItem} onPress={() => {
                        setYear(y);
                        setYearModal(false);
                      }}>
                        <Text style={styles.modalText}>{y}</Text>
                      </Pressable>
                    ))}
                    <Pressable onPress={() => setYearModal(false)}>
                      <Text style={styles.cancelText}>ปิด</Text>
                    </Pressable>
                  </View>
                </View>
              </Modal>

              {loading ? (
                <ActivityIndicator size="large" color="#635BFF" style={{ marginTop: 30 }} />
              ) : (
                <FlatList
                  data={lateList}
                  keyExtractor={(_, i) => i.toString()}
                  contentContainerStyle={{ paddingVertical: 8 }}
                  renderItem={({ item }) => (
                    <View style={styles.card}>
                      <Text style={styles.name}>{item.FirstName} {item.LastName}</Text>
                      <Text style={styles.sub}>วันที่: {item.LateDate?.slice(0, 10)}</Text>
                      {item.CheckIn && <Text style={styles.sub}>เวลาเข้า: {item.CheckIn}</Text>}
                    </View>
                  )}
                  ListEmptyComponent={<Text style={styles.emptyText}>เดือนนี้ไม่มีคนมาสาย</Text>}
                />
              )}
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// ---------- STYLE ----------
const styles = StyleSheet.create({
  nameRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 2,
  flexWrap: "wrap",
},
empId: {
  backgroundColor: "#EEF2FF",
  color: "#333",
  borderRadius: 6,
  paddingVertical: 2,
  paddingHorizontal: 8,
  fontWeight: "800",
  marginRight: 8,
},

  safe: { flex: 1, backgroundColor: "#ebe8e8ff" },
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: "900", color: "#333", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: "700" },
  sub: { color: "#666", marginTop: 4 },
  rowBtn: { flexDirection: "row", marginTop: 10 },
  editBtn: { backgroundColor: "#ffbf00", padding: 8, borderRadius: 8, marginRight: 8 },
  deleteBtn: { backgroundColor: "#ff4d4d", padding: 8, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "700" },
  fabAdd: {
    position: "absolute", bottom: 16, right: 16, backgroundColor: "#000000ff",
    width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center"
  },
  fabLate: {
    position: "absolute", bottom: 16, right: 90, backgroundColor: "#FF7F50",
    width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center"
  },
  fabText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" },
  modalContent: { backgroundColor: "#fff", width: "90%", borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  modalItem: { paddingVertical: 10 },
  modalText: { textAlign: "center", fontSize: 16 },
  input: {
  borderWidth: 1,
  borderColor: "#07076cff",     //  น้ำเงินเข้มตามธีมคุณ
  borderRadius: 8,
  padding: 8,
  marginTop: 8,
  backgroundColor: "#fff",      //  พื้นหลังขาวตัดกับขอบน้ำเงิน
  color: "#07076cff",           //  ตัวอักษรในช่องน้ำเงินเข้ม
  fontWeight: "600",            //  ดูชัดขึ้น
},

  saveBtn: { backgroundColor: "#635BFF", padding: 10, borderRadius: 8, flex: 1, marginRight: 5, alignItems: "center" },
  cancelBtn: { backgroundColor: "#ccc", padding: 10, borderRadius: 8, flex: 1, marginLeft: 5, alignItems: "center" },
  cancelText: { color: "#333", fontWeight: "700" },
  closeBtn: { alignSelf: "flex-end", padding: 8, backgroundColor: "#eee", borderRadius: 20 },
  closeText: { fontSize: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  selector: {
    flex: 1, backgroundColor: "#fff", marginHorizontal: 5, padding: 12, borderRadius: 12,
    shadowColor: "#000", shadowOpacity: 0.05, elevation: 2
  },
  label: { fontSize: 13, color: "#777" },
  value: { fontSize: 16, fontWeight: "700", color: "#333", marginTop: 4 },
  emptyText: { textAlign: "center", color: "#888", fontSize: 15, marginTop: 30 },

  
  scheduleBtn: {
  backgroundColor: "#FF7F50",
  paddingVertical: 8,
  paddingHorizontal: 15, 
  borderRadius: 10,
  alignItems: "flex-start", // จัดเนื้อในปุ่มชิดซ้าย
  justifyContent: "center",
  marginTop: 10,
  alignSelf: "flex-start", 
},
backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  backText: {
    marginLeft: 6,
    fontSize: 17,
    color: "#333",
  },


});
