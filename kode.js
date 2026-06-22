function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Buku Nilai Harian')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setFaviconUrl('https://i.postimg.cc/FK7R0fTb/logo-jember3.png')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

// ==========================================
// PENGATURAN FOLDER DRIVE
// ==========================================
// Ambil ID Folder Google Drive dari Script Properties
function getFolderId() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('FOLDER_ID_LOGO');
}

// ==========================================
// FUNGSI PANCINGAN OTORISASI DRIVE
// ==========================================
// Jalankan fungsi ini SATU KALI dari editor Apps Script untuk memunculkan pop-up izin Google Drive.
function otorisasiDrive() {
  try {
    // Pastikan untuk mengisi properti FOLDER_ID_LOGO jika ingin tes spesifik folder
    var folderId = getFolderId();
    var folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
    var dummyFile = folder.createFile('Test_Otorisasi.txt', 'Ini adalah file tes untuk memancing izin Google Drive.', MimeType.PLAIN_TEXT);
    Logger.log("Otorisasi berhasil! File tes berhasil dibuat dengan ID: " + dummyFile.getId());
    // Hapus file tes setelah berhasil
    dummyFile.setTrashed(true);
    Logger.log("File tes berhasil dihapus. Sistem siap digunakan!");
  } catch (e) {
    Logger.log("Error otorisasi (Mungkin ID folder salah atau izin ditolak): " + e.toString());
  }
}

// ==========================================
// OTENTIKASI & LOGIN
// ==========================================
function doLogin(username, password) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dataUser = getSheetDataAsObject(ss, 'Data_User');

  var inputUser = String(username).trim().toLowerCase();
  var inputPwd = String(password).trim();

  Logger.log("Mencoba login: User=" + inputUser + ", Pwd=" + inputPwd);

  for (var i = 0; i < dataUser.length; i++) {
    var sheetUser = String(dataUser[i]['Username']).trim().toLowerCase();
    var sheetPwd = String(dataUser[i]['Password']).trim();

    if (sheetUser === inputUser && sheetPwd === inputPwd) {
      Logger.log("Kredensial cocok! Role=" + dataUser[i]['Role']);
      var role = dataUser[i]['Role'];
      var refId = String(dataUser[i]['Ref_ID']).trim();
      var refIdLower = refId.toLowerCase();

      if (role === 'Admin') {
        return { status: 'success', role: 'Admin', user: dataUser[i] };
      }
      else if (role === 'Guru') {
        var dataGuru = getSheetDataAsObject(ss, 'Data_Guru');
        var profileGuru = null;
        var allClasses = [];

        for (var j = 0; j < dataGuru.length; j++) {
          var nipGuru = String(dataGuru[j]['NIP Guru']).trim().toLowerCase();
          var namaGuru = String(dataGuru[j]['Nama Guru']).trim().toLowerCase();

          // Ref_ID mencocokkan NIP Guru ATAU Nama Guru
          if (nipGuru === refIdLower || namaGuru === refIdLower) {
            Logger.log("Menemukan baris Guru: " + dataGuru[j]['Nama Guru'] + " | NIP: " + dataGuru[j]['NIP Guru']);

            // Prioritaskan baris di mana Nama Guru juga mirip dengan Username (untuk membedakan jika NIP sama)
            if (!profileGuru) {
              profileGuru = dataGuru[j];
            } else if (namaGuru.indexOf(inputUser) !== -1) {
              profileGuru = dataGuru[j]; // Ganti profil jika nama gurunya mengandung username
            }

            // Kumpulkan semua kelas
            var kls = String(dataGuru[j]['Wali Kelas'] || '').trim();
            if (kls) {
              var splitKls = kls.split(',');
              for (var k = 0; k < splitKls.length; k++) {
                var singleKls = splitKls[k].trim();
                if (singleKls && allClasses.indexOf(singleKls) === -1) {
                  allClasses.push(singleKls);
                }
              }
            }
          }
        }

        if (profileGuru) {
          Logger.log("Profil Guru Terpilih: " + profileGuru['Nama Guru']);
          var aksesKelasUser = String(dataUser[i]['Akses_Kelas'] || '').trim();
          var usernameStr = sheetUser;

          var aksesMapelUser = String(dataUser[i]['Akses_Mapel'] || '').trim();
          if (aksesMapelUser) {
            profileGuru['Akses_Mapel'] = aksesMapelUser;
          }

          if (aksesKelasUser) {
            profileGuru['Wali Kelas'] = aksesKelasUser;
          } else {
            // Coba ambil kelas langsung dari baris profil ini saja (1 username 1 kelas sesuai baris guru tsb)
            var currentKls = String(profileGuru['Wali Kelas'] || '').trim();

            if (currentKls && currentKls.indexOf(',') === -1) {
              // Jika hanya ada 1 kelas di baris ini, gunakan ini!
              // (Tidak digabung dengan kelas dari guru lain yang ber-NIP sama)
            } else {
              // Fallback: cek kecocokan username dengan nama kelas
              var matchedClass = null;
              for (var c = 0; c < allClasses.length; c++) {
                if (allClasses[c].toLowerCase() === usernameStr) {
                  matchedClass = allClasses[c];
                  break;
                }
              }
              if (matchedClass) {
                profileGuru['Wali Kelas'] = matchedClass;
              } else {
                profileGuru['Wali Kelas'] = currentKls || allClasses.join(', ');
              }
            }
          }
          return { status: 'success', role: 'Guru', guru: profileGuru };
        } else {
          Logger.log("Ref_ID tidak ditemukan: " + refId);
          return { status: 'error', message: 'DEBUG GAGAL: Ref_ID [' + refId + '] tidak ada di Data_Guru! NIP/Nama tidak cocok.' };
        }
      }
    }
  }

  Logger.log("Username/Password salah. InputUser: " + inputUser + ", InputPwd: " + inputPwd);
  return { status: 'error', message: 'Username atau Password yang Anda masukkan keliru/tidak terdaftar.' };
}

