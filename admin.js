// ========================================
// API DAFTAR TAMU
// ========================================

const GUEST_API =
  "https://script.google.com/macros/s/AKfycbwTnqFyV4DbCstnwdfk6mch1vV_e3ZBTTdZQF9O39fKt99jjBvPmUsk0rnac-AXo-1vaA/exec";

const API_URL = GUEST_API;

// ========================================
// TOKEN ADMIN
// ========================================

const ADMIN_TOKEN = sessionStorage.getItem("adminToken");

// ========================================
// CEK LOGIN AWAL
// ========================================

if (!ADMIN_TOKEN) {
  window.location.replace("admin-login.html");
}

// ========================================
// DATA
// ========================================

let semuaGuests = [];
let semuaRSVP = [];
let semuaUcapan = [];

// ========================================
// CEK RESPONSE AUTH
// ========================================

function cekAuth(result) {
  if (result && result.result === "unauthorized") {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUsername");

    alert("Sesi login telah berakhir. Silakan login kembali.");

    window.location.replace("admin-login.html");

    return false;
  }

  return true;
}

// ========================================
// API GET
// ========================================

async function apiGet(action) {
  if (!ADMIN_TOKEN) {
    window.location.replace("admin-login.html");
    return null;
  }

  try {
    const url =
      GUEST_API +
      "?action=" +
      encodeURIComponent(action) +
      "&token=" +
      encodeURIComponent(ADMIN_TOKEN);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("HTTP Error " + response.status);
    }

    const result = await response.json();

    if (!cekAuth(result)) {
      return null;
    }

    return result;
  } catch (error) {
    console.error("API GET Error:", error);
    throw error;
  }
}

// ========================================
// API POST
// ========================================

async function apiPost(data) {
  if (!ADMIN_TOKEN) {
    window.location.replace("admin-login.html");
    return null;
  }

  try {
    const response = await fetch(GUEST_API, {
      method: "POST",

      body: JSON.stringify({
        ...data,
        token: ADMIN_TOKEN,
      }),
    });

    if (!response.ok) {
      throw new Error("HTTP Error " + response.status);
    }

    const result = await response.json();

    if (!cekAuth(result)) {
      return null;
    }

    return result;
  } catch (error) {
    console.error("API POST Error:", error);
    throw error;
  }
}

// ========================================
// AMBIL DAFTAR TAMU
// ========================================

