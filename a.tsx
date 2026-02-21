import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "./config";

type JobType = {
  Job_id: string;
  Job_name: string;
  FirstName: string;
  LastName: string;
  Start_date: string;
  Install_date: string;
  Price_Job: number;
  Install: string;
  Install_price: number;
  Sumtotal_price: number;
  describe: string;
};

type MaterialType = {
  Material_id: string;
  Name: string;
  Model: string;
  Color: string;
  Thickness: string;
  Type_No: string;
  Price: number;
  qty_material: number;
};

export default function JobListScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [materials, setMaterials] = useState<MaterialType[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobType | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [allMaterials, setAllMaterials] = useState<MaterialType[]>([]);
  const [oldMaterial, setOldMaterial] = useState<MaterialType | null>(null);
  const [selectedNewMaterial, setSelectedNewMaterial] = useState<MaterialType | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [newQty, setNewQty] = useState<number>(1);

  // สำหรับเพิ่มงาน
  const [addJobModalVisible, setAddJobModalVisible] = useState(false);
  const [jobForm, setJobForm] = useState({
    Job_id: "",
    Customer_id: "",
    Job_name: "",
    Install: "No",
    Install_price: "0",
    Start_date: "",
    Install_date: "",
    describe: ""
  });

  useEffect(() => {
  fetchJobs();

  // ✅ โหลดข้อมูลอะไหล่ทั้งหมดตอนเปิดแอป
  const loadAllMaterials = async () => {
    try {
      const res = await fetch(`${API_URL}/materials`);
      const data = await res.json();
      setAllMaterials(data);
      console.log("โหลดอะไหล่ทั้งหมดแล้ว:", data.length, "รายการ");
    } catch (err) {
      console.error("โหลดอะไหล่ทั้งหมดไม่สำเร็จ:", err);
    }
  };

  loadAllMaterials();
}, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/view/job`);
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMaterials = async (jobId: string) => {
    try {
      const res = await fetch(`${API_URL}/view/job-material/${jobId}`);
      const data = await res.json();
      setMaterials(data);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------- Job Modal ----------------------
  const openModal = (job: JobType) => {
    setSelectedJob(job);
    setCurrentJobId(job.Job_id);
    fetchMaterials(job.Job_id);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setMaterials([]);
    setSelectedJob(null);
  };

  // ---------------------- Delete Job ----------------------
  const handleDeleteJob = (jobId: string) => {
    Alert.alert(
      "ยืนยันการลบ",
      `คุณต้องการลบงาน ${jobId} ใช่หรือไม่? `,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/sp/job-material/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Job_id: jobId, Material_id: null }),
              });

              if (res.ok) {
                Alert.alert("สำเร็จ", `ลบงาน ${jobId} พร้อมอะไหล่ทั้งหมดเรียบร้อย`);
                fetchJobs(); // รีเฟรชรายการงาน
                // ถ้ามากำลังเปิด modal ของงานเดียวกัน ให้ปิดและเคลียร์
                if (currentJobId === jobId) {
                  setModalVisible(false);
                  setMaterials([]);
                  setSelectedJob(null);
                }
              } else {
                const data = await res.json().catch(() => ({}));
                Alert.alert("เกิดข้อผิดพลาด", data.error || "ไม่สามารถลบงานได้");
              }
            } catch (err) {
              console.error(err);
              Alert.alert("เกิดข้อผิดพลาด", "เกิดข้อผิดพลาดขณะลบงาน");
            }
          },
        },
      ]
    );
  };

  // ---------------------- Delete Material ----------------------
  const handleDeleteMaterial = (materialId: string) => {
    if (!currentJobId) return;

    Alert.alert(
      "ยืนยันการลบ",
      `คุณต้องการลบอะไหล่ ${materialId} ใช่หรือไม่?`,
      [
        { text: "ยกเลิก", style: "cancel" },
        {
          text: "ลบ",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/sp/job-material/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Job_id: currentJobId, Material_id: materialId }),
              });

              if (res.ok) {
                Alert.alert("สำเร็จ", `ลบอะไหล่ ${materialId} เรียบร้อยแล้ว`);
                // รีเฟรชรายการอะไหล่ และข้อมูลงาน (เช่นราคาสรุป)
                fetchMaterials(currentJobId);
                fetchJobs();
              } else {
                const data = await res.json().catch(() => ({}));
                Alert.alert("เกิดข้อผิดพลาด", data.error || "ไม่สามารถลบอะไหล่ได้");
              }
            } catch (err) {
              console.error(err);
              Alert.alert("เกิดข้อผิดพลาด", "เกิดข้อผิดพลาดขณะลบอะไหล่");
            }
          },
        },
      ]
    );
  };

  // ---------------------- Edit Material ----------------------
const openEditModal = async (mat: MaterialType) => {
  // ✅ ปิด modal หลักก่อน เพื่อไม่ให้ซ้อนกัน
  setModalVisible(false);

  // ✅ ตั้งค่าข้อมูลอะไหล่เก่า
  setOldMaterial(mat);
  setSelectedNewMaterial(mat);

  try {
    const res = await fetch(`${API_URL}/materials`);
    const data = await res.json();
    setAllMaterials(data);
  } catch (err) {
    console.error(err);
  }

  // ✅ เปิด modal แก้ไขหลังจากโหลดข้อมูลเสร็จ
  setTimeout(() => {
    setEditModalVisible(true);
  }, 300); // หน่วงนิดหน่อยให้ Modal หลักปิดก่อน
};


  const handleSaveMaterial = async () => {
    if (!currentJobId || !oldMaterial || !selectedNewMaterial) {
      Alert.alert("แจ้งเตือน", "กรุณาเลือกอะไหล่ให้ครบก่อนบันทึก");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/sp/job-material/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Job_id: currentJobId,
          Old_Material_id: oldMaterial.Material_id,
          New_Material_id: selectedNewMaterial.Material_id,
          qty_material: newQty,
        }),
      });

      if (res.ok) {
        Alert.alert("สำเร็จ", "แก้ไขอะไหล่เรียบร้อยแล้ว");
        setEditModalVisible(false);
        fetchMaterials(currentJobId);
        fetchJobs();
      } else {
        Alert.alert("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกการแก้ไขได้");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------- Add Job ----------------------
  const handleAddJob = async () => {
    try {
      const res = await fetch(`${API_URL}/sp/job/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Job_id: jobForm.Job_id,
          Customer_id: jobForm.Customer_id,
          Job_name: jobForm.Job_name,
          Install: jobForm.Install,
          Install_price: parseFloat(jobForm.Install_price),
          Start_date: jobForm.Start_date,
          Install_date: jobForm.Install_date,
          describe: jobForm.describe
        }),
      });

      if (res.ok) {
        Alert.alert("สำเร็จ", "เพิ่มงานเรียบร้อยแล้ว");
        setAddJobModalVisible(false);
        setJobForm({
          Job_id: "",
          Customer_id: "",
          Job_name: "",
          Install: "No",
          Install_price: "0",
          Start_date: "",
          Install_date: "",
          describe: "",
        });
        fetchJobs();
        
      } else {
        const data = await res.json();
        Alert.alert("เกิดข้อผิดพลาด", data.error || "ไม่สามารถเพิ่มงานได้");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------------- Add Material ----------------------
  const handleAddMaterial = async () => {
    if (!currentJobId || !selectedNewMaterial) {
      Alert.alert("แจ้งเตือน", "กรุณาเลือกอะไหล่ก่อนบันทึก");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/sp/job-material/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Job_id: currentJobId,
          Material_id: selectedNewMaterial.Material_id,
          qty_material: newQty,
        }),
      });

      if (res.ok) {
        Alert.alert("สำเร็จ", "เพิ่มอะไหล่เรียบร้อยแล้ว");
        fetchMaterials(currentJobId);
        fetchJobs(); // อัปเดตราคาในหน้าหลัก
      } else {
        const data = await res.json();
        Alert.alert("เกิดข้อผิดพลาด", data.error || "ไม่สามารถเพิ่มอะไหล่ได้");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: Platform.OS === "ios" ? 18 : 12,
      }}
    >
      <View style={{ flex: 1, paddingHorizontal: 16 }}>

  {/* 🔹 FlatList แสดงงาน */}


  {/* ✅ ปุ่มย้อนกลับ (อยู่นอก FlatList ด้านบนสุด) */}
