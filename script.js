import { updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===================================================
// 🔐 LOGIN (FIREBASE ONLY FOR USERS)
// ===================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEpqi6hL6GWrVzD5cHK2Iux7UbDvN06NE",
  authDomain: "laundryapp-64b39.firebaseapp.com",
  projectId: "laundryapp-64b39"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ===================================================
// 👤 ROLE SELECTION
// ===================================================
window.selectRole = function(role) {
  localStorage.setItem("role", role);
  window.location.href = "login.html";
};


// ===================================================
// 🔐 LOGIN
// ===================================================
window.login = async function() {

  let user = document.getElementById("user").value.trim();
  let pass = document.getElementById("pass").value.trim();

  if (!user || !pass) {
    alert("Enter username and password");
    return;
  }

  let selectedRole = localStorage.getItem("role");

  const querySnapshot = await getDocs(collection(db, "users"));

  let foundUser = null;

  for (let docSnap of querySnapshot.docs) {
    let data = docSnap.data();

    if (data.username === user && data.password === pass) {
      foundUser = data;
      break;
    }
  }

  if (!foundUser) {
    alert("Invalid Credentials");
    return;
  }

  if (foundUser.role !== selectedRole) {
    alert("Wrong role selected!");
    return;
  }

  alert("Login Successful!");
  window.location.href = selectedRole + ".html";
};


// ===================================================
// 🎯 SELECT ONLY ONE OPTION
// ===================================================
window.selectAction = function(id) {

  document.getElementById("laundry").checked = false;
  document.getElementById("modify").checked = false;
  document.getElementById("track").checked = false;

  document.getElementById(id).checked = true;
};


// ===================================================
// 📥 LOAD SCHEDULE (JSON OR EXCEL)
// ===================================================
async function loadSchedule() {

  // 🔥 FIRST: Try Excel (localStorage)
  let localData = JSON.parse(localStorage.getItem("scheduleData"));

  if (localData && localData.length > 0) {
    return localData;
  }

  // 🔥 SECOND: Try JSON file
  try {
    let response = await fetch("schedule.json");
    let data = await response.json();
    return data;
  } catch (e) {
    console.log("No JSON file found");
    return [];
  }
}


// ===================================================
// 🎯 CHECK + REDIRECT
// ===================================================
window.handleAction = async function() {

  let block = document.getElementById("block").value;
  let room = document.getElementById("room").value.trim();
  let selected = document.querySelector('input[name="action"]:checked');

  if (!block) return alert("Select block");
  if (!room) return alert("Enter room number");
  if (!selected) return alert("Select one option");

  let action = selected.id;

  let fullRoom = block + "-" + room;
  localStorage.setItem("room", fullRoom);

  // 🔁 SIMPLE REDIRECTS
  if (action === "track") {
    window.location.href = "track.html";
    return;
  }

  if (action === "modify") {
    window.location.href = "modify.html";
    return;
  }

  // 🧺 LAUNDRY CHECK
  if (action === "laundry") {

    let scheduleData = await loadSchedule();

    if (scheduleData.length === 0) {
      alert("⚠️ No schedule found (Upload Excel or add JSON)");
      return;
    }

    let floor = Math.floor(parseInt(room) / 100);
    let today = new Date().toISOString().split("T")[0];

    let match = scheduleData.find(item =>
      item.block === block &&
      item.floor === floor &&
      item.date === today
    );

    if (match) {
      window.location.href = "book_laundry.html";
    } else {
      alert("❌ Not scheduled today for Floor " + floor);
    }
  }
};


// ===================================================
// 🧺 BOOK LAUNDRY
// ===================================================
window.bookLaundry = async function() {

  let fullRoom = localStorage.getItem("room");

  let slot = document.getElementById("slot").value;
  let count = document.getElementById("count").value;

  if (!count) return alert("Enter number of clothes");

  let token = "L" + Math.floor(Math.random() * 10000);

  await addDoc(collection(db, "bookings"), {
    room: fullRoom,
    slot,
    clothes: count,
    token,
    status: "Pending"
  });

  document.getElementById("result").innerText =
    "✅ Booked! Token: " + token;
};


// ===================================================
// 🔍 TRACK
// ===================================================
window.trackLaundry = async function() {

  let token = document.getElementById("trackToken").value.trim();

  if (!token) return alert("Enter token");

  const querySnapshot = await getDocs(collection(db, "bookings"));

  let found = false;

  querySnapshot.forEach((docSnap) => {
    let data = docSnap.data();

    if (data.token === token) {
      found = true;
      document.getElementById("trackResult").innerText =
        "Room: " + data.room + " | Status: " + data.status;
    }
  });

  if (!found) {
    document.getElementById("trackResult").innerText =
      "❌ Invalid Token";
  }
};


// ===================================================
// 📥 EXCEL UPLOAD (DHOBI)
// ===================================================
window.uploadExcel = function() {

  let file = document.getElementById("fileInput").files[0];

  if (!file) return alert("Select Excel file");

  let reader = new FileReader();

  reader.onload = function(e) {

    let data = new Uint8Array(e.target.result);
    let workbook = XLSX.read(data, { type: "array" });

    let allData = [];

    workbook.SheetNames.forEach(sheetName => {

      let sheet = workbook.Sheets[sheetName];
      let json = XLSX.utils.sheet_to_json(sheet);

      json.forEach(row => {
        allData.push({
          block: sheetName,
          floor: Number(row.floor),
          date: row.date
        });
      });
    });

    localStorage.setItem("scheduleData", JSON.stringify(allData));

    document.getElementById("uploadMsg").innerText =
      "✅ Schedule Uploaded Successfully!";
  };

  reader.readAsArrayBuffer(file);
};


// ===================================================
// 🔙 LOGOUT
// ===================================================
window.logout = function() {
  window.location.href = "index.html";
};

//login page back
window.back = function() {
  window.location.href = "index.html";
};

// 🔁 MODIFY LAUNDRY
window.modifyLaundry = async function() {

  let token = document.getElementById("token").value.trim();
  let newSlot = document.getElementById("slot").value;
  let newCount = document.getElementById("count").value;

  if (!token) {
    alert("Enter token");
    return;
  }

  const querySnapshot = await getDocs(collection(db, "bookings"));

  let found = false;

  for (let docSnap of querySnapshot.docs) {
    let data = docSnap.data();

    if (data.token === token) {
      found = true;

      await updateDoc(doc(db, "bookings", docSnap.id), {
        slot: newSlot,
        clothes: newCount
      });

      document.getElementById("msg").innerText =
        "✅ Updated successfully!";
      break;
    }
  }

  if (!found) {
    document.getElementById("msg").innerText =
      "❌ Invalid Token";
  }
};

//cancel in modify laundry
window.cancelLaundry = async function() {
  let token = document.getElementById("token").value.trim();

  const querySnapshot = await getDocs(collection(db, "bookings"));

  for (let docSnap of querySnapshot.docs) {
    let data = docSnap.data();

    if (data.token === token) {
      await updateDoc(doc(db, "bookings", docSnap.id), {
        status: "Cancelled"
      });

      alert("Booking Cancelled");
      return;
    }
  }

  alert("Invalid Token");
};

// 🔁 MODIFY LAUNDRY (CHANGE SLOT + DATE)
window.modifyLaundry = async function() {

  let token = document.getElementById("token").value.trim();
  let newSlot = document.getElementById("slot").value;
  let dayChange = parseInt(document.getElementById("dayChange").value);

  if (!token) {
    alert("Enter token");
    return;
  }

  const querySnapshot = await getDocs(collection(db, "bookings"));

  let found = false;

  for (let docSnap of querySnapshot.docs) {
    let data = docSnap.data();

    if (data.token === token) {
      found = true;

      // 🔥 CALCULATE NEW DATE
      let today = new Date();
      today.setDate(today.getDate() + dayChange);

      let newDate =
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, '0') + "-" +
        String(today.getDate()).padStart(2, '0');

      await updateDoc(doc(db, "bookings", docSnap.id), {
        slot: newSlot,
        date: newDate
      });

      document.getElementById("msg").innerText =
        "✅ Updated successfully!";
      break;
    }
  }

  if (!found) {
    document.getElementById("msg").innerText =
      "❌ Invalid Token";
  }
};