/**
 * MechMatrix - Mechanical Engineering Skill Matrix & Competency Management System
 * Google Apps Script Backend (Code.gs)
 * 
 * ============================================================================
 * KONFIGURASI DATABASE GOOGLE SHEETS
 * ============================================================================
 * 1. JIKA MENGGUNAKAN CONTAINER-BOUND SCRIPT (Direkomendasikan):
 *    - Buat Google Sheets baru di https://sheets.new
 *    - Klik menu "Extensions" (Ekstensi) > "Apps Script"
 *    - Biarkan SPREADSHEET_ID kosong ('') di bawah ini karena script akan otomatis
 *      mengenali Spreadsheet tempat script ini dibuat.
 * 
 * 2. JIKA MENGGUNAKAN STANDALONE SCRIPT (script.google.com):
 *    - Buat Google Sheet baru, salin ID Spreadsheet dari URL browser Anda:
 *      https://docs.google.com/spreadsheets/d/[SALIN_ID_DISINI]/edit
 *    - Tempelkan ID tersebut pada variabel SPREADSHEET_ID di bawah ini.
 * ============================================================================
 */

// Masukkan ID Spreadsheet jika menggunakan Standalone Script (atau biarkan '' jika Bound Script)
var SPREADSHEET_ID = '';

// ============================================================================
// WEB APP ENTRY POINT
// ============================================================================
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('MechMatrix - Mechanical Engineering Skill Matrix')
    .setFaviconUrl('https://ssl.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================================
// HELPER DATABASE SPREADSHEET
// ============================================================================
function getDbSpreadsheet() {
  // 1. Coba Spreadsheet Aktif (Bound Script)
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  // 2. Coba SPREADSHEET_ID dari konstanta di atas
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
    try {
      return SpreadsheetApp.openById(cleanSpreadsheetId(SPREADSHEET_ID));
    } catch (e) {}
  }

  // 3. Coba ID yang tersimpan di PropertiesService
  try {
    var props = PropertiesService.getUserProperties();
    var savedId = props.getProperty('MECH_SPREADSHEET_ID');
    if (savedId) {
      return SpreadsheetApp.openById(cleanSpreadsheetId(savedId));
    }
  } catch (e) {}

  return null;
}

function cleanSpreadsheetId(input) {
  if (!input) return '';
  input = input.trim();
  // Jika pengguna memasukkan URL lengkap, ekstrak ID-nya
  var match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return input;
}

// Hubungkan Spreadsheet secara dinamis dari antarmuka Web App
function apiConnectSpreadsheet(sheetIdOrUrl) {
  try {
    var cleanId = cleanSpreadsheetId(sheetIdOrUrl);
    if (!cleanId) return { success: false, message: 'ID atau URL Spreadsheet tidak valid.' };

    var ss = SpreadsheetApp.openById(cleanId);
    if (!ss) return { success: false, message: 'Spreadsheet tidak dapat dibuka. Periksa izin akses akun Google Anda.' };

    // Simpan ke UserProperties
    var props = PropertiesService.getUserProperties();
    props.setProperty('MECH_SPREADSHEET_ID', cleanId);

    // Inisialisasi struktur sheet
    ensureSheetsExist(ss);

    return { 
      success: true, 
      message: 'Berhasil terhubung ke spreadsheet: ' + ss.getName(),
      sheetInfo: {
        connected: true,
        name: ss.getName(),
        url: ss.getUrl(),
        id: ss.getId()
      }
    };
  } catch (err) {
    return { success: false, message: 'Gagal menghubungkan: ' + err.toString() };
  }
}

// ============================================================================
// INISIALISASI & STRUKTUR TABEL GOOGLE SHEETS
// ============================================================================
function setupSheets() {
  var ss = getDbSpreadsheet();
  if (!ss) {
    return { 
      success: false, 
      message: 'Spreadsheet tidak ditemukan! Jika menggunakan script standalone, atur SPREADSHEET_ID terlebih dahulu.' 
    };
  }

  ensureSheetsExist(ss);
  return { 
    success: true, 
    message: 'Database Google Sheets "' + ss.getName() + '" berhasil diinisialisasi!',
    url: ss.getUrl()
  };
}