<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← กลับ</Text>
        </TouchableOpacity>

  <FlatList
  data={jobs}
  keyExtractor={(item) => item.Job_id}
  renderItem={({ item }) => (

    <View style={styles.card}>
    
      {/* ✅ ชื่อ + รหัสงาน (อยู่บรรทัดเดียวกัน) */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={[styles.title, { fontWeight: "bold", flex: 1 }]}>{item.Job_name}</Text>
        <Text style={[styles.title, { fontWeight: "bold" }]}>รหัสงาน: {item.Job_id}</Text>
      </View>

      <Text>
        ลูกค้า: {item.FirstName} {item.LastName}
      </Text>
      <Text>ราคารวม: {item.Sumtotal_price} บาท</Text>
      <Text>เริ่มงาน: {item.Start_date?.slice(0, 10)}</Text>
      <Text>สถานะติดตั้ง: {item.Install} ค่าติดตั้ง: {item.Install_price}</Text>


      {/* ✅ ปุ่มคู่แนวนอน ดูรายละเอียด + ลบงาน */}
      <View style={{ flexDirection: "row", marginTop: 10 }}>
  <TouchableOpacity
    style={[styles.detailBtn, { flex: 1, marginRight: 5, height: 50, borderRadius: 25, justifyContent: "center", paddingVertical: 0 }]}
    onPress={() => openModal(item)}
  >
    <Text style={{ color: "#fff", textAlign: "center", fontSize: 16, lineHeight: 50 }}>ดูรายละเอียดอะไหล่</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.closeBtn, { flex: 1, marginLeft: 5, height: 50, borderRadius: 25, justifyContent: "center", paddingVertical: 0 }]}
    onPress={() => handleDeleteJob(item.Job_id)}
  >
    <Text style={{ color: "#fff", textAlign: "center", fontSize: 16, lineHeight: 50 }}>ลบงาน</Text>
  </TouchableOpacity>
</View>

    </View>
  )}