// ==========================================
// FUNGSI GURU (MODE MASSAL MULTI-MAPEL)
// ==========================================
function getInitGuruData(kelas) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var mapel = getSheetDataAsObject(ss, 'Data_Mapel');
  var sekolah = getSheetDataAsObject(ss, 'Data_Sekolah');
  var objSekolah = sekolah.length > 0 ? sekolah[0] : {};

  // Ambil Fase spesifik untuk kelas guru ini
  var dataKelas = getSheetDataAsObject(ss, 'Data_Kelas');
  for (var i = 0; i < dataKelas.length; i++) {
    if (String(dataKelas[i]['Nama Kelas']).toLowerCase() === String(kelas).toLowerCase()) {
      objSekolah['Fase'] = dataKelas[i]['Fase'];
      break;
    }
  }

  var users = getSheetDataAs2DArray(ss, 'Data_User');
  var exclusiveMapels = [];
  if (users && users.length > 1) {
    var headers = users[0];
    var mapelIdx = headers.indexOf('Akses_Mapel');
    if (mapelIdx !== -1) {
      for (var i = 1; i < users.length; i++) {
        var am = String(users[i][mapelIdx] || '').trim().toLowerCase();
        if (am) {
          var parts = am.split(',');
          for (var p = 0; p < parts.length; p++) {
            exclusiveMapels.push(parts[p].trim());
          }
        }
      }
    }
  }

  return {
    mapelList: mapel,
    sekolah: objSekolah,
    exclusiveMapels: exclusiveMapels,
    dataKelas: dataKelas
  };
}