function ensureSheetsExist(ss) {
  if (!ss) return;

  var skillKeys = getDefaultSkillKeys();

  // 1. SHEET: Engineers
  var engSheet = ss.getSheetByName('Engineers');
  if (!engSheet) {
    engSheet = ss.insertSheet('Engineers');
    var engHeaders = [
      'ID', 
      'Nama', 
      'Jabatan', 
      'Departemen', 
      'Tahun_Pengalaman', 
      'Target_Benchmark', 
      'Email', 
      'Avatar_Url', 
      'Certificates_JSON', 
      'SelfAssessments_JSON'
    ];
    engSheet.appendRow(engHeaders);
    engSheet.getRange(1, 1, 1, engHeaders.length)
      .setFontWeight('bold')
      .setBackground('#0f172a')
      .setFontColor('#ffffff');
    engSheet.setFrozenRows(1);

    // Seed data insinyur awal
    var defaultEngs = getDefaultEngineers();
    defaultEngs.forEach(function(e) {
      engSheet.appendRow([
        e.id,
        e.name,
        e.roleTitle,
        e.department,
        e.experienceYears,
        e.targetBenchmark,
        e.email,
        e.avatarUrl || '',
        JSON.stringify(e.certificates || []),
        JSON.stringify(e.selfAssessments || {})
      ]);
    });
  }

  // 2. SHEET: CompetencyMatrix
  var matrixSheet = ss.getSheetByName('CompetencyMatrix');
  if (!matrixSheet) {
    matrixSheet = ss.insertSheet('CompetencyMatrix');
    var matrixHeaders = ['EngineerID', 'EngineerName'].concat(skillKeys);
    matrixSheet.appendRow(matrixHeaders);
    matrixSheet.getRange(1, 1, 1, matrixHeaders.length)
      .setFontWeight('bold')
      .setBackground('#0891b2')
      .setFontColor('#ffffff');
    matrixSheet.setFrozenRows(1);
    matrixSheet.setFrozenColumns(2);

    var defaultEngs = getDefaultEngineers();
    defaultEngs.forEach(function(e) {
      var row = [e.id, e.name];
      skillKeys.forEach(function(k) {
        row.push(e.skills && e.skills[k] !== undefined ? Number(e.skills[k]) : 0);
      });
      matrixSheet.appendRow(row);
    });
  }

  // 3. SHEET: AuditTrail
  var auditSheet = ss.getSheetByName('AuditTrail');
  if (!auditSheet) {
    auditSheet = ss.insertSheet('AuditTrail');
    var auditHeaders = [
      'Timestamp', 
      'EngineerID', 
      'Insinyur', 
      'SkillID', 
      'Kompetensi', 
      'Level_Lama', 
      'Level_Baru', 
      'Diubah_Oleh', 
      'Justifikasi'
    ];
    auditSheet.appendRow(auditHeaders);
    auditSheet.getRange(1, 1, 1, auditHeaders.length)
      .setFontWeight('bold')
      .setBackground('#1e293b')
      .setFontColor('#ffffff');
    auditSheet.setFrozenRows(1);

    var defaultLogs = getDefaultAuditLogs();
    defaultLogs.forEach(function(l) {
      auditSheet.appendRow([
        l.timestamp,
        l.engineerId,
        l.engineerName,
        l.skillId,
        l.skillName,
        l.previousLevel,
        l.newLevel,
        l.updatedBy,
        l.reason
      ]);
    });
  }

  // 4. SHEET: Config (Logo, Brand Name, Subtitle)
  var configSheet = ss.getSheetByName('Config');
  if (!configSheet) {
    configSheet = ss.insertSheet('Config');
    configSheet.appendRow(['Key', 'Value']);
    configSheet.getRange(1, 1, 1, 2)
      .setFontWeight('bold')
      .setBackground('#334155')
      .setFontColor('#ffffff');
    configSheet.setFrozenRows(1);

    configSheet.appendRow(['BRAND_NAME', 'MechMatrix']);
    configSheet.appendRow(['BRAND_SUB', 'Mechanical Engineering Competency Matrix']);
    configSheet.appendRow(['CUSTOM_LOGO', '']);
  }
}

// ============================================================================
// API ENDPOINTS (DIPANGGIL DARI CLIENT / Index.html)
// ============================================================================

function apiGetInitialData() {
  var ss = getDbSpreadsheet();
  
  if (ss) {
    ensureSheetsExist(ss);
    var engineers = readEngineersFromSheet(ss);
    var auditLogs = readAuditLogsFromSheet(ss);
    var config = readConfigFromSheet(ss);

    return {
      engineers: engineers,
      skills: getDefaultSkills(),
      categories: getDefaultCategories(),
      benchmarks: getDefaultBenchmarks(),
      users: getDefaultUsers(),
      auditLogs: auditLogs,
      customLogo: config.CUSTOM_LOGO || '',
      brandName: config.BRAND_NAME || 'MechMatrix',
      brandSub: config.BRAND_SUB || 'Mechanical Engineering Matrix',
      sheetInfo: {
        connected: true,
        name: ss.getName(),
        url: ss.getUrl(),
        id: ss.getId()
      }
    };
  }

  // Fallback jika belum ada spreadsheet (simpan di PropertiesService)
  var props = PropertiesService.getUserProperties();
  var savedEngineers = props.getProperty('MECH_ENGINEERS');
  var savedAuditLogs = props.getProperty('MECH_AUDIT_LOGS');
  var customLogo = props.getProperty('MECH_CUSTOM_LOGO') || '';
  var brandName = props.getProperty('MECH_BRAND_NAME') || 'MechMatrix';
  var brandSub = props.getProperty('MECH_BRAND_SUB') || 'Mechanical Engineering Matrix';

  return {
    engineers: savedEngineers ? JSON.parse(savedEngineers) : getDefaultEngineers(),
    skills: getDefaultSkills(),
    categories: getDefaultCategories(),
    benchmarks: getDefaultBenchmarks(),
    users: getDefaultUsers(),
    auditLogs: savedAuditLogs ? JSON.parse(savedAuditLogs) : getDefaultAuditLogs(),
    customLogo: customLogo,
    brandName: brandName,
    brandSub: brandSub,
    sheetInfo: {
      connected: false,
      name: 'Belum Terhubung',
      url: '',
      id: ''
    }
  };
}

// ============================================================================
// CRUD READERS DARI SPREADSHEET
// ============================================================================
function readEngineersFromSheet(ss) {
  var engSheet = ss.getSheetByName('Engineers');
  var matrixSheet = ss.getSheetByName('CompetencyMatrix');
  if (!engSheet || !matrixSheet) return getDefaultEngineers();

  var engData = engSheet.getDataRange().getValues();
  if (engData.length <= 1) return [];

  // Peta skor dari sheet CompetencyMatrix
  var matrixData = matrixSheet.getDataRange().getValues();
  var matrixHeaders = matrixData[0];
  var skillMap = {}; // { engId: { skillKey: level } }

  for (var r = 1; r < matrixData.length; r++) {
    var row = matrixData[r];
    var engId = String(row[0]);
    skillMap[engId] = {};
    for (var c = 2; c < matrixHeaders.length; c++) {
      var sKey = String(matrixHeaders[c]);
      skillMap[engId][sKey] = Number(row[c]) || 0;
    }
  }

  var engineers = [];
  for (var i = 1; i < engData.length; i++) {
    var eRow = engData[i];
    var id = String(eRow[0]);
    if (!id) continue;

    var certificates = [];
    try {
      certificates = eRow[8] ? JSON.parse(eRow[8]) : [];
    } catch (e) {
      certificates = [];
    }

    var selfAssessments = {};
    try {
      selfAssessments = eRow[9] ? JSON.parse(eRow[9]) : {};
    } catch (e) {
      selfAssessments = {};
    }

    engineers.push({
      id: id,
      name: String(eRow[1] || ''),
      roleTitle: String(eRow[2] || ''),
      department: String(eRow[3] || 'Structural Design & Mechanics'),
      experienceYears: Number(eRow[4]) || 1,
      targetBenchmark: String(eRow[5] || 'mid_mechanical'),
      email: String(eRow[6] || ''),
      avatarUrl: String(eRow[7] || ''),
      certificates: certificates,
      selfAssessments: selfAssessments,
      skills: skillMap[id] || {}
    });
  }

  return engineers;
}

