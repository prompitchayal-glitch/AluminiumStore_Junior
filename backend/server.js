const express = require("express");  // ดึงไลบรารี express มาใช้ สร้างเว็บ server / API
const sql = require("mssql");
const cors = require("cors"); // ถ้าไม่มี: เวลา frontend เรียก API จากโดเมน/พอร์ตคนละอันกับ backend จะติด CORS error ที่ฝั่งเบราว์เซอร์

const app = express();
app.use(cors());
app.use(express.json());

require("dotenv").config({ path: __dirname + "/.env" });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: String(process.env.DB_ENCRYPT || "false").toLowerCase() === "true",
    trustServerCertificate:
      String(process.env.DB_TRUST_SERVER_CERT || "true").toLowerCase() === "true",
  },
};

// POST login CEO
// POST CEO Login  — รองรับทั้ง /login และ /api/login
app.post(["/login", "/api/login"], async (req, res) => {
  const rawUser = req.body?.username ?? "";
  const rawPass = req.body?.password ?? "";

  const username = String(rawUser).trim();
  const password = String(rawPass).trim();

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "กรอกชื่อผู้ใช้และรหัสผ่าน" });
  }

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input("Username", sql.VarChar(50), username)
      .input("Password", sql.VarChar(50), password)
      .query(`
        SELECT User_id, Username
        FROM dbo.AccountCeo
        WHERE LTRIM(RTRIM(Username)) = @Username   
          AND LTRIM(RTRIM(Password)) = @Password
      `);//ตัดช่องวางทั้งซ้ายและขวา LTRIM RTRIM  กรณีผู้ใช้ป้อน หรือ เคาะ ค่าว่างมา

    if (result.recordset.length > 0) {  // ถ้าพบผู้ใช้ที่ตรงกับเงื่อนไข ก็จะ > 0
      const user = result.recordset[0];
      return res.status(200).json({
        success: true,
        message: "Login successful",
        user: { id: user.User_id, username: user.Username }
      });
    }

    return res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (err) {
    console.error("❌ /login error:", err);
    return res.status(500).json({ success: false, message: err?.message || "Server error" });
  }
});





// ดึงข้อมูลลูกค้าทั้งหมด
app.get("/api/customers", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`SELECT * FROM Customer ORDER BY Customer_id`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
// ดึงข้อมูลพนักงานทั้งหมด
app.get("/api/employees", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .query("SELECT * FROM dbo.Employee ORDER BY Employee_id"); // ใส่ dbo. เผื่อ schema default ไม่ตรง
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


//  ดึงข้อมูลอะไหล่ทั้งหมด 
app.get("/api/materials", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM Material ORDER BY TRY_CAST(Material_id AS INT)");  //ฟังก์ชัน TRY_CAST() จะพยายามแปลงค่าคอลัม Material_id จากvarchar ให้เป็นตัวเลข ถ้าแปลงไม่ได้จะข้าม (ไม่ error)
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลอะไหล่ได้" });
  }
});


// ---------------------- FUNCTION CALLS ----------------------