async function loadGuests() {
  try {
    const result = await apiGet("getGuests");

    if (!result) {
      return;
    }

    console.log("Response daftar tamu:", result);

    if (result.result !== "success") {
      throw new Error(result.message || "Gagal mengambil data tamu.");
    }

    // API baru menggunakan result.data
    semuaGuests = Array.isArray(result.data) ? result.data : [];

    // Tampilkan daftar
    tampilkanGuests(semuaGuests);

    // Update statistik
    updateStatistik(semuaGuests);

    // Update semua statistik dashboard
    updateStatistikDashboard();
  } catch (error) {
    console.error("Gagal mengambil daftar tamu:", error);

    const tbody = document.getElementById("guest-list");

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td
            colspan="5"
            class="text-center py-8 text-red-500"
          >
            Gagal mengambil data tamu.
          </td>
        </tr>
      `;
    }
  }
}

// ========================================
// TAMPILKAN DAFTAR TAMU
// ========================================

function tampilkanGuests(guests) {
  const tbody = document.getElementById("guest-list");

  if (!tbody) {
    console.error("Element #guest-list tidak ditemukan.");
    return;
  }

  tbody.innerHTML = "";

  // ========================================
  // TIDAK ADA TAMU
  // ========================================

  if (!guests || guests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="5"
          class="text-center py-8 text-gray-500"
        >
          Tidak ada tamu ditemukan.
        </td>
      </tr>
    `;

    return;
  }

  // ========================================
  // TAMPILKAN TAMU
  // ========================================

  guests.forEach(function (guest, index) {
    const status = guest.status || "Belum Dikirim";

    let statusClass = "bg-gray-100 text-gray-600";

    if (status === "Sudah Dikirim") {
      statusClass = "bg-green-100 text-green-700";
    }

    tbody.innerHTML += `
      <tr class="border-b hover:bg-gray-50">

        <!-- NO -->
        <td class="px-4 py-4 text-sm">
          ${guest.no || index + 1}
        </td>

        <!-- NAMA -->
        <td class="px-4 py-4">
          <div class="font-semibold text-gray-800">
            ${escapeHTML(guest.nama)}
          </div>
        </td>

        <!-- LINK -->
        <td class="px-4 py-4">

          <div class="flex items-center gap-2">

            <button
              onclick="copyLink('${escapeAttribute(guest.link)}')"
              class="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-xs"
            >
              📋 Copy
            </button>

            <a
              href="${escapeAttribute(guest.link)}"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 hover:underline text-xs"
            >
              Lihat
            </a>

          </div>

        </td>

        <!-- STATUS -->
        <td class="px-4 py-4">

          <select
            onchange="updateGuestStatus(${guest.row}, this.value)"
            class="status-select ${statusClass} border-0 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1"
          >

            <option
              value="Belum Dikirim"
              ${status === "Belum Dikirim" ? "selected" : ""}
            >
              Belum Dikirim
            </option>

            <option
              value="Sudah Dikirim"
              ${status === "Sudah Dikirim" ? "selected" : ""}
            >
              Sudah Dikirim
            </option>

          </select>

        </td>

        <!-- AKSI -->
        <td class="px-4 py-4">

          <div class="flex flex-wrap gap-2">

            <!-- EDIT -->
            <button
              onclick="editGuest(
                ${guest.row},
                '${escapeAttribute(guest.nama)}',
                '${escapeAttribute(guest.nomorWA)}'
              )"
              class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
            >
              ✏️ Edit
            </button>

            <!-- WHATSAPP -->
            <button
              onclick="sendWhatsApp(
                '${escapeAttribute(guest.nama)}',
                '${escapeAttribute(guest.nomorWA)}',
                '${escapeAttribute(guest.link)}',
                ${guest.row}
              )"
              class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
            >
              💬 WhatsApp
            </button>

            <!-- HAPUS -->
            <button
              onclick="deleteGuest(
                ${guest.row},
                '${escapeAttribute(guest.nama)}'
              )"
              class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
            >
              🗑️ Hapus
            </button>

          </div>

        </td>

      </tr>
    `;
  });
}

// ========================================
// STATISTIK TAMU
// ========================================

function updateStatistik(guests) {
  const total = guests.length;

  const sudahDikirim = guests.filter(function (guest) {
    return guest.status === "Sudah Dikirim";
  }).length;

  const belumDikirim = total - sudahDikirim;

  const totalElement = document.getElementById("total-tamu");
  const sudahElement = document.getElementById("sudah-dikirim");
  const belumElement = document.getElementById("belum-dikirim");

  if (totalElement) {
    totalElement.textContent = total;
  }

  if (sudahElement) {
    sudahElement.textContent = sudahDikirim;
  }

  if (belumElement) {
    belumElement.textContent = belumDikirim;
  }
}

// ========================================
// PENCARIAN TAMU
// ========================================

function cariTamu() {
  const input = document.getElementById("searchTamu");

  if (!input) {
    return;
  }

  const keyword = input.value.trim().toLowerCase();

  const hasil = semuaGuests.filter(function (guest) {
    return String(guest.nama || "")
      .toLowerCase()
      .includes(keyword);
  });

  tampilkanGuests(hasil);
}

// ========================================
// COPY LINK
// ========================================

async function copyLink(link) {
  try {
    await navigator.clipboard.writeText(link);

    alert("Link undangan berhasil disalin!");
  } catch (error) {
    console.error(error);

    alert("Gagal menyalin link.");
  }
}

// ========================================
// WHATSAPP
// ========================================