function getGuruMassalData(kelas, arrayMapel) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetSiswa = ss.getSheetByName('Data_Siswa');
  var allSiswa = sheetSiswa.getDataRange().getValues();

  var sheetNilai = ss.getSheetByName('Data_Nilai');
  var allNilai = sheetNilai ? sheetNilai.getDataRange().getValues() : [];

  var resultData = {};
  var activeMapelsOutput = [];
  var babData = {};

  var kelasArr = String(kelas).split(',').map(function (k) { return k.trim(); }).filter(function (k) { return k; });

  for (var kIdx = 0; kIdx < kelasArr.length; kIdx++) {
    var kls = kelasArr[kIdx];
    var targetKelasLower = kls.toLowerCase();

    var siswaRows = [];
    for (var r = 1; r < allSiswa.length; r++) {
      if (String(allSiswa[r][4]).trim().toLowerCase() === targetKelasLower) {
        siswaRows.push(allSiswa[r]);
      }
    }

    var komponenSet = {};
    var gradeMap = {};

    var lowerArrayMapel = [];
    for (var m = 0; m < arrayMapel.length; m++) {
      komponenSet[arrayMapel[m]] = [];
      lowerArrayMapel.push(String(arrayMapel[m]).trim().toLowerCase());
    }

    if (allNilai.length > 1) {
      for (var i = 1; i < allNilai.length; i++) {
        var nNisn = String(allNilai[i][0]);
        var nMapel = allNilai[i][1];
        var nKelas = String(allNilai[i][2]).trim().toLowerCase();
        var nKomp = allNilai[i][3];
        var nNilai = allNilai[i][4];

        var mapelIdx = lowerArrayMapel.indexOf(String(nMapel).trim().toLowerCase());
        if (nKelas === targetKelasLower && mapelIdx !== -1) {
          var realMapel = arrayMapel[mapelIdx]; // Use the exact case from frontend
          var composite = realMapel + '|||' + nKelas;

          // Periksa apakah ini baris Meta Bab
          if (nNisn === 'META_BAB') {
            if (!babData[composite]) babData[composite] = {};
            babData[composite][nKomp] = nNilai;
            continue; // Skip adding to gradeMap or komponenSet
          }

          if (komponenSet[realMapel].indexOf(nKomp) === -1) {
            komponenSet[realMapel].push(nKomp);
          }
          if (!gradeMap[nNisn]) gradeMap[nNisn] = {};
          if (!gradeMap[nNisn][realMapel]) gradeMap[nNisn][realMapel] = {};
          gradeMap[nNisn][realMapel][nKomp] = nNilai;
        }
      }
    }

    for (var m = 0; m < arrayMapel.length; m++) {
      var mapel = arrayMapel[m];
      var dynamicCols = komponenSet[mapel];
      var frontendHeaders = ['NO', 'NISN', 'Nama Siswa', 'L/P'].concat(dynamicCols);
      var frontendNilai = [frontendHeaders];
      var noUrut = 1;

      for (var i = 0; i < siswaRows.length; i++) {
        var sRow = siswaRows[i];
        var nisn = String(sRow[1]);
        var rowArray = [
          noUrut++,
          nisn,
          sRow[2],
          sRow[3]
        ];

        for (var j = 0; j < dynamicCols.length; j++) {
          var komp = dynamicCols[j];
          var val = (gradeMap[nisn] && gradeMap[nisn][mapel] && gradeMap[nisn][mapel][komp] !== undefined) ? gradeMap[nisn][mapel][komp] : '';
          rowArray.push(val);
        }
        frontendNilai.push(rowArray);
      }

      var compositeKey = mapel + '|||' + kls;
      resultData[compositeKey] = frontendNilai;
      activeMapelsOutput.push(compositeKey);
    }
  }

  return { status: 'success', dataMultiMapel: resultData, activeMapels: activeMapelsOutput, dataBab: babData };
}

