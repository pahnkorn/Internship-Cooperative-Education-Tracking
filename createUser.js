const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const [username, password, role] = process.argv.slice(2);

if (!username || !password || !role) {
    console.log("วิธีใช้: node createUser.js ชื่อผู้ใช้ รหัสผ่าน บทบาท");
    process.exit(1);
}

async function main() {
    const pool = mysql.createPool({
        host: "localhost",
        port: 3306,
        user: "internship_app",
        password: "zxcv1234",
        database: "internship_tracking"
    });

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
        [username, passwordHash, role]
    );

    console.log("สร้างบัญชีสำเร็จ:", username);
    await pool.end();
}

main().catch((error) => {
    console.error("ผิดพลาด:", error.message);
    process.exit(1);
});