async function sendWhatsApp(nama, nomorWA, link, row) {
  // ========================================
  // CEK NOMOR
  // ========================================

  if (!nomorWA) {
    alert("Nomor WhatsApp tamu belum tersedia.");
    return;
  }

  // ========================================
  // PESAN
  // ========================================

  const pesan = `Assalamu'alaikum ${nama},

Dengan penuh kebahagiaan, kami mengundang Anda untuk hadir dalam acara pernikahan kami.

Silakan membuka undangan melalui link berikut:

${link}

Merupakan suatu kehormatan bagi kami apabila Anda dapat hadir.

Terima kasih 🙏`;

  // ========================================
  // LINK WHATSAPP
  // ========================================

  const whatsappURL =
    "https://wa.me/" + nomorWA + "?text=" + encodeURIComponent(pesan);

  // ========================================
  // BUKA WHATSAPP
  // ========================================

  window.open(whatsappURL, "_blank");

  // ========================================
  // UPDATE STATUS
  // ========================================

  try {
    const result = await apiPost({
      type: "updateStatus",
      row: row,
      status: "Sudah Dikirim",
    });

    console.log("Response update status:", result);

    if (!result) {
      return;
    }

    if (result.result === "success") {
      console.log("Status berhasil diubah menjadi Sudah Dikirim.");

      await loadGuests();
    } else {
      console.error("Gagal update status:", result);

      alert(result.message || "Gagal memperbarui status tamu.");
    }
  } catch (error) {
    console.error("Error update status:", error);

    alert("WhatsApp berhasil dibuka, tetapi status tamu gagal diperbarui.");
  }
}

// ========================================
// UPDATE STATUS TAMU
// ========================================

async function updateGuestStatus(row, status) {
  if (!row) {
    alert("Baris tamu tidak valid.");
    return;
  }

  if (!status) {
    alert("Status tidak boleh kosong.");
    return;
  }

  try {
    const result = await apiPost({
      type: "updateStatus",
      row: row,
      status: status,
    });

    console.log("Response update status:", result);

    if (!result) {
      return;
    }

    if (result.result === "success") {
      console.log("Status berhasil diperbarui.");

      await loadGuests();
    } else {
      alert(result.message || "Gagal memperbarui status.");

      await loadGuests();
    }
  } catch (error) {
    console.error("Error update status:", error);

    alert("Terjadi kesalahan saat memperbarui status.");

    await loadGuests();
  }
}

// ========================================
// TAMBAH TAMU
// ========================================

async function tambahTamu() {
  const inputNama = document.getElementById("namaTamu");

  const inputWA = document.getElementById("nomorWA");

  if (!inputNama || !inputWA) {
    console.error("Input nama atau nomor WhatsApp tidak ditemukan.");

    return;
  }

  const nama = inputNama.value.trim();

  const nomorWA = inputWA.value.trim();

  // ========================================
  // VALIDASI NAMA
  // ========================================

  if (!nama) {
    alert("Masukkan nama tamu terlebih dahulu.");

    inputNama.focus();

    return;
  }

  // ========================================
  // VALIDASI NOMOR
  // ========================================

  if (!nomorWA) {
    alert("Masukkan nomor WhatsApp terlebih dahulu.");

    inputWA.focus();

    return;
  }

  if (!/^[0-9]+$/.test(nomorWA)) {
    alert(
      "Nomor WhatsApp hanya boleh berisi angka.\n\n" + "Contoh:\n628123456789"
    );

    inputWA.focus();

    return;
  }

  // ========================================
  // KONFIRMASI
  // ========================================

  const yakin = confirm(
    "Tambahkan tamu berikut?\n\n" +
      "Nama: " +
      nama +
      "\n" +
      "WhatsApp: " +
      nomorWA
  );

  if (!yakin) {
    return;
  }

  // ========================================
  // KIRIM KE APPS SCRIPT
  // ========================================

  try {
    const result = await apiPost({
      type: "addGuest",
      nama: nama,
      nomorWA: nomorWA,
    });

    console.log("Response tambah tamu:", result);

    if (!result) {
      return;
    }

    if (result.result === "success") {
      alert("✅ Tamu berhasil ditambahkan!");

      inputNama.value = "";
      inputWA.value = "";

      await loadGuests();
    } else {
      alert(result.message || "Gagal menambahkan tamu.");
    }
  } catch (error) {
    console.error("Error tambah tamu:", error);

    alert("Terjadi kesalahan saat menambahkan tamu.");
  }
}