function readAuditLogsFromSheet(ss) {
  var auditSheet = ss.getSheetByName('AuditTrail');
  if (!auditSheet) return getDefaultAuditLogs();

  var data = auditSheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var logs = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    logs.push({
      id: 'aud_' + i,
      timestamp: row[0] instanceof Date ? Utilities.formatDate(row[0], 'GMT+7', 'yyyy-MM-dd HH:mm') : String(row[0]),
      engineerId: String(row[1] || ''),
      engineerName: String(row[2] || ''),
      skillId: String(row[3] || ''),
      skillName: String(row[4] || ''),
      previousLevel: Number(row[5]) || 0,
      newLevel: Number(row[6]) || 0,
      updatedBy: String(row[7] || ''),
      reason: String(row[8] || '')
    });
  }

  return logs;
}

function readConfigFromSheet(ss) {
  var configSheet = ss.getSheetByName('Config');
  var config = {
    BRAND_NAME: 'MechMatrix',
    BRAND_SUB: 'Mechanical Engineering Competency Matrix',
    CUSTOM_LOGO: ''
  };

  if (!configSheet) return config;

  var data = configSheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][0]).trim();
    var val = String(data[i][1] || '');
    if (key) {
      config[key] = val;
    }
  }

  return config;
}

function writeConfigToSheet(ss, key, val) {
  var configSheet = ss.getSheetByName('Config');
  if (!configSheet) return;

  var data = configSheet.getDataRange().getValues();
  var found = false;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === key) {
      configSheet.getRange(i + 1, 2).setValue(val);
      found = true;
      break;
    }
  }

  if (!found) {
    configSheet.appendRow([key, val]);
  }
}

// ============================================================================
// MUTATION WRITERS KE GOOGLE SHEETS
// ============================================================================

// 1. Simpan Perubahan Level Skor Teknis
function apiSaveSkillLevel(engineerId, skillId, newLevel, reason, updatedBy) {
  var ss = getDbSpreadsheet();
  var levelNum = Number(newLevel);

  if (ss) {
    ensureSheetsExist(ss);
    var matrixSheet = ss.getSheetByName('CompetencyMatrix');
    var engSheet = ss.getSheetByName('Engineers');
    var auditSheet = ss.getSheetByName('AuditTrail');

    var mData = matrixSheet.getDataRange().getValues();
    var mHeaders = mData[0];
    var colIdx = -1;
    for (var c = 0; c < mHeaders.length; c++) {
      if (String(mHeaders[c]) === skillId) {
        colIdx = c + 1;
        break;
      }
    }

    var rowIdx = -1;
    var engName = engineerId;
    var oldLevel = 0;

    for (var r = 1; r < mData.length; r++) {
      if (String(mData[r][0]) === engineerId) {
        rowIdx = r + 1;
        engName = String(mData[r][1]);
        if (colIdx > 0) {
          oldLevel = Number(mData[r][colIdx - 1]) || 0;
        }
        break;
      }
    }

    // Update CompetencyMatrix cell
    if (rowIdx > 0 && colIdx > 0) {
      matrixSheet.getRange(rowIdx, colIdx).setValue(levelNum);
    }

    // Insert Audit Log ke baris ke-2 (teratas)
    var timestampStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm');
    var skillName = getSkillName(skillId);

    if (auditSheet) {
      auditSheet.insertRowBefore(2);
      auditSheet.getRange(2, 1, 1, 9).setValues([[
        timestampStr,
        engineerId,
        engName,
        skillId,
        skillName,
        oldLevel,
        levelNum,
        updatedBy || 'Supervisor / Manager',
        reason || 'Penyesuaian evaluasi teknis'
      ]]);
    }

    var updatedEngineers = readEngineersFromSheet(ss);
    var updatedLogs = readAuditLogsFromSheet(ss);

    return { success: true, engineers: updatedEngineers, auditLogs: updatedLogs };
  }

  // Fallback properties
  var props = PropertiesService.getUserProperties();
  var engineers = JSON.parse(props.getProperty('MECH_ENGINEERS') || JSON.stringify(getDefaultEngineers()));
  var auditLogs = JSON.parse(props.getProperty('MECH_AUDIT_LOGS') || JSON.stringify(getDefaultAuditLogs()));

  var eng = engineers.find(function(e) { return e.id === engineerId; });
  if (eng) {
    var prev = eng.skills[skillId] || 0;
    eng.skills[skillId] = levelNum;
    auditLogs.unshift({
      id: 'aud_' + Date.now(),
      timestamp: Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm'),
      engineerId: engineerId,
      engineerName: eng.name,
      skillId: skillId,
      skillName: getSkillName(skillId),
      previousLevel: prev,
      newLevel: levelNum,
      updatedBy: updatedBy || 'Supervisor / Manager',
      reason: reason || 'Penyesuaian evaluasi teknis'
    });
    props.setProperty('MECH_ENGINEERS', JSON.stringify(engineers));
    props.setProperty('MECH_AUDIT_LOGS', JSON.stringify(auditLogs));
    return { success: true, engineers: engineers, auditLogs: auditLogs };
  }

  return { success: false, message: 'Insinyur tidak ditemukan' };
}

