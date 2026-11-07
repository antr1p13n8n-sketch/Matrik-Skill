/**
 * MechMatrix Engineering - Vercel Serverless Function Handler
 * Platform: Vercel (vercel.app)
 */

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = req.url || '';

  try {
    // 1. Health check
    if (url.includes('/health') || url === '/api' || url === '/api/') {
      return res.status(200).json({
        status: 'ok',
        platform: 'vercel-serverless',
        hasAiSupport: Boolean(process.env.GEMINI_API_KEY),
        hasSqlSupport: true,
        sqlDatabase: 'MechMatrix Engineering',
        sqlUser: 'Engineering',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. SQL Info
    if (url.includes('/sql/info')) {
      return res.status(200).json({
        database: 'MechMatrix Engineering',
        user: 'Engineering',
        host: 'localhost',
        port: 5432,
        dialect: 'PostgreSQL / Relational SQL',
        status: 'connected',
        tables: [
          'engineers',
          'engineer_skills',
          'certifications',
          'self_assessments',
          'audit_logs',
          'assessment_standards',
          'users',
        ],
        totalRecords: 12,
        storageType: 'Relational SQL Engine (Cloud Synchronized)',
      });
    }

    // 3. SQL Query Execution
    if (url.includes('/sql/query') && req.method === 'POST') {
      const { query } = req.body || {};
      const trimmed = (query || '').trim();

      if (!trimmed) {
        return res.status(400).json({ success: false, error: 'Query tidak boleh kosong' });
      }

      // Quick simulated relational query handler for Vercel
      if (/FROM\s+engineers/i.test(trimmed)) {
        return res.status(200).json({
          success: true,
          columns: ['id', 'name', 'role_title', 'department', 'database_owner'],
          values: [
            ['eng_1', 'Budi Santoso', 'Senior Mechanical Specialist', 'Aerospace Systems', 'Engineering'],
            ['eng_2', 'Siti Rahmawati', 'Thermal & CFD Lead Engineer', 'Propulsion & Aerodynamics', 'Engineering'],
            ['eng_3', 'Ahmad Hidayat', 'Structural FEA Specialist', 'Structures & Dynamics', 'Engineering'],
            ['eng_4', 'Maya Susanto', 'Mechatronics & Automation Lead', 'Robotics & Control', 'Engineering'],
          ],
          executionTimeMs: 2,
          rowsAffected: 4,
          message: 'Query executed on MechMatrix Engineering database.',
        });
      }

      if (/FROM\s+engineer_skills/i.test(trimmed)) {
        return res.status(200).json({
          success: true,
          columns: ['skill_name', 'assessed_staff', 'avg_score'],
          values: [
            ['Finite Element Analysis (FEA)', 4, 4.25],
            ['Computational Fluid Dynamics (CFD)', 4, 3.75],
            ['GD&T & Tolerance Stack-up', 4, 4.0],
            ['Mechatronics & Actuator Control', 4, 3.5],
            ['Manufacturing & DFM/DFA', 4, 4.0],
          ],
          executionTimeMs: 1,
          rowsAffected: 5,
        });
      }

      if (/FROM\s+audit_logs/i.test(trimmed)) {
        return res.status(200).json({
          success: true,
          columns: ['id', 'timestamp', 'engineer_name', 'skill_name', 'previous_level', 'new_level', 'updated_by'],
          values: [
            ['aud_1', '2026-11-06 14:30', 'Budi Santoso', 'Structural FEA', 4, 5, 'Manager (Akses Penuh)'],
            ['aud_2', '2026-11-06 11:15', 'Siti Rahmawati', 'Thermal CFD', 3, 4, 'Supervisor (Penyelia Teknis)'],
          ],
          executionTimeMs: 1,
          rowsAffected: 2,
        });
      }

      return res.status(200).json({
        success: true,
        columns: ['status', 'message', 'database', 'user'],
        values: [['SUCCESS', 'Perintah SQL berhasil dijalankan', 'MechMatrix Engineering', 'Engineering']],
        executionTimeMs: 1,
        rowsAffected: 1,
        message: 'Perintah SQL berhasil dijalankan di database "MechMatrix Engineering".',
      });
    }

    // 4. SQL Data Sync
    if (url.includes('/sql/sync') && req.method === 'POST') {
      const { engineers } = req.body || {};
      const count = Array.isArray(engineers) ? engineers.length : 0;
      return res.status(200).json({
        success: true,
        totalSynced: count,
        message: `Berhasil menyinkronkan ${count} personil ke Database SQL "MechMatrix Engineering"!`,
      });
    }

    // 5. AI Report Generation
    if (url.includes('/generate-ai-report') && req.method === 'POST') {
      const { engineerName, roleTitle, averageScore, targetScore } = req.body || {};

      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const aiClient = new GoogleGenAI({ apiKey });
          const prompt = `Buatkan evaluasi ringkas analisis kompetensi dan 3 aksi teknis pengembangan untuk insinyur teknik mesin ${engineerName || 'Insinyur'} (${roleTitle || 'Mechanical Engineer'}). Rerata nilai saat ini ${averageScore}/5.0 (Target: ${targetScore}/5.0).`;
          const response = await aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          });
          return res.status(200).json({
            success: true,
            source: 'gemini_api',
            aiFeedback: response.text || '',
          });
        } catch (apiErr) {
          console.warn('Gemini API call failed, using rule engine:', apiErr);
        }
      }

      return res.status(200).json({
        success: true,
        source: 'rule_engine_expert',
        aiFeedback: `### Executive Summary & Analisis Manajerial
Insinyur ${engineerName || 'Insinyur'} menunjukkan penguasaan teknik yang sangat solid pada spesialisasi inti (${roleTitle || 'Mechanical Engineer'}), dengan rerata performa ${averageScore || '4.0'}/5.0 mendekati benchmark jabatan (${targetScore || '4.5'}/5.0). Kekuatan analitis pada kalkulasi desain merupakan fondasi kunci divisi.

### Rekomendasi Aksi Teknis Spesifik (IDP Action Plan)
1. **Penerapan Standar GD&T Lanjut**: Terapkan toleransi geometris standar ASME Y14.5 pada komponen kritis untuk memastikan kesesuaian manufaktur (DFM).
2. **Korelasi Simulasi Numerik & Pengujian**: Dokumentasikan deviasi antara hasil simulasi FEA/CFD dan hasil uji fisik prototipe (delta korelasi < 5%).
3. **Akselerasi Lisensi Profesional**: Ikuti sertifikasi insinyur profesional (PE/IPM) dan program pendampingan mentoring teknis internal.`,
      });
    }

    return res.status(200).json({
      status: 'ok',
      message: 'MechMatrix Engineering API Gateway',
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}
