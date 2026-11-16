const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");
const mysql = require("mysql2/promise");

const app = express();
const PORT = 1234;

const pool = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "internship_app",
    password: "zxcv1234",
    database: "internship_tracking"
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
    session({
        secret: "internship-tracking-dev-secret",
        resave: false,
        saveUninitialized: false
    })
);

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.redirect("/login.html?error=1");
        }

        req.session.user = { id: user.id, username: user.username, role: user.role };
        res.redirect("/");
    } catch (error) {
        console.error(error.message);
        res.redirect("/login.html?error=1");
    }
});

app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});

app.use((req, res, next) => {
    if (req.path === "/login.html" || req.session.user) {
        return next();
    }
    if (req.path.startsWith("/api/")) {
        return res.status(401).json({ error: "ยังไม่ได้ล็อกอิน" });
    }
    res.redirect("/login.html");
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/me", (req, res) => {
    res.json(req.session.user);
});

app.get("/api/status", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ database: "connected" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ database: "error" });
    }
});

app.get("/api/students/count", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT COUNT(*) AS total FROM students");
        res.json({ total: rows[0].total });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ total: 0 });
    }
});
app.get("/api/students", async (req, res) => {
    const keyword = (req.query.q || "").trim();

    try {
        const [rows] = await pool.query(
            "SELECT id, student_code, full_name, major FROM students WHERE student_code LIKE ? OR full_name LIKE ? ORDER BY id",
            [`%${keyword}%`, `%${keyword}%`]
        );
        res.json(rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "ดึงข้อมูลไม่สำเร็จ" });
    }
});

app.post("/api/students", async (req, res) => {
    const { student_code, full_name, major } = req.body;

    if (!student_code || !full_name) {
        return res.status(400).json({ error: "กรุณากรอกรหัสนักศึกษาและชื่อ" });
    }

    try {
        await pool.query(
            "INSERT INTO students (student_code, full_name, major) VALUES (?, ?, ?)",
            [student_code.trim(), full_name.trim(), (major || "").trim()]
        );
        res.status(201).json({ message: "เพิ่มนักศึกษาสำเร็จ" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "รหัสนักศึกษานี้มีอยู่แล้ว" });
        }
        console.error(error.message);
        res.status(500).json({ error: "เพิ่มข้อมูลไม่สำเร็จ" });
    }
});

app.put("/api/students/:id", async (req, res) => {
    const { student_code, full_name, major } = req.body;

    if (!student_code || !full_name) {
        return res.status(400).json({ error: "กรุณากรอกรหัสนักศึกษาและชื่อ" });
    }

    try {
        const [result] = await pool.query(
            "UPDATE students SET student_code = ?, full_name = ?, major = ? WHERE id = ?",
            [student_code.trim(), full_name.trim(), (major || "").trim(), req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "ไม่พบนักศึกษา" });
        }
        res.json({ message: "แก้ไขข้อมูลสำเร็จ" });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "รหัสนักศึกษานี้มีอยู่แล้ว" });
        }
        console.error(error.message);
        res.status(500).json({ error: "แก้ไขข้อมูลไม่สำเร็จ" });
    }
});

app.delete("/api/students/:id", async (req, res) => {
    try {
        const [result] = await pool.query(
            "DELETE FROM students WHERE id = ?",
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "ไม่พบนักศึกษา" });
        }
        res.json({ message: "ลบนักศึกษาสำเร็จ" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "ลบข้อมูลไม่สำเร็จ" });
    }
});


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});