// 1 ดึงข้อมูลลูกค้าตามจังหวัด (เรียกใช้ฟังก์ชันใน SQL)
app.get("/api/customers/by-Province", async (req, res) => {
  const { Province } = req.query; // รับพารามิเตอร์จาก URL เช่น ?city=bangkok
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input("Province", sql.VarChar(50), Province)
      .query(`SELECT * FROM dbo.GetCustomers_Province(@Province)`); // 🔸 เรียกใช้ฟังก์ชันที่เราสร้าง
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// 1) พนักงานมาสาย (สมมติฟังก์ชันรับ param เดือน/ปี)
app.get("/api/employee/late", async (req, res) => {
  const { month, year } = req.query;
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input("Month", sql.Int, month)
      .input("Year", sql.Int, year)
      .query(`SELECT * FROM dbo.LateEmployees(@Month,@Year)`);
    // ถ้า fn ของคุณ "ไม่รับ param" ให้เปลี่ยนเป็น: SELECT * FROM LateEmployees()
    res.json(result.recordset);
  } catch (err) { res.status(500).send(err.message); }
});

// 2) งานของพนักงาน (ถ้าต้องการใช้ต่อในอนาคต)
app.get("/api/job-of-employee/:jobId", async (req, res) => {
  const jobId = req.params.jobId;
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input("idjob", sql.VarChar(20), jobId)   // <-- ตรงกับฟังก์ชัน SQL
      .query(`SELECT * FROM dbo.Job_of_Employee(@idjob)`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});



// ฟังก์ชันดูรายได้รวมแต่ละเดือน
app.get("/api/income/month", async (req, res) => {
  const { month, year } = req.query;
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input("Month", sql.Int, month)
      .input("Year", sql.Int, year)
      .query("SELECT dbo.Total_income_Month(@Month, @Year) AS TotalIncome");
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



//  ฟังก์ชันดูจังหวัดที่มีงานมากที่สุดในเดือนนั้น
app.get("/api/top-province", async (req, res) => {
  const { month, year } = req.query;
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input("Month", sql.Int, month)
      .input("Year", sql.Int, year)
      .query("SELECT * FROM dbo.TopProvince_Month(@Month, @Year)");

    res.json(result.recordset[0] || { Province: "ไม่พบข้อมูล", JobCount: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});




// ---------------------- STORED PROCEDURES ----------------------

// เพิ่มลูกค้า
// ✅ เพิ่มลูกค้าใหม่
app.post("/api/sp/customers/add", async (req, res) => {
  try {
    const {
      Customer_id,
      Card_id,
      FirstName,
      LastName,
      Phone,
      Email,
      Street,
      City,
      Province,
      PostalCode,
    } = req.body; // 👈 รับข้อมูลจาก React

    console.log("📥 ข้อมูลที่รับจาก React:", req.body); // debug ดูข้อมูลที่ส่งมา

    const pool = await sql.connect(config); // 🔗 เชื่อมต่อ SQL Server

    // 🔧 เรียกใช้ Stored Procedure AddCustomer พร้อมใส่พารามิเตอร์
    await pool
      .request()
      .input("Customer_id", sql.VarChar(20), Customer_id)
      .input("Card_id", sql.VarChar(20), Card_id)
      .input("FirstName", sql.NVarChar(50), FirstName)
      .input("LastName", sql.NVarChar(50), LastName)
      .input("Phone", sql.VarChar(15), Phone)
      .input("Email", sql.VarChar(100), Email)
      .input("Street", sql.NVarChar(100), Street)
      .input("City", sql.NVarChar(50), City)
      .input("Province", sql.NVarChar(50), Province)
      .input("PostalCode", sql.VarChar(10), PostalCode)
      .execute("AddCustomer"); // 👈 รัน SP จริง ๆ

    res.status(200).json({ message: "เพิ่มลูกค้าสำเร็จ" }); // ✅ ส่งกลับให้ React
  } catch (err) {
    console.error("❌ AddCustomer Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// อัปเดตลูกค้า
app.put("/api/sp/customers/update/:id", async (req, res) => {
  const id = req.params.id;
  const c = req.body;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input("Customer_id", sql.VarChar(20), id)
      .input("Card_id", sql.VarChar(20), c.Card_id)
      .input("FirstName", sql.VarChar(50), c.FirstName)
      .input("LastName", sql.VarChar(50), c.LastName)
      .input("Phone", sql.VarChar(15), c.Phone)
      .input("Email", sql.VarChar(100), c.Email)
      .input("Street", sql.VarChar(100), c.Street)
      .input("City", sql.VarChar(50), c.City)
      .input("Province", sql.VarChar(50), c.Province)
      .input("PostalCode", sql.VarChar(10), c.PostalCode)
      .execute("UpdateCustomer");
    res.json({ message: "Customer updated (SP)" });
  } catch (err) { res.status(500).send(err.message); }
});

// ลบลูกค้า
app.delete("/api/sp/customers/delete/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input("Customer_id", sql.VarChar(20), id)
      .execute("DeleteCustomer");
    res.json({ message: "Customer deleted (SP)" });
  } catch (err) { res.status(500).send(err.message); }
});

// เพิ่มพนักงาน
app.post("/api/sp/employees/add", async (req, res) => {
  const e = req.body;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input("Employee_id", sql.VarChar(20), e.Employee_id)
      .input("FirstName", sql.VarChar(50), e.FirstName)
      .input("LastName", sql.VarChar(50), e.LastName)
      .input("Phone", sql.VarChar(15), e.Phone)
      .input("Email", sql.VarChar(100), e.Email)
      .input("Street", sql.VarChar(100), e.Street)
      .input("City", sql.VarChar(50), e.City)
      .input("Province", sql.VarChar(50), e.Province)
      .input("PostalCode", sql.VarChar(10), e.PostalCode)
      .input("HireDate", sql.DateTime, e.HireDate)
      .execute("AddEmployee");
    res.json({ message: "Employee added (SP)" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// อัปเดตพนักงาน
app.put("/api/sp/employees/update/:id", async (req, res) => {
  const id = req.params.id;
  const e = req.body;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input("Employee_id", sql.VarChar(20), id)
      .input("FirstName", sql.VarChar(50), e.FirstName)
      .input("LastName", sql.VarChar(50), e.LastName)
      .input("Phone", sql.VarChar(15), e.Phone)
      .input("Email", sql.VarChar(100), e.Email)
      .input("Street", sql.VarChar(100), e.Street)
      .input("City", sql.VarChar(50), e.City)
      .input("Province", sql.VarChar(50), e.Province)
      .input("PostalCode", sql.VarChar(10), e.PostalCode)
      .input("HireDate", sql.DateTime, e.HireDate)
      .execute("UpdateEmployee");
    res.json({ message: "Employee updated (SP)" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ลบพนักงาน

app.delete("/api/sp/employees/delete/:id", async (req, res) => {
  const id = req.params.id ? req.params.id.trim() : "";
  try {
    const pool = await sql.connect(config);
    const r = await pool.request()
      .input("Employee_id", sql.VarChar(20), id)
      .execute("dbo.DeleteEmployee");

    const rows =
      Array.isArray(r.rowsAffected) ? r.rowsAffected.reduce((a, b) => a + b, 0) : 0;

    return res.status(200).json({
      success: true,
      message: "Employee deleted",
      rowsAffected: r.rowsAffected,
      total: rows,
      id
    });
  } catch (err) {
    // log ให้เห็นใน console แบบละเอียด
    console.error("❌ DeleteEmployee error:", {
      id,
      message: err?.message,
      name: err?.name,
      code: err?.code,
      number: err?.number,
      originalInfo: err?.originalError?.info,
      stack: err?.stack,
    });

    // จัดข้อความสำหรับ client
    const info = err?.originalError?.info;
    const sqlMsg =
      (info && (info.message || info.procName)) ||
      err?.message ||
      "Unhandled SQL error";

    // ถ้า SP โยน 'Employee not found' ให้ส่ง 404
    if (sqlMsg && String(sqlMsg).toLowerCase().includes("employee not found")) {
      return res.status(404).json({ success: false, error: sqlMsg });
    }

    return res.status(500).json({
      success: false,
      error: sqlMsg,
    });
  }
});







// ---------------------- WORK SCHEDULE ----------------------
app.post("/api/sp/work-schedule/add", async (req, res) => {
  const { Schedule_id, Emp_id, CheckIn } = req.body;
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input("Schedule_id", sql.VarChar(20), Schedule_id)
      .input("Emp_id", sql.VarChar(20), Emp_id)
      .input("CheckIn", sql.DateTime, CheckIn)
      .execute("AddWorkSchedule");  // เรียกใช้ SP  AddWorkSchedule
    res.json({ message: "บันทึกเวลาทำงานสำเร็จ" });
  } catch (err) {
    // ส่ง error ของ SP กลับแอป
    res.status(500).json({ error: err.message });
  }
});


// ================== อัปเดตอะไหล่ในงาน ==================
app.put("/api/sp/job-material/update", async (req, res) => {
  const { Job_id, Old_Material_id, New_Material_id, qty_material } = req.body; // ✅ เพิ่ม qty_material

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input("Job_id", sql.VarChar(20), Job_id)
      .input("Old_Material_id", sql.VarChar(20), Old_Material_id)
      .input("New_Material_id", sql.VarChar(20), New_Material_id)
      .input("qty_material", sql.Int, qty_material) 
      .execute("UpdateJobMaterial");

    res.json({ message: "อัปเดตอะไหล่ในงานเรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});




//------------------------------------------
// เพิ่มงานใหม่ (Add Job)
// ใช้ SP AddJob 
//------------------------------------------
app.post("/api/sp/job/add", async (req, res) => {
  const {
    Job_id,
    Job_name,
    Customer_id,
    Start_date,
    Install_date,  
    Install,
    Install_price,
    describe

  } = req.body;

  try {
    const pool = await sql.connect(config);
    await pool.request()
  .input("Job_id", sql.VarChar(20), Job_id)
  .input("Customer_id", sql.VarChar(20), Customer_id)
  .input("Job_name", sql.NVarChar(100), Job_name)
  .input("Install", sql.NVarChar(10), Install)
  .input("Install_price", sql.Decimal(10, 2), Install_price)
  .input("Start_date", sql.Date, Start_date)
  .input("Install_date", sql.Date, Install_date)
  .input("describe", sql.NVarChar(255), describe)
  .execute("AddJob");
    res.json({ message: "เพิ่มงานใหม่เรียบร้อย" });
  } catch (err) {
    console.error("❌ AddJob error:", err);
    res.status(500).json({ error: "ไม่สามารถเพิ่มงานได้" });
  }
});




//------------------------------------------
//  เพิ่มอะไหล่ในงาน (Add Job Material)
// ใช้ SP AddJobMaterial 
//------------------------------------------
app.post("/api/sp/job-material/add", async (req, res) => {
  const { Job_id, Material_id, qty_material } = req.body;

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input("Job_id", sql.VarChar(20), Job_id)
      .input("Material_id", sql.VarChar(20), Material_id)
      .input("qty_material", sql.Int, qty_material)
      .execute("AddJobMaterial"); // ✅ เรียก SP ที่คุณมีอยู่

    res.json({ message: "เพิ่มอะไหล่ในงานเรียบร้อย" });
  } catch (err) {
    console.error("❌ AddJobMaterial error:", err);
    res.status(500).json({ error: "ไม่สามารถเพิ่มอะไหล่ได้" });
  }
});



// ลบงานทั้งงาน หรือ ลบอะไหล่ทีละชิ้น
app.delete("/api/sp/job-material/delete", async (req, res) => {
  const { Job_id, Material_id } = req.body; // Material_id = null หมายถึงลบงานทั้งหมด

  try {
    const pool = await sql.connect(config);

    await pool.request()
      .input("Job_id", sql.VarChar(20), Job_id)
      .input("Material_id", sql.VarChar(20), Material_id) // ถ้า null => ลบงานทั้งหมด
      .execute("DeleteJob_Or_Material"); // เรียกใช้งาน SP

    if (Material_id) {
      res.json({ message: `ลบอะไหล่ ${Material_id} จากงาน ${Job_id} เรียบร้อย` });
    } else {
      res.json({ message: `ลบงาน ${Job_id} พร้อมอะไหล่ทั้งหมดเรียบร้อย` });
    }

  } catch (err) {
    console.error("❌ DeleteJobOrMaterial error:", err);
    res.status(500).json({ error: err.message });
  }
});










//--------------------------------------------------VIEW----------------------------------------


// ================== API สำหรับดึงงาน ==================
app.get("/api/view/job", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    // ✅ ดึงข้อมูลจาก View_Job ตามที่เก็บในฐานข้อมูล ไม่เรียงลำดับ
    const result = await pool.request().query("SELECT * FROM View_Job");

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลงานได้" });
  }
});

// ================== API สำหรับดึงรายละเอียดอะไหล่ของงาน ==================
app.get("/api/view/job-material/:jobId", async (req, res) => {
  const { jobId } = req.params;
  try {
    const pool = await sql.connect(config);

    const result = await pool.request()
      .input("Job_id", sql.VarChar(50), jobId)
      .query(`
        SELECT * FROM View_JobMaterial
        WHERE Job_id = @Job_id`);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ไม่สามารถดึงรายละเอียดอะไหล่ได้" });
  }
});


// ================== API สำหรับดูประเภทงานยอดนิยม ==================
app.get("/api/view/job-popular", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    // 🔹 ดึงข้อมูลจาก View_Job_Popular ที่เราสร้างไว้ใน SQL Server   
    const result = await pool.request().query("SELECT * FROM View_Job_Popular");

    res.json(result.recordset); //  ส่งออกข้อมูลเป็น JSON ให้ฝั่งแอป
  } catch (err) {
    console.error("❌ Error fetching job popular:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลประเภทงานยอดนิยมได้" });
  }
});


// ================== API สำหรับดูรายชื่อพนักงานที่รับผิดชอบแต่ละงาน ==================
app.get("/api/view/job-of-emp", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM View_JobOfEmp");
    res.json(result.recordset);
  } catch (err) {
    console.error("❌ Error fetching View_JobOfEmp:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูล View_JobOfEmp ได้" });
  }
});











//----------------------------------Trigger---------------------------------------    



// ตรวจสอบพนักงานที่รับผิดชอบว่าซ้ำกับค่าที่กำลังจะกรอกหรือไม่

// เพิ่มพนักงานลงงานเดียว (ให้ Trigger ตรวจซ้ำ)
app.post("/api/add/job-of-emp", async (req, res) => {
  const { Job_id, Employee_id } = req.body;

  try {
    const pool = await sql.connect(config);

    await pool.request()
      .input("Job_id", sql.VarChar(20), String(Job_id || "").trim())
      .input("Employee_id", sql.VarChar(20), String(Employee_id || "").trim())
      .query(`
        INSERT INTO dbo.WorksOn (Job_id, Employee_id)
        VALUES (@Job_id, @Employee_id)
      `);

    res.json({ success: true, message: "เพิ่มพนักงานเรียบร้อย" });

  } catch (err) {
    // ดักข้อความจาก Trigger/Unique
    const raw =
      err?.originalError?.info?.message ||
      err?.message ||
      "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";

    if (/This Emp(ployee_id)? used/i.test(raw) || /duplicate|unique/i.test(raw)) {
      return res.status(400).json({ success: false, message: "This Emp used." });
    }
    console.error("❌ AddJobOfEmp error:", err);
    res.status(500).json({ success: false, message: raw });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