function saveGuruMassalData(kelas, mapelData, mapelBab) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNilai = ss.getSheetByName('Data_Nilai');
  if (!sheetNilai) {
    sheetNilai = ss.insertSheet('Data_Nilai');
    sheetNilai.appendRow(['NISN', 'Mapel', 'Kelas', 'Komponen', 'Nilai']);
  }

  var allNilai = sheetNilai.getDataRange().getValues();
  if (allNilai.length === 0) {
    allNilai = [['NISN', 'Mapel', 'Kelas', 'Komponen', 'Nilai']];
  }

  var mapelKeys = Object.keys(mapelData);
  var activeMapels = [];
  var activeClasses = [];
  for (var k = 0; k < mapelKeys.length; k++) {
    var parts = mapelKeys[k].split('|||');
    activeMapels.push((parts[0] || mapelKeys[k]).trim().toLowerCase());
    activeClasses.push((parts[1] || String(kelas)).trim().toLowerCase());
  }

  var newNilai = [allNilai[0]]; // header

  // 1. Keep rows that belong to OTHER mapels or OTHER classes
  for (var i = 1; i < allNilai.length; i++) {
    var rMapel = String(allNilai[i][1]).trim().toLowerCase();
    var rKelas = String(allNilai[i][2]).trim().toLowerCase();

    var shouldDelete = false;
    for (var k = 0; k < activeMapels.length; k++) {
      if (rMapel === activeMapels[k] && rKelas === activeClasses[k]) {
        shouldDelete = true;
        break;
      }
    }

    if (!shouldDelete) {
      newNilai.push(allNilai[i]);
    }
  }

  var totalSavedHeaders = [];

  // 2. Append all new values from mapelData
  for (var m = 0; m < mapelKeys.length; m++) {
    var compositeKey = mapelKeys[m];
    var parts = compositeKey.split('|||');
    var mapel = parts[0] || compositeKey;
    var currentKelas = parts.length > 1 ? parts[1] : String(kelas);

    var frontendNilai = mapelData[compositeKey];
    if (!frontendNilai || frontendNilai.length < 1) continue; // Minimal ada header

    var frontendHeaders = frontendNilai[0];

    // Pastikan tidak ada header kembar dengan menambahkan zero-width space (\u200B)
    var uniqueHeaders = [];
    var seenHeaders = {};
    for (var c = 0; c < frontendHeaders.length; c++) {
      if (c < 4) {
        uniqueHeaders.push(String(frontendHeaders[c]));
        continue;
      }
      var baseKomp = String(frontendHeaders[c]).trim();
      baseKomp = baseKomp.replace(/\u200B/g, '');
      var safeKomp = baseKomp;
      while (seenHeaders[safeKomp]) {
        safeKomp += '\u200B';
      }
      seenHeaders[safeKomp] = true;
      uniqueHeaders.push(safeKomp);
    }

    // Simpan deklarasi (metadata) kolom
    for (var c = 4; c < frontendHeaders.length; c++) {
      var komp = uniqueHeaders[c];
      if (komp) {
        newNilai.push(['-', mapel, currentKelas, komp, '']);
        var cleanName = komp.replace(/\u200B/g, '');
        if (totalSavedHeaders.indexOf(cleanName) === -1) totalSavedHeaders.push(cleanName);
      }
    }

    // Simpan nilai siswa
    for (var fr = 1; fr < frontendNilai.length; fr++) {
      var fRow = frontendNilai[fr];
      var nisn = String(fRow[1]).trim();
      if (!nisn) continue;

      for (var c = 4; c < frontendHeaders.length; c++) {
        var komp = uniqueHeaders[c];
        var val = fRow[c];
        if (val !== '' && val !== null && val !== undefined) {
          newNilai.push([nisn, mapel, currentKelas, komp, val]);
        }
      }
    }

    // Simpan META_BAB
    if (mapelBab && mapelBab[compositeKey]) {
      var babObj = mapelBab[compositeKey];
      for (var kompName in babObj) {
        if (babObj[kompName] && String(babObj[kompName]).trim() !== '') {
          newNilai.push(['META_BAB', mapel, currentKelas, kompName, babObj[kompName]]);
        }
      }
    }
  }

  sheetNilai.clear();
  sheetNilai.getRange(1, 1, newNilai.length, newNilai[0].length).setValues(newNilai);

  return "Berhasil! Kolom tersimpan: " + totalSavedHeaders.join(', ');
}

// ==========================================
// FUNGSI ADMIN PANEL
// ==========================================
function getAdminData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Pastikan Data_Kelas ada, jika belum buat otomatis
  var sheetKelas = ss.getSheetByName('Data_Kelas');
  if (!sheetKelas) {
    sheetKelas = ss.insertSheet('Data_Kelas');
    sheetKelas.appendRow(['NO', 'Nama Kelas', 'Fase']);
  }

  // Update Data_User jika Akses_Kelas belum ada
  var sheetUser = ss.getSheetByName('Data_User');
  if (sheetUser) {
    var userHeaders = sheetUser.getRange(1, 1, 1, sheetUser.getLastColumn()).getValues()[0];
    if (userHeaders.indexOf('Akses_Kelas') === -1) {
      sheetUser.getRange(1, userHeaders.length + 1).setValue('Akses_Kelas');
      userHeaders.push('Akses_Kelas');
    }
    if (userHeaders.indexOf('Akses_Mapel') === -1) {
      sheetUser.getRange(1, userHeaders.length + 1).setValue('Akses_Mapel');
    }
  }

  var sheetNilai = ss.getSheetByName('Data_Nilai');
  if (!sheetNilai) {
    sheetNilai = ss.insertSheet('Data_Nilai');
    sheetNilai.appendRow(['NISN', 'Mapel', 'Kelas', 'Komponen', 'Nilai']);
  }

  return {
    status: 'success',
    sekolah: getSheetDataAs2DArray(ss, 'Data_Sekolah'),
    user: getSheetDataAs2DArray(ss, 'Data_User'),
    guru: getSheetDataAs2DArray(ss, 'Data_Guru'),
    mapel: getSheetDataAs2DArray(ss, 'Data_Mapel'),
    siswa: getSheetDataAs2DArray(ss, 'Data_Siswa'),
    kelas: getSheetDataAs2DArray(ss, 'Data_Kelas'),
    nilai: getSheetDataAs2DArray(ss, 'Data_Nilai')
  };
}