// ========================================
// EDIT TAMU
// ========================================

async function editGuest(row, namaLama, nomorLama) {
  // ========================================
  // NAMA BARU
  // ========================================

  const namaBaru = prompt("Masukkan nama tamu:", namaLama);

  if (namaBaru === null) {
    return;
  }

  const nama = namaBaru.trim();

  if (!nama) {
    alert("Nama tamu tidak boleh kosong.");

    return;
  }

  // ========================================
  // NOMOR BARU
  // ========================================

  const nomorBaru = prompt("Masukkan nomor WhatsApp:", nomorLama);

  if (nomorBaru === null) {
    return;
  }

  const nomorWA = nomorBaru.trim();

  if (!nomorWA) {
    alert("Nomor WhatsApp tidak boleh kosong.");

    return;
  }

  if (!/^[0-9]+$/.test(nomorWA)) {
    alert("Nomor WhatsApp hanya boleh berisi angka.");

    return;
  }

  // ========================================
  // KONFIRMASI
  // ========================================

  const yakin = confirm(
    "Simpan perubahan?\n\n" + "Nama: " + nama + "\n" + "WhatsApp: " + nomorWA
  );

  if (!yakin) {
    return;
  }

  // ========================================
  // KIRIM KE APPS SCRIPT
  // ========================================

  try {
    const result = await apiPost({
      type: "updateGuest",
      row: row,
      nama: nama,
      nomorWA: nomorWA,
    });

    console.log("Response update tamu:", result);

    if (!result) {
      return;
    }

    if (result.result === "success") {
      alert("✅ Data tamu berhasil diperbarui!");

      await loadGuests();
    } else {
      alert(result.message || "Gagal memperbarui data tamu.");
    }
  } catch (error) {
    console.error("Error edit tamu:", error);

    alert("Terjadi kesalahan saat memperbarui tamu.");
  }
}

// ========================================
// HAPUS TAMU
// ========================================

async function deleteGuest(row, nama) {
  const yakin = confirm(
    "Apakah Anda yakin ingin menghapus tamu ini?\n\n" +
      "Nama: " +
      nama +
      "\n\n" +
      "Data yang dihapus tidak dapat dikembalikan."
  );

  if (!yakin) {
    return;
  }

  try {
    const result = await apiPost({
      type: "deleteGuest",
      row: row,
    });

    console.log("Response hapus tamu:", result);

    if (!result) {
      return;
    }

    if (result.result === "success") {
      alert("🗑️ Tamu berhasil dihapus.");

      await loadGuests();
    } else {
      alert(result.message || "Gagal menghapus tamu.");
    }
  } catch (error) {
    console.error("Error hapus tamu:", error);

    alert("Terjadi kesalahan saat menghapus tamu.");
  }
}

// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ========================================
// ESCAPE ATTRIBUTE
// ========================================