// 2. Simpan atau Tambah Data Staff Insinyur (Foto & Multi-Sertifikat)
function apiSaveStaff(staffData, managerName) {
  var ss = getDbSpreadsheet();
  var timestampStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm');

  if (ss) {
    ensureSheetsExist(ss);
    var engSheet = ss.getSheetByName('Engineers');
    var matrixSheet = ss.getSheetByName('CompetencyMatrix');
    var auditSheet = ss.getSheetByName('AuditTrail');

    var eData = engSheet.getDataRange().getValues();
    var existingRow = -1;

    for (var r = 1; r < eData.length; r++) {
      if (String(eData[r][0]) === staffData.id) {
        existingRow = r + 1;
        break;
      }
    }

    var certsJson = JSON.stringify(staffData.certificates || []);
    var certCount = staffData.certificates ? staffData.certificates.length : 0;
    var isNew = (existingRow === -1);

    if (isNew) {
      var newId = staffData.id || ('eng_' + Date.now());
      staffData.id = newId;

      engSheet.appendRow([
        newId,
        staffData.name,
        staffData.roleTitle,
        staffData.department,
        Number(staffData.experienceYears) || 1,
        staffData.targetBenchmark || 'mid_mechanical',
        staffData.email || '',
        staffData.avatarUrl || '',
        certsJson,
        JSON.stringify({})
      ]);

      // Tambahkan baris di CompetencyMatrix
      var mHeaders = matrixSheet.getDataRange().getValues()[0];
      var newMatrixRow = [newId, staffData.name];
      for (var c = 2; c < mHeaders.length; c++) {
        var sKey = String(mHeaders[c]);
        newMatrixRow.push(staffData.skills && staffData.skills[sKey] !== undefined ? Number(staffData.skills[sKey]) : 2);
      }
      matrixSheet.appendRow(newMatrixRow);

      // Audit log
      if (auditSheet) {
        auditSheet.insertRowBefore(2);
        auditSheet.getRange(2, 1, 1, 9).setValues([[
          timestampStr,
          newId,
          staffData.name,
          'staff_onboarding',
          'Input Staff Baru',
          0,
          1,
          managerName || 'Manager',
          'Penambahan personil baru: ' + staffData.name + ' (' + staffData.roleTitle + ', ' + certCount + ' sertifikat)'
        ]]);
      }
    } else {
      // Update baris yang sudah ada
      engSheet.getRange(existingRow, 2, 1, 8).setValues([[
        staffData.name,
        staffData.roleTitle,
        staffData.department,
        Number(staffData.experienceYears) || 1,
        staffData.targetBenchmark || 'mid_mechanical',
        staffData.email || '',
        staffData.avatarUrl || '',
        certsJson
      ]]);

      // Update nama di CompetencyMatrix jika berubah
      var mData = matrixSheet.getDataRange().getValues();
      for (var mr = 1; mr < mData.length; mr++) {
        if (String(mData[mr][0]) === staffData.id) {
          matrixSheet.getRange(mr + 1, 2).setValue(staffData.name);
          break;
        }
      }

      // Audit log
      if (auditSheet) {
        auditSheet.insertRowBefore(2);
        auditSheet.getRange(2, 1, 1, 9).setValues([[
          timestampStr,
          staffData.id,
          staffData.name,
          'profile_update',
          'Pembaruan Profil Staff',
          0,
          1,
          managerName || 'Manager',
          'Pembaruan data jabatan: ' + staffData.roleTitle + ' (' + certCount + ' sertifikat terverifikasi)'
        ]]);
      }
    }

    var updatedEngineers = readEngineersFromSheet(ss);
    var updatedLogs = readAuditLogsFromSheet(ss);

    return { success: true, engineers: updatedEngineers, auditLogs: updatedLogs };
  }

  return { success: false, message: 'Spreadsheet database belum terhubung' };
}

// 3. Hapus Data Personil Insinyur
function apiDeleteStaff(engineerId, managerName) {
  var ss = getDbSpreadsheet();
  var timestampStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm');

  if (ss) {
    ensureSheetsExist(ss);
    var engSheet = ss.getSheetByName('Engineers');
    var matrixSheet = ss.getSheetByName('CompetencyMatrix');
    var auditSheet = ss.getSheetByName('AuditTrail');

    var deletedName = engineerId;

    // Hapus dari Engineers
    var eData = engSheet.getDataRange().getValues();
    for (var r = 1; r < eData.length; r++) {
      if (String(eData[r][0]) === engineerId) {
        deletedName = String(eData[r][1]);
        engSheet.deleteRow(r + 1);
        break;
      }
    }

    // Hapus dari CompetencyMatrix
    var mData = matrixSheet.getDataRange().getValues();
    for (var mr = 1; mr < mData.length; mr++) {
      if (String(mData[mr][0]) === engineerId) {
        matrixSheet.deleteRow(mr + 1);
        break;
      }
    }

    // Audit log
    if (auditSheet) {
      auditSheet.insertRowBefore(2);
      auditSheet.getRange(2, 1, 1, 9).setValues([[
        timestampStr,
        engineerId,
        deletedName,
        'staff_removed',
        'Penghapusan Personil',
        0,
        0,
        managerName || 'Manager',
        'Menghapus personil ' + deletedName + ' dari daftar aktif divisi'
      ]]);
    }

    var updatedEngineers = readEngineersFromSheet(ss);
    var updatedLogs = readAuditLogsFromSheet(ss);

    return { success: true, engineers: updatedEngineers, auditLogs: updatedLogs };
  }

  return { success: false, message: 'Spreadsheet belum terhubung' };
}

// 4. Pengajuan Penilaian Mandiri Insinyur
function apiSubmitSelfAssessment(engineerId, skillId, proposedLevel, notes) {
  var ss = getDbSpreadsheet();

  if (ss) {
    ensureSheetsExist(ss);
    var engSheet = ss.getSheetByName('Engineers');
    var data = engSheet.getDataRange().getValues();

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][0]) === engineerId) {
        var currentAssess = {};
        try {
          currentAssess = data[r][9] ? JSON.parse(data[r][9]) : {};
        } catch (e) {}

        currentAssess[skillId] = {
          proposedLevel: Number(proposedLevel),
          notes: notes,
          submittedAt: Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd'),
          status: 'pending'
        };

        engSheet.getRange(r + 1, 10).setValue(JSON.stringify(currentAssess));
        break;
      }
    }

    return { success: true, engineers: readEngineersFromSheet(ss) };
  }

  return { success: false, message: 'Spreadsheet belum terhubung' };
}