function getSheetDataAs2DArray(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  return sheet.getDataRange().getValues();
}

function saveAdminSheet(sheetName, data2DArray) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  sheet.clear();
  if (data2DArray && data2DArray.length > 0) {
    sheet.getRange(1, 1, data2DArray.length, data2DArray[0].length).setValues(data2DArray);
  }
  return "Data " + sheetName + " berhasil disimpan!";
}

// ==========================================
// UPLOAD LOGO KE GOOGLE DRIVE
// ==========================================
function uploadLogoToDrive(base64Data, fileName) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Data_Sekolah');
    var sheetFolderId = '';
    try {
      var dataSekolah = getSheetDataAsObject(ss, 'Data_Sekolah');
      if (dataSekolah.length > 0 && dataSekolah[0]['Folder ID Logo']) {
        sheetFolderId = dataSekolah[0]['Folder ID Logo'].trim();
      }
    } catch (e) { }

    // Gunakan Folder ID dari Script Properties jika di sheet kosong
    var defaultFolderId = getFolderId();
    var finalFolderId = sheetFolderId ? sheetFolderId : defaultFolderId;
    var targetFolder;

    try {
      if (finalFolderId !== '') {
        targetFolder = DriveApp.getFolderById(finalFolderId);
      } else {
        targetFolder = DriveApp.getRootFolder();
      }
    } catch (err) {
      targetFolder = DriveApp.getRootFolder(); // Fallback jika ID tidak valid
    }

    var mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
    var rawBase64 = base64Data.split(',')[1];
    var decoded = Utilities.base64Decode(rawBase64);
    var blob = Utilities.newBlob(decoded, mimeString, fileName);

    // Hapus file lama dengan nama yang sama agar tidak menumpuk di Drive
    var existingFiles = targetFolder.getFilesByName(fileName);
    while (existingFiles.hasNext()) {
      try { existingFiles.next().setTrashed(true); } catch (e) { }
    }

    var file = targetFolder.createFile(blob);

    // Jika akun dibatasi kebijakan organisasi (Workspace), fungsi setSharing bisa diblokir.
    // Kita bungkus dengan try-catch agar upload tetap dianggap sukses.
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log("Peringatan: Gagal mengubah setelan privasi file (kemungkinan karena restriksi Workspace). Pesan: " + shareErr);
    }

    // Gunakan format lh3.googleusercontent.com sesuai permintaan
    var url = 'https://lh3.googleusercontent.com/d/' + file.getId();
    return { status: 'success', url: url };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

