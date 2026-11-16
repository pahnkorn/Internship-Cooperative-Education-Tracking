const databaseStatus = document.getElementById("databaseStatus");
const studentCount = document.getElementById("studentCount");

async function checkDatabase() {
    try {
        const respone = await fetch("/api/status");
        const data = await respone.json();

        if (data.database === "connected") {
            databaseStatus.textContent = "เชื่อมต่อแล้ว";
        } else {
            databaseStatus.textContent = "เชื่อมต่อไม่ได้";
        }
    } catch (error) {
        databaseStatus.textContent = "มีความผิดผลาดเกิดขึ้น";
    }
}

async function loadStudentCount() {
    try {
        const respone = await fetch("/api/students/count");
        const data = await respone.json();
        studentCount.textContent = data.total;
    } catch (error) {
        studentCount.textContent = "-";
    }
}
const userName = document.getElementById("userName");

async function loadUser() {
    try {
        const response = await fetch("/api/me");
        const user = await response.json();
        const roleThai = user.role === "student" ? "นักศึกษา" : "พี่เลี้ยง";
        userName.textContent = `${user.username} (${roleThai})`;
    } catch (error) {
        userName.textContent = "";
    }
}
const studentTableBody = document.getElementById("studentTableBody");
const searchInput = document.getElementById("searchInput");

async function loadStudents() {
    try {
        const keyword = searchInput.value.trim();
        const response = await fetch("/api/students?q=" + encodeURIComponent(keyword));
        const students = await response.json();

        studentTableBody.innerHTML = "";

        if (students.length === 0) {
            studentTableBody.innerHTML = '<tr><td colspan="4">ยังไม่มีนักศึกษา</td></tr>';
            return;
        }

        students.forEach((student) => {
            const row = document.createElement("tr");

            [student.student_code, student.full_name, student.major].forEach((value) => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");
            actionCell.className = "actions";

            const editButton = document.createElement("button");
            editButton.textContent = "แก้ไข";
            editButton.className = "btn-small";
            editButton.addEventListener("click", () => editStudent(student));

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "ลบ";
            deleteButton.className = "btn-small btn-danger";
            deleteButton.addEventListener("click", () => deleteStudent(student));

            actionCell.appendChild(editButton);
            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            studentTableBody.appendChild(row);
        });
    } catch (error) {
        studentTableBody.innerHTML = '<tr><td colspan="4">โหลดข้อมูลไม่สำเร็จ</td></tr>';
    }
}

async function editStudent(student) {
    const student_code = prompt("รหัสนักศึกษา:", student.student_code);
    if (student_code === null) return;
    const full_name = prompt("ชื่อ-นามสกุล:", student.full_name);
    if (full_name === null) return;
    const major = prompt("สาขา:", student.major || "");
    if (major === null) return;

    const response = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_code, full_name, major })
    });
    const data = await response.json();

    if (response.ok) {
        loadStudents();
    } else {
        alert(data.error);
    }
}

async function deleteStudent(student) {
    if (!confirm(`ลบ ${student.full_name} ใช่หรือไม่?`)) return;

    const response = await fetch(`/api/students/${student.id}`, { method: "DELETE" });
    const data = await response.json();

    if (response.ok) {
        loadStudents();
        loadStudentCount();
    } else {
        alert(data.error);
    }
}
searchInput.addEventListener("input", loadStudents);

loadUser();
checkDatabase();
loadStudentCount();
loadStudents();