// 5. Persetujuan Penilaian Mandiri oleh Manager/Supervisor
function apiApproveAssessment(engineerId, skillId, level, notes, managerName) {
  var ss = getDbSpreadsheet();
  var timestampStr = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm');
  var levelNum = Number(level);

  if (ss) {
    ensureSheetsExist(ss);
    var engSheet = ss.getSheetByName('Engineers');
    var matrixSheet = ss.getSheetByName('CompetencyMatrix');
    var auditSheet = ss.getSheetByName('AuditTrail');

    // 1. Update status di Engineers sheet
    var eData = engSheet.getDataRange().getValues();
    var engName = engineerId;

    for (var r = 1; r < eData.length; r++) {
      if (String(eData[r][0]) === engineerId) {
        engName = String(eData[r][1]);
        var assessments = {};
        try {
          assessments = eData[r][9] ? JSON.parse(eData[r][9]) : {};
        } catch (e) {}

        if (assessments[skillId]) {
          assessments[skillId].status = 'approved';
        }
        engSheet.getRange(r + 1, 10).setValue(JSON.stringify(assessments));
        break;
      }
    }

    // 2. Update level di CompetencyMatrix
    var mData = matrixSheet.getDataRange().getValues();
    var mHeaders = mData[0];
    var colIdx = -1;
    for (var c = 0; c < mHeaders.length; c++) {
      if (String(mHeaders[c]) === skillId) {
        colIdx = c + 1;
        break;
      }
    }

    var oldLevel = 0;
    if (colIdx > 0) {
      for (var mr = 1; mr < mData.length; mr++) {
        if (String(mData[mr][0]) === engineerId) {
          oldLevel = Number(mData[mr][colIdx - 1]) || 0;
          matrixSheet.getRange(mr + 1, colIdx).setValue(levelNum);
          break;
        }
      }
    }

    // 3. Catat di AuditTrail
    if (auditSheet) {
      auditSheet.insertRowBefore(2);
      auditSheet.getRange(2, 1, 1, 9).setValues([[
        timestampStr,
        engineerId,
        engName,
        skillId,
        getSkillName(skillId),
        oldLevel,
        levelNum,
        managerName || 'Manager Approval',
        'Persetujuan Penilaian Mandiri Insinyur: "' + (notes || 'Disetujui') + '"'
      ]]);
    }

    return { 
      success: true, 
      engineers: readEngineersFromSheet(ss), 
      auditLogs: readAuditLogsFromSheet(ss) 
    };
  }

  return { success: false, message: 'Spreadsheet belum terhubung' };
}

// 6. Kustomisasi Logo & Identitas Perusahaan
function apiSaveCustomLogo(logoDataUrl, brandName, brandSub) {
  var ss = getDbSpreadsheet();
  var name = brandName || 'MechMatrix';
  var sub = brandSub || 'Mechanical Engineering Competency Matrix';

  if (ss) {
    ensureSheetsExist(ss);
    writeConfigToSheet(ss, 'BRAND_NAME', name);
    writeConfigToSheet(ss, 'BRAND_SUB', sub);
    writeConfigToSheet(ss, 'CUSTOM_LOGO', logoDataUrl || '');
  }

  // Simpan juga di UserProperties sebagai redundansi
  var props = PropertiesService.getUserProperties();
  props.setProperty('MECH_BRAND_NAME', name);
  props.setProperty('MECH_BRAND_SUB', sub);
  props.setProperty('MECH_CUSTOM_LOGO', logoDataUrl || '');

  return {
    success: true,
    brandName: name,
    brandSub: sub,
    customLogo: logoDataUrl || ''
  };
}

function apiResetCustomLogo() {
  var ss = getDbSpreadsheet();
  if (ss) {
    ensureSheetsExist(ss);
    writeConfigToSheet(ss, 'BRAND_NAME', 'MechMatrix');
    writeConfigToSheet(ss, 'BRAND_SUB', 'Mechanical Engineering Competency Matrix');
    writeConfigToSheet(ss, 'CUSTOM_LOGO', '');
  }

  var props = PropertiesService.getUserProperties();
  props.deleteProperty('MECH_BRAND_NAME');
  props.deleteProperty('MECH_BRAND_SUB');
  props.deleteProperty('MECH_CUSTOM_LOGO');

  return {
    success: true,
    brandName: 'MechMatrix',
    brandSub: 'Mechanical Engineering Competency Matrix',
    customLogo: ''
  };
}

// ============================================================================
// DATA MASTER & SEED TEKNIK MESIN (19 SKILLS - 7 DOMAIN)
// ============================================================================

function getDefaultCategories() {
  return [
    { id: 'cad_design', name: 'CAD & Mechanical Design', shortName: 'CAD & Desain' },
    { id: 'structural_fea', name: 'Structural Analysis & FEA', shortName: 'Struktur & FEA' },
    { id: 'thermal_cfd', name: 'Thermal & Fluid Dynamics (CFD)', shortName: 'Termal & CFD' },
    { id: 'materials_mfg', name: 'Materials & Manufacturing', shortName: 'Material & Manufaktur' },
    { id: 'mechatronics', name: 'Mechatronics & Automation', shortName: 'Mekatronika' },
    { id: 'quality_reliability', name: 'Quality & Reliability (RAMS)', shortName: 'Kualitas & RAMS' },
    { id: 'standards_compliance', name: 'Standards, Codes & Safety', shortName: 'Standar & Regulasi' }
  ];
}