/>


  {/* ✅ ปุ่มเพิ่มงานใหม่แบบลอย */}
  <TouchableOpacity
    style={styles.floatingAddBtn}
    onPress={() => setAddJobModalVisible(true)}
  >
    <Text style={{ color: "#fff", fontSize: 26 }}>＋</Text>
  </TouchableOpacity>
</View>


      {/* ---------------------- Add Job Modal ---------------------- */}
      <Modal visible={addJobModalVisible} animationType="slide">
        <SafeAreaView
          style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}
        >
          <ScrollView contentContainerStyle={{ paddingTop: 28 }}>
            <Text style={[styles.header, { textAlign: "center" }]}>เพิ่มงานใหม่</Text>

            <TextInput
              style={styles.input}
              placeholder="Job_id"
              placeholderTextColor="#555"
              value={jobForm.Job_id}
              onChangeText={(t) => setJobForm((s) => ({ ...s, Job_id: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Customer_id"
              placeholderTextColor="#555"
              value={jobForm.Customer_id}
              onChangeText={(t) => setJobForm((s) => ({ ...s, Customer_id: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Job_name"
              placeholderTextColor="#555"
              value={jobForm.Job_name}
              onChangeText={(t) => setJobForm((s) => ({ ...s, Job_name: t }))}
            />

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
              <TouchableOpacity
                style={[
                  styles.smallBtn,
                  jobForm.Install === "yes" ? { backgroundColor: "#4CAF50" } : {},
                ]}
                onPress={() => setJobForm((s) => ({ ...s, Install: "yes" }))}
              >
                <Text style={{ color: "#fff" }}>Install = yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.smallBtn,
                  jobForm.Install === "no" ? { backgroundColor: "#FF5722" } : {},
                ]}
                onPress={() => setJobForm((s) => ({ ...s, Install: "no", Install_price: "0" }))}
              >
                <Text style={{ color: "#fff" }}>Install = no</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Install_price"
              keyboardType="numeric"
              placeholderTextColor="#555"
              value={jobForm.Install_price}
              onChangeText={(t) => setJobForm((s) => ({ ...s, Install_price: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Start_date (YYYY-MM-DD)"
              placeholderTextColor="#555"
              value={jobForm.Start_date}
              onChangeText={(t) => setJobForm((s) => ({ ...s, Start_date: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Install_date (YYYY-MM-DD)"
              placeholderTextColor="#555"
              value={jobForm.Install_date}
              onChangeText={(t) => setJobForm((s) => ({ ...s, Install_date: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="รายละเอียดงาน (เช่น Fix2 Slide1 MR.john)"
              placeholderTextColor="#555"
              value={jobForm.describe}
              onChangeText={(t) => setJobForm((s) => ({ ...s, describe: t }))}
/>


            {/* ปุ่มบันทึกงาน + ยกเลิก แบบ 50/50 */}
            <View style={styles.row50}>
              <TouchableOpacity
                style={[styles.saveBtn, { flex: 1, marginRight: 8 }]}
                onPress={handleAddJob}
              >
                <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>
                  บันทึกงาน
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.closeBtn, { flex: 1, marginLeft: 8 }]}
                onPress={() => setAddJobModalVisible(false)}
              >
                <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>
                  ยกเลิก
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ---------------------- Materials Modal ---------------------- */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={{ flex: 1, padding: 16 }}>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <Text style={{ color: "#fff" }}>ปิดหน้าต่าง</Text>
            </TouchableOpacity>

            <ScrollView style={{ marginTop: 16 }}>
              <Text style={[styles.header, { marginTop: 8 }]}>รายละเอียดอะไหล่: {selectedJob?.Job_name}</Text>
              {materials.map((mat) => (
                <View key={mat.Material_id} style={styles.materialCard}>
                  <Text>รหัสอะไหล่: {mat.Material_id}</Text>
                  <Text>ชื่ออะไหล่: {mat.Name}</Text>
                  <Text>Model: {mat.Model}</Text>
                  <Text>Color: {mat.Color}</Text>
                  <Text>Thickness: {mat.Thickness}</Text>
                  <Text>Type No: {mat.Type_No}</Text>
                  <Text>ราคา: {mat.Price}</Text>
                  <Text>จำนวนที่ใช้: {mat.qty_material}</Text>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(mat)}>
                    <Text style={{ color: "#fff" }}>แก้ไขอะไหล่</Text>
                  </TouchableOpacity>

                  {/* ปุ่มลบอะไหล่ (เพิ่มใหม่) */}
                  <TouchableOpacity
                    style={[styles.closeBtn, { marginTop: 8, alignSelf: "flex-end" }]}
                    onPress={() => handleDeleteMaterial(mat.Material_id)}
                  >
                    <Text style={{ color: "#fff" }}>ลบอะไหล่</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* เพิ่มอะไหล่ใหม่ ลงในงาน */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: "bold", marginBottom: 8 }}>เพิ่มอะไหล่ใหม่</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {allMaterials.map((m) => (
                    <TouchableOpacity
                      key={m.Material_id}
                      style={[
                        styles.materialSmall,
                        selectedNewMaterial?.Material_id === m.Material_id && {
                          borderColor: "#4CAF50",
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => setSelectedNewMaterial(m)}
                    >
                      <Text>{m.Name}</Text>
                      <Text style={{ fontSize: 12 }}>Model: {m.Model}</Text>
                      <Text style={{ fontSize: 12 }}>Color: {m.Color}</Text>
                      <Text style={{ fontSize: 12 }}>Thickness: {m.Thickness}</Text>
                      <Text style={{ fontSize: 12 }}>Type_No: {m.Type_No}</Text>
                      <Text style={{ fontSize: 12 }}>ราคา: {m.Price} ฿</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={{ marginTop: 8 }}>
                  <Text>จำนวน:</Text>
                  <TextInput
                    style={[styles.input, { width: 120 }]}
                    keyboardType="numeric"
                    value={String(newQty)}
                    onChangeText={(val) => setNewQty(Number(val))}
                  />
                  <TouchableOpacity style={styles.saveBtn} onPress={handleAddMaterial}>
                    <Text style={{ color: "#fff", fontWeight: "bold" }}>เพิ่มอะไหล่</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ---------------------- Edit Material Modal ---------------------- */}
      <Modal visible={editModalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
          <Text style={styles.header}>เลือกอะไหล่ใหม่</Text>
          <ScrollView>
            {allMaterials.map((m) => (
              <TouchableOpacity
                key={m.Material_id}
                style={[
                  styles.materialCard,
                  selectedNewMaterial?.Material_id === m.Material_id && {
                    borderColor: "#4CAF50",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setSelectedNewMaterial(m)}
              >
                <Text>รหัสอะไหล่: {m.Material_id}</Text>
                <Text>{m.Name}</Text>
                <Text>Model: {m.Model}</Text>
                <Text>ราคา: {m.Price}</Text>
              </TouchableOpacity>
            ))}

            <Text style={{ marginTop: 10 }}>จำนวนที่ใช้:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="กรอกจำนวนอะไหล่ใหม่"
              placeholderTextColor="#555"
              value={String(newQty)}
              onChangeText={(val) => setNewQty(Number(val))}
            />
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMaterial}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>บันทึกการแก้ไข</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.closeBtn, { marginTop: 10 }]}
            onPress={() => setEditModalVisible(false)}
          >
            <Text style={{ color: "#fff" }}>ยกเลิก</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 10,
  marginTop: 10,
},
backText: {
  fontSize: 16,
  marginLeft: 6,
  color: "#333",
},

  card: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  detailBtn: {
    marginTop: 8,
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: "#000", // ✅ ข้อความเข้ม
  },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  addJobBtn: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: "#219653",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeBtn: {
    backgroundColor: "#FF5722",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  editBtn: {
    marginTop: 8,
    backgroundColor: "#607D8B",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  materialCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  materialSmall: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  smallBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#888",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  row50: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  floatingAddBtn: {
  position: "absolute",
  bottom: 24,
  right: 24,
  backgroundColor: "#FF7F50", // สีเดียวกับปุ่มเดิม
  width: 60,
  height: 60,
  borderRadius: 30,
  justifyContent: "center",
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.3,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  elevation: 6, // สำหรับ Android
},

});
