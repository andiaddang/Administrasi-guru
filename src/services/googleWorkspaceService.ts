import {
  Student,
  ClassRoom,
  AttendanceRecord,
  GradeRecord,
  TeachingJournal,
  SchoolProfile,
} from '../types';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  parents?: string[];
}

export interface SpreadsheetInfo {
  id: string;
  title: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }>;
}

export interface ExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  rowCount: number;
}

export const GoogleWorkspaceService = {
  /**
   * List files from Google Drive
   */
  async listDriveFiles(
    accessToken: string,
    options?: {
      q?: string;
      pageSize?: number;
      mimeTypeFilter?: 'all' | 'sheets' | 'folders' | 'backups';
    }
  ): Promise<DriveFileItem[]> {
    const pageSize = options?.pageSize || 40;
    let queryParts = ['trashed = false'];

    if (options?.mimeTypeFilter === 'sheets') {
      queryParts.push("mimeType = 'application/vnd.google-apps.spreadsheet'");
    } else if (options?.mimeTypeFilter === 'folders') {
      queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
    } else if (options?.mimeTypeFilter === 'backups') {
      queryParts.push("(name contains 'Backup_Administrasi' or mimeType = 'application/json')");
    }

    if (options?.q && options.q.trim()) {
      const sanitized = options.q.trim().replace(/'/g, "\\'");
      queryParts.push(`name contains '${sanitized}'`);
    }

    const finalQuery = queryParts.join(' and ');
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('pageSize', String(pageSize));
    url.searchParams.set(
      'fields',
      'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink, parents)'
    );
    url.searchParams.set('orderBy', 'modifiedTime desc');
    url.searchParams.set('q', finalQuery);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(
        errJson?.error?.message || `Gagal mengambil daftar file Drive (HTTP ${res.status})`
      );
    }

    const data = await res.json();
    return data.files || [];
  },

  /**
   * Find or create dedicated folder in Google Drive
   */
  async getOrCreateFolder(
    accessToken: string,
    folderName: string = 'Administrasi Guru - SMAN 1 Gowa'
  ): Promise<string> {
    const existing = await this.listDriveFiles(accessToken, {
      q: folderName,
      mimeTypeFilter: 'folders',
    });

    const exactMatch = existing.find((f) => f.name.toLowerCase() === folderName.toLowerCase());
    if (exactMatch) {
      return exactMatch.id;
    }

    return this.createDriveFolder(accessToken, folderName);
  },

  /**
   * Create a new folder in Google Drive
   */
  async createDriveFolder(
    accessToken: string,
    folderName: string,
    parentFolderId?: string
  ): Promise<string> {
    const body: Record<string, any> = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentFolderId) {
      body.parents = [parentFolderId];
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membuat folder di Google Drive`);
    }

    const data = await res.json();
    return data.id;
  },

  /**
   * Upload file to Google Drive using multipart upload
   */
  async uploadFileToDrive(
    accessToken: string,
    fileName: string,
    content: string,
    mimeType: string = 'application/json',
    parentFolderId?: string
  ): Promise<DriveFileItem> {
    const metadata: Record<string, any> = {
      name: fileName,
      mimeType,
    };
    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
      content +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal mengunggah file ke Google Drive`);
    }

    return await res.json();
  },

  /**
   * Download file content from Google Drive
   */
  async downloadDriveFileContent(accessToken: string, fileId: string): Promise<string> {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal mengunduh file dari Google Drive (HTTP ${res.status})`);
    }

    return await res.text();
  },

  /**
   * Delete a file from Google Drive (Mandatory user confirmation required beforehand!)
   */
  async deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal menghapus file dari Google Drive`);
    }
  },

  /**
   * Create a new Google Spreadsheet with structured rows
   */
  async createSpreadsheet(
    accessToken: string,
    title: string,
    sheetTitle: string,
    headerRow: string[],
    dataRows: string[][]
  ): Promise<ExportResult> {
    // 1. Create Spreadsheet metadata
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: sheetTitle,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membuat spreadsheet baru`);
    }

    const created = await createRes.json();
    const spreadsheetId: string = created.spreadsheetId;
    const spreadsheetUrl: string =
      created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 2. Populate values
    const allValues = [headerRow, ...dataRows];
    const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      sheetTitle
    )}!A1?valueInputOption=USER_ENTERED`;

    const writeRes = await fetch(writeUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: allValues,
      }),
    });

    if (!writeRes.ok) {
      console.warn('Gagal menulis data ke spreadsheet, namun berkas berhasil dibuat');
    }

    return {
      spreadsheetId,
      spreadsheetUrl,
      title,
      rowCount: dataRows.length,
    };
  },

  /**
   * Read values from a spreadsheet range
   */
  async readSpreadsheetValues(
    accessToken: string,
    spreadsheetId: string,
    range: string
  ): Promise<string[][]> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal membaca isi range spreadsheet`);
    }

    const data = await res.json();
    return data.values || [];
  },

  /**
   * Get spreadsheet information (sheets/tabs list)
   */
  async getSpreadsheetInfo(accessToken: string, spreadsheetId: string): Promise<SpreadsheetInfo> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets(properties(sheetId,title,gridProperties))`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gagal mengambil metadata spreadsheet`);
    }

    const data = await res.json();
    return {
      id: spreadsheetId,
      title: data.properties?.title || 'Spreadsheet Tanpa Judul',
      sheets: (data.sheets || []).map((s: any) => ({
        sheetId: s.properties?.sheetId,
        title: s.properties?.title,
        rowCount: s.properties?.gridProperties?.rowCount,
        columnCount: s.properties?.gridProperties?.columnCount,
      })),
    };
  },

  // -------------------------------------------------------------
  // HIGH-LEVEL EXPORT PRESETS FOR SCHOOL ADMINISTRATION
  // -------------------------------------------------------------

  /**
   * Export student list to a new Google Spreadsheet
   */
  async exportStudentsToGoogleSheets(
    accessToken: string,
    students: Student[],
    classes: ClassRoom[],
    school: SchoolProfile
  ): Promise<ExportResult> {
    const timestamp = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const title = `Daftar Siswa - ${school.name} (${timestamp})`;
    const sheetTitle = 'Data Siswa';

    const header = [
      'No',
      'NISN / NIS',
      'Nama Lengkap Siswa',
      'Jenis Kelamin (L/P)',
      'Kelas / Rombel',
      'Kontak / No. HP Ortu',
      'Status Siswa',
    ];

    const rows = students.map((s, idx) => {
      const cls = classes.find((c) => c.id === s.classId);
      return [
        String(idx + 1),
        s.nisnNis || `${s.nisn || ''} / ${s.nis || ''}`.trim() || '-',
        s.name,
        s.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        cls?.name || 'Tidak Ditentukan',
        s.parentPhone || '-',
        s.status || 'Aktif',
      ];
    });

    return await this.createSpreadsheet(accessToken, title, sheetTitle, header, rows);
  },

  /**
   * Export attendance records to a new Google Spreadsheet
   */
  async exportAttendanceToGoogleSheets(
    accessToken: string,
    attendances: AttendanceRecord[],
    students: Student[],
    classes: ClassRoom[],
    school: SchoolProfile
  ): Promise<ExportResult> {
    const timestamp = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const title = `Rekap Presensi Siswa - ${school.name} (${timestamp})`;
    const sheetTitle = 'Rekap Presensi';

    const header = [
      'No',
      'Tanggal',
      'Nama Siswa',
      'NISN / NIS',
      'Kelas',
      'Status Kehadiran',
      'Keterangan / Catatan',
    ];

    const rows = attendances.map((att, idx) => {
      const std = students.find((s) => s.id === att.studentId);
      const cls = classes.find((c) => c.id === att.classId);
      const statusLabel =
        att.status === 'HADIR'
          ? 'Hadir'
          : att.status === 'SAKIT'
          ? 'Sakit'
          : att.status === 'IZIN'
          ? 'Izin'
          : 'Alpa (Tanpa Keterangan)';

      return [
        String(idx + 1),
        att.date,
        std?.name || 'Siswa',
        std?.nisnNis || '-',
        cls?.name || '-',
        statusLabel,
        att.notes || '-',
      ];
    });

    return await this.createSpreadsheet(accessToken, title, sheetTitle, header, rows);
  },

  /**
   * Export grades records to a new Google Spreadsheet
   */
  async exportGradesToGoogleSheets(
    accessToken: string,
    grades: GradeRecord[],
    students: Student[],
    classes: ClassRoom[],
    school: SchoolProfile
  ): Promise<ExportResult> {
    const timestamp = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const title = `Rekapitulasi Nilai Siswa - ${school.name} (${timestamp})`;
    const sheetTitle = 'Daftar Nilai';

    const header = [
      'No',
      'Nama Siswa',
      'NISN / NIS',
      'Kelas',
      'Mata Pelajaran',
      'Jenis Penilaian',
      'Judul Tugas / Ulangan',
      'Nilai / Skor',
      'Tanggal Penilaian',
    ];

    const rows = grades.map((g, idx) => {
      const std = students.find((s) => s.id === g.studentId);
      const cls = classes.find((c) => c.id === g.classId);
      return [
        String(idx + 1),
        std?.name || 'Siswa',
        std?.nisnNis || '-',
        cls?.name || '-',
        g.subject,
        g.type,
        g.title,
        String(g.score),
        g.date,
      ];
    });

    return await this.createSpreadsheet(accessToken, title, sheetTitle, header, rows);
  },

  /**
   * Export teaching journals to a new Google Spreadsheet
   */
  async exportJournalsToGoogleSheets(
    accessToken: string,
    journals: TeachingJournal[],
    classes: ClassRoom[],
    school: SchoolProfile
  ): Promise<ExportResult> {
    const timestamp = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const title = `Jurnal Harian Mengajar - ${school.name} (${timestamp})`;
    const sheetTitle = 'Jurnal Mengajar';

    const header = [
      'Pertemuan Ke',
      'Tanggal',
      'Alokasi Jam',
      'Kelas',
      'Mata Pelajaran',
      'Materi Pokok / Pembahasan',
      'Kegiatan Pembelajaran',
      'Hambatan Pembelajaran',
      'Solusi & Tindak Lanjut',
      'Jml Siswa Hadir',
      'Jml Siswa Absen',
    ];

    const rows = journals.map((j) => {
      const cls = classes.find((c) => c.id === j.classId);
      return [
        `Pertemuan ${j.meetingNumber}`,
        j.date,
        j.time,
        cls?.name || '-',
        j.subject,
        j.topic,
        j.learningActivities,
        j.obstacles || '-',
        j.solutions || '-',
        String(j.presentCount),
        String(j.absentCount),
      ];
    });

    return await this.createSpreadsheet(accessToken, title, sheetTitle, header, rows);
  },

  /**
   * Backup entire application state to Google Drive
   */
  async backupFullStateToDrive(
    accessToken: string,
    backupData: Record<string, any>,
    school: SchoolProfile
  ): Promise<DriveFileItem> {
    const folderId = await this.getOrCreateFolder(
      accessToken,
      `Administrasi Guru - ${school.name || 'SMAN 1 Gowa'}`
    );

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${now.getHours().toString().padStart(2, '0')}-${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const fileName = `Backup_Administrasi_Guru_${dateStr}_${timeStr}.json`;

    const jsonContent = JSON.stringify(
      {
        version: '2.0',
        exportedAt: now.toISOString(),
        schoolName: school.name,
        data: backupData,
      },
      null,
      2
    );

    return await this.uploadFileToDrive(
      accessToken,
      fileName,
      jsonContent,
      'application/json',
      folderId
    );
  },
};