function getDefaultSkills() {
  return [
    { id: 'cad_solid_modeling', name: 'Parametric 3D Solid Modeling', category: 'cad_design', unit: 'CSWP/CSWE', target: { junior: 3, mid: 4, senior: 5, lead: 5 }, cert: 'Certified SolidWorks Professional' },
    { id: 'cad_gdt_asme', name: 'Geometric Dimensioning & Tolerancing (GD&T)', category: 'cad_design', unit: 'ASME Y14.5-2018', target: { junior: 2, mid: 3, senior: 4, lead: 5 }, cert: 'ASME GDTP Senior Technologist' },
    { id: 'cad_tolerance_stackup', name: 'Tolerance Stack-up Analysis', category: 'cad_design', unit: 'RSS & Monte Carlo', target: { junior: 2, mid: 3, senior: 4, lead: 4 }, cert: 'Tolerance Analysis Specialist' },
    { id: 'cad_dfm_dfa', name: 'Design for Manufacturing & Assembly (DFM/DFA)', category: 'cad_design', unit: 'Boothroyd Dewhurst', target: { junior: 2, mid: 4, senior: 5, lead: 5 }, cert: 'DFMA Practitioner' },
    
    { id: 'fea_static_stress', name: 'Static Stress & Deflection Analysis', category: 'structural_fea', unit: 'Ansys Mechanical', target: { junior: 2, mid: 4, senior: 5, lead: 5 }, cert: 'Ansys Mechanical Certified' },
    { id: 'fea_modal_vibration', name: 'Modal & Vibration Dynamics', category: 'structural_fea', unit: 'ISO 18436 PSD', target: { junior: 1, mid: 3, senior: 4, lead: 5 }, cert: 'Vibration Analyst Cat II' },
    { id: 'fea_fatigue_durability', name: 'Fatigue & Life Cycle Durability', category: 'structural_fea', unit: 'ASTM E466 S-N Curve', target: { junior: 1, mid: 3, senior: 4, lead: 4 }, cert: 'Fatigue & Durability Analyst' },
    
    { id: 'cfd_heat_transfer', name: 'Conjugate Heat Transfer & Cooling', category: 'thermal_cfd', unit: 'Fourier & Newton Cooling', target: { junior: 2, mid: 3, senior: 4, lead: 5 }, cert: 'Thermal Systems Specialist' },
    { id: 'cfd_fluid_dynamics', name: 'Computational Fluid Dynamics (CFD)', category: 'thermal_cfd', unit: 'Ansys Fluent / OpenFOAM', target: { junior: 1, mid: 3, senior: 5, lead: 5 }, cert: 'Ansys Fluids Certified Professional' },
    
    { id: 'mfg_material_selection', name: 'Material Selection & Metallurgy', category: 'materials_mfg', unit: 'Granta / ASM Handbook', target: { junior: 2, mid: 3, senior: 4, lead: 5 }, cert: 'ASM Materials Specialist' },
    { id: 'mfg_cnc_tooling', name: 'CNC Machining & Precision Tooling', category: 'materials_mfg', unit: 'Mastercam / NX CAM', target: { junior: 2, mid: 4, senior: 4, lead: 4 }, cert: 'NIMS CNC Machinist' },
    { id: 'mfg_sheetmetal_plastics', name: 'Sheet Metal & Injection Molding', category: 'materials_mfg', unit: 'Moldflow / DIN 6935', target: { junior: 2, mid: 3, senior: 5, lead: 5 }, cert: 'SPE Injection Molding Certified' },
    
    { id: 'mech_actuators_sensors', name: 'Actuators, Motors & Sensor Integration', category: 'mechatronics', unit: 'Servo Sizing & DAQ', target: { junior: 2, mid: 3, senior: 4, lead: 5 }, cert: 'SME Mechatronics Specialist' },
    { id: 'mech_pneumatics_hydraulics', name: 'Pneumatics & Hydraulic Power Systems', category: 'mechatronics', unit: 'ISO 1219 Schematics', target: { junior: 2, mid: 3, senior: 4, lead: 4 }, cert: 'IFPS Hydraulic Specialist' },
    { id: 'mech_plc_automation', name: 'PLC Logic & Industrial Control', category: 'mechatronics', unit: 'IEC 61131-3 Ladder', target: { junior: 1, mid: 3, senior: 4, lead: 5 }, cert: 'Siemens TIA / Rockwell Certified' },
    
    { id: 'qual_fmea_risk', name: 'Design & Process FMEA (DFMEA/PFMEA)', category: 'quality_reliability', unit: 'AIAG-VDA FMEA', target: { junior: 2, mid: 4, senior: 5, lead: 5 }, cert: 'ASQ Quality Engineer (CQE)' },
    { id: 'qual_lab_testing', name: 'Physical Testing & Lab Instrumentation', category: 'quality_reliability', unit: 'Dewesoft / LabVIEW DAQ', target: { junior: 2, mid: 3, senior: 4, lead: 5 }, cert: 'NI Certified LabVIEW Associate' },
    
    { id: 'std_asme_pressure', name: 'Pressure Vessel & Piping Standards', category: 'standards_compliance', unit: 'ASME BPVC VIII / B31.3', target: { junior: 1, mid: 3, senior: 5, lead: 5 }, cert: 'ASME BPVC Authorized Inspector' },
    { id: 'std_iso_quality_safety', name: 'Quality Management & Machinery Safety', category: 'standards_compliance', unit: 'ISO 9001 / ISO 13849', target: { junior: 2, mid: 3, senior: 4, lead: 5 }, cert: 'TÜV Functional Safety Engineer' }
  ];
}

function getDefaultSkillKeys() {
  return getDefaultSkills().map(function(s) { return s.id; });
}

function getSkillName(skillId) {
  var skills = getDefaultSkills();
  for (var i = 0; i < skills.length; i++) {
    if (skills[i].id === skillId) return skills[i].name;
  }
  return skillId;
}

