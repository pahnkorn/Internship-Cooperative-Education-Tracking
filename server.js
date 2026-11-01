
const express = require("express");
const session = require("express-session");
const path = require("path");
const app = express();
const PORT = 3000;

// บัญชีตั้งไว้ล่วงหน้า (รหัสผ่านเก็บเป็นข้อความธรรมดาเพื่อความง่าย — ไม่เหมาะกับการใช้งานจริง)
const USERS = [
    { username: "student", password: "student123", role: "นักศึกษา" },
    { username: "mentor", password: "mentor123", role: "พี่เลี้ยง" },
];

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
    session({
        secret: "internship-tracking-secret",
        resave: false,
        saveUninitialized: false,
    })
);

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = USERS.find(
        (u) => u.username === username && u.password === password
    );

    if (!user) {
        return res.redirect("/login.html?error=1");
    }

    req.session.user = { username: user.username, role: user.role };
    res.redirect("/");
});

app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});

app.get("/api/me", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "ยังไม่ได้ล็อกอิน" });
    }
    res.json(req.session.user);
});

// อนุญาตให้เข้าถึง login.html กับ style.css ได้โดยไม่ต้องล็อกอิน
app.use((req, res, next) => {
    const openPaths = ["/login.html", "/style.css"];
    if (openPaths.includes(req.path) || req.session.user) {
        return next();
    }
    res.redirect("/login.html");
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
