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
import { API_URL } from "../../config";

interface Customer {
  Customer_id: string;
  Card_id: string;
  FirstName: string;
  LastName: string;
  Phone: string;
  Email: string | null;
  Street: string;
  City: string;
  Province: string;
  PostalCode: string;
  Created_date: string;
}

export default function CustomerScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer>>({});
  const [province, setProvince] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [showFiltered, setShowFiltered] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ helper: แจ้งเตือน cross-platform
  const notify = (message: string, title: string = "แจ้งเตือน") => {
    if (Platform.OS === "web") {
      window.alert(message);
    } else {
      Alert.alert(title, message);
    }
  };

  // ✅ helper: ยืนยัน cross-platform
  const confirmAsync = (title: string, message: string): Promise<boolean> => {
    if (Platform.OS === "web") {
      return Promise.resolve(window.confirm(`${title}\n\n${message}`));
    }
    return new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: "ยกเลิก", style: "cancel", onPress: () => resolve(false) },
        { text: "ลบ", style: "destructive", onPress: () => resolve(true) },
      ]);
    });
  };

  const fetchCustomers = () => {
    console.log("📡 กำลังดึงข้อมูลลูกค้าทั้งหมด...");
    fetch(`${API_URL}/customers`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Response Status: 200");
        console.log("📦 Customers Loaded:", data);
        setCustomers(data);
      })
      .catch((err) => console.error("❌ Fetch Error:", err));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const saveCustomer = () => {
    if (
      !editingCustomer.Customer_id ||
      !editingCustomer.Card_id ||
      !editingCustomer.FirstName ||
      !editingCustomer.LastName ||
      !editingCustomer.Phone
    ) {
      notify("กรุณากรอกข้อมูลที่จำเป็นให้ครบ!");
      return;
    }

    let url = "";
    let method: "POST" | "PUT" = "PUT";

    if (
      editingCustomer.Customer_id &&
      !customers.find((c) => c.Customer_id === editingCustomer.Customer_id)
    ) {
      url = `${API_URL}/sp/customers/add`;
      method = "POST";
    } else {
      url = `${API_URL}/sp/customers/update/${editingCustomer.Customer_id}`;
      method = "PUT";
    }

    console.log("🛰 กำลังส่งข้อมูลไปยัง:", url);
    console.log("📦 Method:", method);
    console.log("📤 ข้อมูลที่จะส่ง:", editingCustomer);

    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingCustomer),
    })
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(msg || "บันทึกไม่สำเร็จ");
        }
        setModalVisible(false);
        setEditingCustomer({});
        fetchCustomers();
        notify("บันทึกข้อมูลลูกค้าเรียบร้อย");
      })
      .catch((err) => {
        console.error(err);
        notify("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      });
  };

  const deleteCustomer = async (id: string) => {
    const ok = await confirmAsync(
      "ยืนยันการลบ",
      `คุณต้องการลบข้อมูลลูกค้า รหัส ${id} หรือไม่?`
    );
    if (!ok) return;

    try {
      const res = await fetch(`${API_URL}/sp/customers/delete/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success !== false) {
        await fetchCustomers();
        notify(`ลบลูกค้ารหัส ${id} เรียบร้อยแล้ว`);
        return;
      }

      const msg =
        data?.message ??
        `เกิดข้อผิดพลาดขณะลบข้อมูล  กรุณาลบงานของลูกค้า ${id} ก่อน!`;
      notify(msg);
    } catch {
      notify(`เกิดข้อผิดพลาดขณะลบข้อมูล  กรุณาลบงานของลูกค้า ${id} ก่อน!`);
    }
  };

  const fetchByProvince = async () => {
    if (!province.trim()) {
      notify("กรุณากรอกชื่อจังหวัดก่อน");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/customers/by-Province?Province=${province}`
      );
      const data = await res.json();
      setFilteredCustomers(data);
      setShowFiltered(true);
    } catch {
      notify("เกิดข้อผิดพลาดในการดึงข้อมูล");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ข้อมูลลูกค้า</Text>
      </View>

      <View style={styles.container}>
        {/* ✅ ปุ่มเพิ่มลูกค้าใหม่ */}
        <TouchableOpacity
          style={styles.floatingAddButton}
          onPress={() => {
            setIsEditing(false);
            setEditingCustomer({
              Customer_id: "",
              Card_id: "",
              FirstName: "",
              LastName: "",
              Phone: "",
              Email: "",
              Street: "",
              City: "",
              Province: "",
              PostalCode: "",
            });
            setModalVisible(true);
          }}
        >
          <Text style={styles.floatingAddText}>＋</Text>
        </TouchableOpacity>

        {/* ✅ ค้นหาลูกค้าตามจังหวัด */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>ค้นหาลูกค้าตามจังหวัด</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="กรอกชื่อจังหวัด เช่น Chonburi"
            placeholderTextColor="#555"
            value={province}
            onChangeText={setProvince}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={fetchByProvince}
          >
            <Text style={styles.filterButtonText}> ค้นหา</Text>
          </TouchableOpacity>
        </View>

        {/* ✅ รายชื่อลูกค้า */}
        <FlatList
          data={customers}
          keyExtractor={(item) => item.Customer_id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.Customer_id}</Text>
              <Text style={styles.name}>
                {item.FirstName} {item.LastName}
              </Text>
              <Text style={styles.phone}>📞 {item.Phone}</Text>
              <Text style={styles.address}>
                {item.Street}, {item.City}, {item.Province}, {item.PostalCode}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    setIsEditing(true); // ✅ เพิ่มแค่บรรทัดนี้
                    setEditingCustomer(item);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.btnText}>แก้ไข</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteCustomer(item.Customer_id)}
                >
                  <Text style={styles.btnText}>ลบ</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>ยังไม่มีข้อมูลลูกค้า</Text>
          }
        />

        {/* ✅ ลูกค้าที่กรอง */}
        {filteredCustomers.length > 0 && (
          <View style={styles.filteredList}>
            <TouchableOpacity
              style={styles.filterHeader}
              onPress={() => setShowFiltered(!showFiltered)}
            >
              <Text style={styles.filterResultTitle}>
                ผลการค้นหาในจังหวัด {province}
              </Text>
              <Text style={styles.toggleIcon}>
                {showFiltered ? "▲" : "▼"}
              </Text>
            </TouchableOpacity>

            {showFiltered && (
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.Customer_id}
                renderItem={({ item }) => (
                  <View style={styles.filteredCard}>
                    <Text>รหัสลูกค้า {item.Customer_id}</Text>
                    <Text>
                      ชื่อ: {item.FirstName} {item.LastName}
                    </Text>
                    <Text>เบอร์: {item.Phone}</Text>
                    <Text>จังหวัด: {item.Province}</Text>
                  </View>
                )}
              />
            )}
          </View>
        )}

        {/* ✅ Modal เพิ่ม/แก้ไข */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditing ? "แก้ไขลูกค้า" : "เพิ่มลูกค้าใหม่"}
              </Text>

              <ScrollView style={{ maxHeight: 400 }}>
  <TextInput
    style={styles.input}
    placeholder="รหัสลูกค้า"
    placeholderTextColor="#666"
    value={editingCustomer.Customer_id || ""}
    onChangeText={(text) =>
      setEditingCustomer({ ...editingCustomer, Customer_id: text })
    }
  />

  <TextInput
    style={styles.input}
    placeholder="เลขบัตรประชาชน"
    placeholderTextColor="#666"
    value={editingCustomer.Card_id || ""}
    onChangeText={(text) =>
      setEditingCustomer({ ...editingCustomer, Card_id: text })
    }
  />

  <TextInput
    style={styles.input}
    placeholder="ชื่อ"
    placeholderTextColor="#666"
    value={editingCustomer.FirstName || ""}
    onChangeText={(text) =>
      setEditingCustomer({ ...editingCustomer, FirstName: text })
    }
  />

  <TextInput
    style={styles.input}
    placeholder="นามสกุล"
    placeholderTextColor="#666"
    value={editingCustomer.LastName || ""}
    onChangeText={(text) =>
      setEditingCustomer({ ...editingCustomer, LastName: text })
    }
  />

  <TextInput
    style={styles.input}
    placeholder="เบอร์โทรศัพท์"
    placeholderTextColor="#666"
    keyboardType="phone-pad"
    value={editingCustomer.Phone || ""}
    onChangeText={(text) =>
      setEditingCustomer({ ...editingCustomer, Phone: text })
    }
  />

  <TextInput
    style={styles.input}
    placeholder="อีเมล"
    placeholderTextColor="#666"
    keyboardType="email-address"
    value={editingCustomer.Email || ""}
    onChangeText={(text) =>
      setEditingCustomer({ ...editingCustomer, Email: text })
    }
  />

  <TextInput
    style={styles.input}
    placeholder="ที่อยู่ (ถนน)"
    placeholderTextColor="#666"
    value={editingCustomer.Street || ""}
    onChangeText={(text) =>
      setEditingCustomer({ ...editingCustomer, Street: text })
    }
  />

  <TextInput
    style={styles.input}
    placeholder="ตำบล / เขต / แขวง"
    placeholderTextColor="#666"
    value={editingCustomer.City || ""}
    onChangeText={(text) =>
      setEditingCustomer({ ...editingCustomer, City: text })
    }
  />

  <TextInput
    style={styles.input}
    placeholder="จังหวัด"
    placeholderTextColor="#666"
    value={editingCustomer.Province || ""}
    onChangeText={(text) =>
      setEditingCustomer({ ...editingCustomer, Province: text })
    }
  />

  <TextInput
    style={styles.input}
    placeholder="รหัสไปรษณีย์"
    placeholderTextColor="#666"
    keyboardType="numeric"
    value={editingCustomer.PostalCode || ""}
    onChangeText={(text) =>
      setEditingCustomer({ ...editingCustomer, PostalCode: text })
    }
  />
</ScrollView>


              <TouchableOpacity style={styles.saveBtn} onPress={saveCustomer}>
                <Text style={styles.saveBtnText}>บันทึก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// ✅ Styles เดิมทั้งหมดเหมือนของคุณ ไม่แตะเลย
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ebe8e8ff" },

  headerRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",   // << จัดกึ่งกลางแนวนอน
  paddingHorizontal: 16,
  paddingVertical: 10,
  backgroundColor: "#ebe8e8ff",
  minHeight: 48,               // << ให้มีความสูงพอสำหรับปุ่มซ้าย
},
headerTitle: {
  color: "#000000ff",
  fontSize: 22,
  fontWeight: "700",
  textAlign: "center",
  flexShrink: 1,
  backgroundColor: "transparent",  // ← กันไว้ให้ชัวร์
},

  backButton: {
  position: "absolute",        // << ตรึงไว้ซ้าย ไม่ดันหัวข้อ
  left: 16,
  padding: 6,
},
  backText: { color: "#000000ff", fontSize: 26, fontWeight: "600" },
  
  container: { flex: 1, paddingHorizontal: 16, paddingTop: Platform.OS === "android" ? 16 : 0 },
  floatingAddButton: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#000000ff",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 6,
    zIndex: 999,
  },
  floatingAddText: { color: "#fff", fontSize: 32, fontWeight: "bold", marginBottom: 2 },
  addButton: { backgroundColor: "#007AFF", padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  filterContainer: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 12 },
  filterTitle: { fontWeight: "600", fontSize: 16, marginBottom: 6 },
  filterInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 8, color: "#000" },
  filterButton: { backgroundColor: "#2196F3", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  filterButtonText: { color: "#fff", fontWeight: "bold" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  name: { fontSize: 16, fontWeight: "600", color: "#333" },
  phone: { fontSize: 14, color: "#666", marginTop: 4 },
  address: { fontSize: 13, color: "#999", marginTop: 2 },
  actions: { flexDirection: "row", marginTop: 10 },
  editBtn: { backgroundColor: "#34C759", paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, marginRight: 8 },
  deleteBtn: { backgroundColor: "#FF3B30", paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "600" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 30, fontSize: 15 },
  filteredList: { marginTop: 10, backgroundColor: "#fff", borderRadius: 10, padding: 10 },
  filterResultTitle: { fontWeight: "700", fontSize: 16, marginBottom: 6 },
  filteredCard: { borderBottomWidth: 1, borderBottomColor: "#ddd", paddingVertical: 6 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "#fff", padding: 20, borderRadius: 16, width: "85%" },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  input: { borderColor: "#ccc", borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 10, color: "#000", backgroundColor: "#fff" },
  saveBtn: { backgroundColor: "#007AFF", paddingVertical: 10, borderRadius: 10, alignItems: "center", marginTop: 5 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelBtn: { alignItems: "center", marginTop: 10 },
  cancelText: { color: "#007AFF", fontSize: 15 },
  filterHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  toggleIcon: { fontSize: 18, color: "#007AFF", fontWeight: "600" },
});