function getDefaultBenchmarks() {
  return {
    junior_mechanical: {
      cad_solid_modeling: 3, cad_gdt_asme: 2, cad_tolerance_stackup: 2, cad_dfm_dfa: 2,
      fea_static_stress: 2, fea_modal_vibration: 1, fea_fatigue_durability: 1,
      cfd_heat_transfer: 2, cfd_fluid_dynamics: 1,
      mfg_material_selection: 2, mfg_cnc_tooling: 2, mfg_sheetmetal_plastics: 2,
      mech_actuators_sensors: 2, mech_pneumatics_hydraulics: 2, mech_plc_automation: 1,
      qual_fmea_risk: 2, qual_lab_testing: 2,
      std_asme_pressure: 1, std_iso_quality_safety: 2
    },
    mid_mechanical: {
      cad_solid_modeling: 4, cad_gdt_asme: 3, cad_tolerance_stackup: 3, cad_dfm_dfa: 4,
      fea_static_stress: 4, fea_modal_vibration: 3, fea_fatigue_durability: 3,
      cfd_heat_transfer: 3, cfd_fluid_dynamics: 3,
      mfg_material_selection: 3, mfg_cnc_tooling: 4, mfg_sheetmetal_plastics: 3,
      mech_actuators_sensors: 3, mech_pneumatics_hydraulics: 3, mech_plc_automation: 3,
      qual_fmea_risk: 4, qual_lab_testing: 3,
      std_asme_pressure: 3, std_iso_quality_safety: 3
    },
    senior_mechanical: {
      cad_solid_modeling: 5, cad_gdt_asme: 4, cad_tolerance_stackup: 4, cad_dfm_dfa: 5,
      fea_static_stress: 5, fea_modal_vibration: 4, fea_fatigue_durability: 4,
      cfd_heat_transfer: 4, cfd_fluid_dynamics: 4,
      mfg_material_selection: 4, mfg_cnc_tooling: 4, mfg_sheetmetal_plastics: 5,
      mech_actuators_sensors: 4, mech_pneumatics_hydraulics: 4, mech_plc_automation: 4,
      qual_fmea_risk: 5, qual_lab_testing: 4,
      std_asme_pressure: 4, std_iso_quality_safety: 4
    },
    lead_specialist: {
      cad_solid_modeling: 5, cad_gdt_asme: 5, cad_tolerance_stackup: 5, cad_dfm_dfa: 5,
      fea_static_stress: 5, fea_modal_vibration: 5, fea_fatigue_durability: 5,
      cfd_heat_transfer: 5, cfd_fluid_dynamics: 5,
      mfg_material_selection: 5, mfg_cnc_tooling: 4, mfg_sheetmetal_plastics: 5,
      mech_actuators_sensors: 5, mech_pneumatics_hydraulics: 4, mech_plc_automation: 5,
      qual_fmea_risk: 5, qual_lab_testing: 5,
      std_asme_pressure: 5, std_iso_quality_safety: 5
    }
  };
}