// ==========================================
// MENGAMBIL LOGO KANAN UNTUK LAYAR LOGIN
// ==========================================
function getLoginLogo() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetSekolah = ss.getSheetByName('Data_Sekolah');
    if (!sheetSekolah) return null;

    var data = sheetSekolah.getDataRange().getValues();
    if (data.length > 1) {
      var headers = data[0];
      var logoRIdx = headers.indexOf('Logo Kanan URL');
      if (logoRIdx !== -1) {
        return data[1][logoRIdx] || null;
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

// ==========================================
// HELPER & INITIALIZATION
// ==========================================
function getSheetDataAsObject(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}

function initDatabase() {
  var folderIdVal = "";
  try {
    var folders = DriveApp.getFoldersByName("Aplikasi Buku Nilai Harian");
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder("Aplikasi Buku Nilai Harian");
      folder.createFolder("Logo Sekolah (Upload Gambar Disini)");
    }

    // Cari folder Logo untuk ID default
    var logoFolders = DriveApp.getFoldersByName("Logo Sekolah (Upload Gambar Disini)");
    if (logoFolders.hasNext()) {
      folderIdVal = logoFolders.next().getId();
    } else {
      folderIdVal = folder.getId();
    }
  } catch (e) {
    // Abaikan jika tidak ada akses DriveApp
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Data Sekolah
  var sheetSekolah = createOrClearSheet(ss, 'Data_Sekolah');
  sheetSekolah.appendRow(['Nama Sekolah', 'NPSN', 'Alamat', 'Logo Kiri URL', 'Logo Kanan URL', 'Kepala Sekolah', 'NIP Kepsek', 'Pangkat Kepsek', 'Semester', 'Tahun Ajaran', 'Lokasi', 'Folder ID Logo']);
  sheetSekolah.appendRow([
    'SD Negeri Mojogemi 02', '20523730', 'Jl. Suger, Sumberlangsat, Mojogemi, Sukowono, Jember',
    'https://lh3.googleusercontent.com/d/1US7loNm7nm_ahvWFv2_GhM0z2OcA9Vxb',
    'https://lh3.googleusercontent.com/d/1zk8HmAubRXf3NC2_fCV2JsJTphrQCvDr',
    'Nunung Kurniawati, S.Pd', '198205112002122005', 'Penata TK. I / IIId', '1 (Ganjil)', '2025/2026', 'Jember', folderIdVal
  ]);

  // 2. Data User (Login System)
  var sheetUser = createOrClearSheet(ss, 'Data_User');
  sheetUser.appendRow(['Username', 'Password', 'Role', 'Ref_ID', 'Akses_Kelas', 'Akses_Mapel']);
  sheetUser.appendRow(['admin', 'admin123', 'Admin', 'admin', '', '']);
  sheetUser.appendRow(['1', '1', 'Guru', '198603142019032011', '1', '']); // Akses Kelas = 1, Akses Mapel = Kosong

  // 3. Data Guru
  var sheetGuru = createOrClearSheet(ss, 'Data_Guru');
  sheetGuru.appendRow(['NIP Guru', 'Nama Guru', 'Pangkat Guru', 'Wali Kelas']);
  sheetGuru.appendRow(['198603142019032011', 'Wiwin Kusmiati, S.Pd', 'Penata Muda Tk. I / III.b', '1']);

  // 4. Data Mapel
  var sheetMapel = createOrClearSheet(ss, 'Data_Mapel');
  sheetMapel.appendRow(['Kode Mapel', 'Nama Mata Pelajaran']);
  sheetMapel.appendRow(['MAT', 'Matematika']);
  sheetMapel.appendRow(['IPA', 'Ilmu Pengetahuan Alam']);
  sheetMapel.appendRow(['B_IND', 'Bahasa Indonesia']);

  // 5. Data Siswa (Master Sheet Identitas)
  var sheetSiswa = createOrClearSheet(ss, 'Data_Siswa');
  sheetSiswa.appendRow(['NIS', 'NISN', 'Nama Siswa', 'L/P', 'Kelas']);
  sheetSiswa.appendRow(['1001', '001', 'Ahmad Dani', 'L', '1']);
  sheetSiswa.appendRow(['1002', '002', 'Bunga Citra', 'P', '1']);

  // 6. Data Nilai (Tabel Transaksi Relasional)
  var sheetNilai = createOrClearSheet(ss, 'Data_Nilai');
  sheetNilai.appendRow(['NISN', 'Mapel', 'Kelas', 'Komponen', 'Nilai']);
  sheetNilai.appendRow(['001', 'Matematika', '1', 'UH 1', 85]);
  sheetNilai.appendRow(['001', 'Matematika', '1', 'UH 2', 90]);
  sheetNilai.appendRow(['001', 'Ilmu Pengetahuan Alam', '1', 'PRAKTEK', 88]);
  sheetNilai.appendRow(['002', 'Matematika', '1', 'UH 1', 90]);
  sheetNilai.appendRow(['002', 'Matematika', '1', 'UH 2', 95]);
  sheetNilai.appendRow(['002', 'Ilmu Pengetahuan Alam', '1', 'PRAKTEK', 92]);

  Logger.log('Inisialisasi Database Sistem Informasi (Admin & Guru) Berhasil!');
  return 'Inisialisasi Database Sistem Informasi (Admin & Guru) Berhasil!';
}

function createOrClearSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) { sheet.clear(); }
  else { sheet = ss.insertSheet(sheetName); }
  return sheet;
}