function escapeAttribute(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

// ========================================
// EVENT HALAMAN
// ========================================

document.addEventListener("DOMContentLoaded", function () {
  // ========================================
  // LOAD DATA
  // ========================================

  loadGuests();
  loadRSVP();
  loadUcapan();

  // ========================================
  // LOGOUT
  // ========================================

  const btnLogout = document.getElementById("btnLogout");

  if (btnLogout) {
    btnLogout.addEventListener("click", logoutAdmin);
  }

  // ========================================
  // TOMBOL TAMBAH
  // ========================================

  const tombolTambah = document.getElementById("btnTambahTamu");

  if (tombolTambah) {
    tombolTambah.addEventListener("click", tambahTamu);
  } else {
    console.error("Tombol #btnTambahTamu tidak ditemukan.");
  }

  // ========================================
  // SEARCH
  // ========================================

  const searchInput = document.getElementById("searchTamu");

  if (searchInput) {
    searchInput.addEventListener("input", cariTamu);
  }
});

// ========================================
// LOGOUT
// ========================================

async function logoutAdmin() {
  const yakin = confirm("Apakah Anda yakin ingin logout?");

  if (!yakin) {
    return;
  }

  try {
    await apiPost({
      type: "logoutAdmin",
    });
  } catch (error) {
    console.error("Error logout:", error);
  }

  // ========================================
  // HAPUS SESSION
  // ========================================

  sessionStorage.removeItem("adminToken");

  sessionStorage.removeItem("adminUsername");

  // ========================================
  // KEMBALI LOGIN
  // ========================================

  window.location.replace("admin-login.html");
}

// ========================================
// LOAD DATA RSVP
// ========================================

async function loadRSVP() {
  try {
    const result = await apiGet("getRSVP");

    if (!result) {
      return;
    }

    console.log("Data RSVP:", result);

    if (result.result !== "success") {
      console.error("Gagal mengambil data RSVP:", result.message);

      return;
    }

    // ========================================
    // SIMPAN DATA RSVP
    // ========================================

    semuaRSVP = Array.isArray(result.data) ? result.data : [];

    // ========================================
    // TAMPILKAN RSVP
    // ========================================

    tampilkanRSVP(semuaRSVP);

    // ========================================
    // UPDATE DASHBOARD
    // ========================================

    updateStatistikDashboard();
  } catch (error) {
    console.error("Error load RSVP:", error);
  }
}

// ========================================
// LOAD DATA UCAPAN
// ========================================

async function loadUcapan() {
  try {
    const result = await apiGet("getUcapan");

    if (!result) {
      return;
    }

    console.log("Data Ucapan:", result);

    if (result.result !== "success") {
      console.error("Gagal mengambil data ucapan:", result.message);

      return;
    }

    // ========================================
    // SIMPAN DATA UCAPAN
    // ========================================

    semuaUcapan = Array.isArray(result.data) ? result.data : [];

    // ========================================
    // TAMPILKAN UCAPAN
    // ========================================

    tampilkanUcapan(semuaUcapan);

    // ========================================
    // UPDATE DASHBOARD
    // ========================================

    updateStatistikDashboard();
  } catch (error) {
    console.error("Error load Ucapan:", error);
  }
}

// ========================================
// STATISTIK DASHBOARD
// ========================================

function updateStatistikDashboard() {
  // ========================================
  // TOTAL TAMU
  // ========================================

  const totalTamu = semuaGuests.length;

  // ========================================
  // SUDAH DIKIRIM
  // ========================================

  const sudahDikirim = semuaGuests.filter(function (guest) {
    return guest.status === "Sudah Dikirim";
  }).length;

  // ========================================
  // BELUM DIKIRIM
  // ========================================

  const belumDikirim = totalTamu - sudahDikirim;

  // ========================================
  // TOTAL RSVP
  // ========================================

  const totalRSVP = semuaRSVP.length;

  // ========================================
  // TOTAL HADIR
  // ========================================

  let totalHadir = 0;

  // ========================================
  // TOTAL TIDAK HADIR
  // ========================================

  let totalTidakHadir = 0;

  semuaRSVP.forEach(function (item) {
    const status = String(item.kehadiran || "")
      .trim()
      .toLowerCase();

    const jumlah = Number(item.jumlah) || 0;

    if (status === "hadir") {
      totalHadir += jumlah;
    }

    if (status === "tidak hadir") {
      totalTidakHadir += jumlah;
    }
  });

  // ========================================
  // TOTAL UCAPAN
  // ========================================

  const totalUcapan = semuaUcapan.length;

  // ========================================
  // ELEMENT HTML
  // ========================================

  const totalTamuElement = document.getElementById("total-tamu");

  const sudahDikirimElement = document.getElementById("sudah-dikirim");

  const belumDikirimElement = document.getElementById("belum-dikirim");

  const totalRSVPElement = document.getElementById("total-rsvp");

  const totalHadirElement = document.getElementById("total-hadir");

  const totalTidakHadirElement = document.getElementById("total-tidak-hadir");

  const totalUcapanElement = document.getElementById("total-ucapan");

  // ========================================
  // TAMPILKAN
  // ========================================

  if (totalTamuElement) {
    totalTamuElement.textContent = totalTamu;
  }

  if (sudahDikirimElement) {
    sudahDikirimElement.textContent = sudahDikirim;
  }

  if (belumDikirimElement) {
    belumDikirimElement.textContent = belumDikirim;
  }

  if (totalRSVPElement) {
    totalRSVPElement.textContent = totalRSVP;
  }

  if (totalHadirElement) {
    totalHadirElement.textContent = totalHadir + " orang";
  }

  if (totalTidakHadirElement) {
    totalTidakHadirElement.textContent = totalTidakHadir + " orang";
  }

  if (totalUcapanElement) {
    totalUcapanElement.textContent = totalUcapan;
  }
}

// ========================================
// TAMPILKAN RSVP
// ========================================

function tampilkanRSVP(data) {
  const container = document.getElementById("rsvpList");

  if (!container) {
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        Belum ada data RSVP.
      </div>
    `;

    return;
  }

  container.innerHTML = data
    .map(function (item, index) {
      return `
            <div class="border-b border-gray-100 py-4">

              <div class="flex justify-between items-start gap-3">

                <div>

                  <div class="font-semibold text-gray-800">
                    ${escapeHTML(item.nama)}
                  </div>

                  <div class="text-sm text-gray-500 mt-1">
                    ${escapeHTML(item.kehadiran)}
                  </div>

                </div>

                <div class="text-sm font-semibold text-gray-600">
                  ${item.jumlah} orang
                </div>

              </div>

              <div class="text-xs text-gray-400 mt-2">
                ${formatTanggal(item.waktu)}
              </div>

            </div>
          `;
    })
    .join("");
}

// ========================================
// TAMPILKAN UCAPAN
// ========================================

function tampilkanUcapan(data) {
  const container = document.getElementById("ucapanList");

  if (!container) {
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        Belum ada ucapan.
      </div>
    `;

    return;
  }

  container.innerHTML = data
    .map(function (item) {
      return `
            <div class="border-b border-gray-100 py-4">

              <div class="font-semibold text-gray-800">
                ${escapeHTML(item.nama)}
              </div>

              <div class="text-sm text-gray-600 mt-2 leading-relaxed">
                ${escapeHTML(item.ucapan)}
              </div>

              <div class="text-xs text-gray-400 mt-2">
                ${formatTanggal(item.waktu)}
              </div>

            </div>
          `;
    })
    .join("");
}

// ========================================
// FORMAT TANGGAL
// ========================================

function formatTanggal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ========================================
// AUTO REFRESH DATA ADMIN
// ========================================

let autoRefreshAktif = true;
let sedangMemuatData = false;

async function autoRefreshDashboard() {
  // Jangan jalankan jika proses sebelumnya belum selesai
  if (sedangMemuatData) {
    return;
  }

  sedangMemuatData = true;

  try {
    await Promise.all([loadGuests(), loadRSVP(), loadUcapan()]);

    console.log("🔄 Data admin diperbarui otomatis.");
  } catch (error) {
    console.error("Auto refresh gagal:", error);
  } finally {
    sedangMemuatData = false;
  }
}

// Jalankan setiap 5 detik
setInterval(function () {
  if (!autoRefreshAktif) {
    return;
  }

  autoRefreshDashboard();
}, 5000);