function getDefaultEngineers() {
  return [
    {
      id: 'eng_01',
      name: 'Ratna Dewi, S.T., M.Sc.',
      roleTitle: 'Senior Thermal & CFD Specialist',
      department: 'Aerospace & Powertrain Cooling',
      email: 'ratna.dewi@aerotech.id',
      experienceYears: 7,
      targetBenchmark: 'senior_mechanical',
      avatarUrl: '',
      skills: {
        cad_solid_modeling: 4, cad_gdt_asme: 4, cad_tolerance_stackup: 3, cad_dfm_dfa: 4,
        fea_static_stress: 4, fea_modal_vibration: 3, fea_fatigue_durability: 3,
        cfd_heat_transfer: 5, cfd_fluid_dynamics: 5,
        mfg_material_selection: 4, mfg_cnc_tooling: 3, mfg_sheetmetal_plastics: 3,
        mech_actuators_sensors: 2, mech_pneumatics_hydraulics: 3, mech_plc_automation: 2,
        qual_fmea_risk: 4, qual_lab_testing: 4,
        std_asme_pressure: 4, std_iso_quality_safety: 4
      },
      certificates: [
        { id: 'c_01_1', name: 'Ansys Fluids Certified Professional (CFD)', issuer: 'Ansys Inc.', year: 2024, fileName: 'Ansys_Fluids_Ratna.pdf', fileSize: '1.4 MB' },
        { id: 'c_01_2', name: 'Certified Thermal Management Specialist', issuer: 'ASME International', year: 2023, fileName: 'ASME_Thermal_Ratna.pdf', fileSize: '980 KB' }
      ],
      selfAssessments: {
        mech_actuators_sensors: {
          proposedLevel: 3,
          notes: 'Selesai pelatihan integrasi sensor suhu RTD & transmisi data DAQ kecepatan tinggi.',
          submittedAt: '2026-11-01',
          status: 'pending'
        }
      }
    },
    {
      id: 'eng_02',
      name: 'Marcus Chen, S.T.',
      roleTitle: 'Lead CAD & Structural FEA Engineer',
      department: 'Structural Design & Mechanics',
      email: 'marcus.chen@aerotech.id',
      experienceYears: 9,
      targetBenchmark: 'lead_specialist',
      avatarUrl: '',
      skills: {
        cad_solid_modeling: 5, cad_gdt_asme: 5, cad_tolerance_stackup: 5, cad_dfm_dfa: 5,
        fea_static_stress: 5, fea_modal_vibration: 5, fea_fatigue_durability: 4,
        cfd_heat_transfer: 3, cfd_fluid_dynamics: 2,
        mfg_material_selection: 5, mfg_cnc_tooling: 4, mfg_sheetmetal_plastics: 4,
        mech_actuators_sensors: 3, mech_pneumatics_hydraulics: 2, mech_plc_automation: 2,
        qual_fmea_risk: 5, qual_lab_testing: 4,
        std_asme_pressure: 5, std_iso_quality_safety: 4
      },
      certificates: [
        { id: 'c_02_1', name: 'Certified SolidWorks Expert (CSWE)', issuer: 'Dassault Systèmes', year: 2023, fileName: 'CSWE_MarcusChen.pdf', fileSize: '2.1 MB' },
        { id: 'c_02_2', name: 'ASME GDTP Senior Technologist', issuer: 'ASME Y14.5 Committee', year: 2022, fileName: 'ASME_GDTP_Marcus.pdf', fileSize: '1.6 MB' },
        { id: 'c_02_3', name: 'NAFEMS FEA Registered Analyst', issuer: 'NAFEMS International', year: 2024, fileName: 'NAFEMS_FEA_Marcus.pdf', fileSize: '1.8 MB' }
      ]
    },
    {
      id: 'eng_03',
      name: 'Maya Susanto, S.T., M.T.',
      roleTitle: 'Mechatronics & Robotics Lead',
      department: 'Automation & Mechanism Control',
      email: 'maya.susanto@aerotech.id',
      experienceYears: 8,
      targetBenchmark: 'lead_specialist',
      avatarUrl: '',
      skills: {
        cad_solid_modeling: 4, cad_gdt_asme: 3, cad_tolerance_stackup: 3, cad_dfm_dfa: 4,
        fea_static_stress: 3, fea_modal_vibration: 3, fea_fatigue_durability: 2,
        cfd_heat_transfer: 2, cfd_fluid_dynamics: 1,
        mfg_material_selection: 3, mfg_cnc_tooling: 3, mfg_sheetmetal_plastics: 3,
        mech_actuators_sensors: 5, mech_pneumatics_hydraulics: 5, mech_plc_automation: 5,
        qual_fmea_risk: 4, qual_lab_testing: 5,
        std_asme_pressure: 3, std_iso_quality_safety: 5
      },
      certificates: [
        { id: 'c_03_1', name: 'Siemens TIA Portal Certified Automation Specialist', issuer: 'Siemens Industry', year: 2024, fileName: 'Siemens_TIA_Maya.pdf', fileSize: '1.2 MB' },
        { id: 'c_03_2', name: 'IFPS Certified Hydraulic Specialist', issuer: 'International Fluid Power Society', year: 2022, fileName: 'IFPS_Hydraulics_Maya.pdf', fileSize: '980 KB' }
      ]
    },
    {
      id: 'eng_04',
      name: 'Hendra Pratama, S.T., IPU',
      roleTitle: 'Senior Quality & Tooling Engineer',
      department: 'Tooling & Advanced Manufacturing',
      email: 'hendra.pratama@aerotech.id',
      experienceYears: 14,
      targetBenchmark: 'senior_mechanical',
      avatarUrl: '',
      skills: {
        cad_solid_modeling: 4, cad_gdt_asme: 5, cad_tolerance_stackup: 5, cad_dfm_dfa: 5,
        fea_static_stress: 4, fea_modal_vibration: 3, fea_fatigue_durability: 4,
        cfd_heat_transfer: 2, cfd_fluid_dynamics: 1,
        mfg_material_selection: 5, mfg_cnc_tooling: 5, mfg_sheetmetal_plastics: 5,
        mech_actuators_sensors: 3, mech_pneumatics_hydraulics: 4, mech_plc_automation: 3,
        qual_fmea_risk: 5, qual_lab_testing: 5,
        std_asme_pressure: 5, std_iso_quality_safety: 5
      },
      certificates: [
        { id: 'c_04_1', name: 'TÜV Rheinland Functional Safety Engineer', issuer: 'TÜV Rheinland', year: 2023, fileName: 'TUV_Safety_Hendra.pdf', fileSize: '950 KB' },
        { id: 'c_04_2', name: 'Insinyur Profesional Utama (IPU)', issuer: 'Persatuan Insinyur Indonesia (PII)', year: 2021, fileName: 'IPU_PII_HendraPratama.pdf', fileSize: '3.2 MB' }
      ]
    },
    {
      id: 'eng_05',
      name: 'Budi Santoso, S.T.',
      roleTitle: 'Junior Mechanical Design Engineer',
      department: 'Structural Design & Mechanics',
      email: 'budi.santoso@aerotech.id',
      experienceYears: 2,
      targetBenchmark: 'junior_mechanical',
      avatarUrl: '',
      skills: {
        cad_solid_modeling: 3, cad_gdt_asme: 2, cad_tolerance_stackup: 1, cad_dfm_dfa: 2,
        fea_static_stress: 2, fea_modal_vibration: 1, fea_fatigue_durability: 1,
        cfd_heat_transfer: 1, cfd_fluid_dynamics: 0,
        mfg_material_selection: 2, mfg_cnc_tooling: 2, mfg_sheetmetal_plastics: 2,
        mech_actuators_sensors: 1, mech_pneumatics_hydraulics: 1, mech_plc_automation: 1,
        qual_fmea_risk: 1, qual_lab_testing: 2,
        std_asme_pressure: 1, std_iso_quality_safety: 2
      },
      certificates: [
        { id: 'c_05_1', name: 'Certified SolidWorks Associate (CSWA)', issuer: 'Dassault Systèmes', year: 2025, fileName: 'CSWA_BudiSantoso.pdf', fileSize: '1.1 MB' }
      ]
    }
  ];
}

function getDefaultUsers() {
  return [
    { id: 'usr_view_01', name: 'Ratna Dewi, S.T., M.Sc.', roleType: 'viewer', title: 'Thermal & CFD Analyst (Viewer)', engineerId: 'eng_01' },
    { id: 'usr_spv_01', name: 'Maya Susanto, S.T., M.T.', roleType: 'supervisor', title: 'Automation & Mechanism Supervisor', engineerId: 'eng_03' },
    { id: 'usr_spv_02', name: 'Marcus Chen, S.T.', roleType: 'supervisor', title: 'Structural CAD/FEA Supervisor', engineerId: 'eng_02' },
    { id: 'usr_mgr_01', name: 'Dr. Ir. Hartono Wicaksono, IPU', roleType: 'manager', title: 'Head of Mechanical Engineering (Manager)' }
  ];
}

function getDefaultAuditLogs() {
  return [
    {
      id: 'aud_01',
      timestamp: '2026-11-02 14:30',
      engineerId: 'eng_01',
      engineerName: 'Ratna Dewi',
      skillId: 'cfd_heat_transfer',
      skillName: 'Conjugate Heat Transfer & Cooling',
      previousLevel: 4,
      newLevel: 5,
      updatedBy: 'Dr. Ir. Hartono Wicaksono (Manager)',
      reason: 'Selesai sertifikasi Ansys Fluids Professional dan memimpin proyek pendingin avionik EV.'
    },
    {
      id: 'aud_02',
      timestamp: '2026-10-28 09:15',
      engineerId: 'eng_04',
      engineerName: 'Hendra Pratama',
      skillId: 'std_iso_quality_safety',
      skillName: 'Quality Management & Machinery Safety',
      previousLevel: 4,
      newLevel: 5,
      updatedBy: 'Dr. Ir. Hartono Wicaksono (Manager)',
      reason: 'Lulus audit surveillance AS9100 Rev D dengan zero non-conformance.'
    }
  ];
}
