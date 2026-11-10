import React, { useState, useEffect, useRef } from 'react';
import { Engineer, RoleBenchmark, SkillLevel, CertificateAttachment } from '../types/skills';
import { SKILL_DEFINITIONS } from '../data/initialData';
import { 
  X, 
  UserPlus, 
  UserCheck, 
  Trash2, 
  Camera, 
  Upload, 
  Award, 
  FileText, 
  Plus, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Image as ImageIcon,
  Eye,
  AlertCircle
} from 'lucide-react';
import { CertificatePreviewModal } from './CertificatePreviewModal';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: Engineer | null;
  onSaveStaff: (engineerData: Partial<Engineer> & { id?: string }) => void;
  onDeleteStaff?: (engineerId: string) => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  staffToEdit,
  onSaveStaff,
  onDeleteStaff,
}) => {
  const isEditMode = Boolean(staffToEdit);

  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState('Structural Design & Mechanics');
  const [email, setEmail] = useState('');
  const [experienceYears, setExperienceYears] = useState(3);
  const [targetBenchmark, setTargetBenchmark] = useState<RoleBenchmark>('mid_mechanical');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [initialSkillPreset, setInitialSkillPreset] = useState<'novice' | 'developing' | 'competent'>('developing');

  // Certificate Management State
  const [certificates, setCertificates] = useState<CertificateAttachment[]>([]);
  const [newCertName, setNewCertName] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [newCertYear, setNewCertYear] = useState(new Date().getFullYear());
  const [newCertFileName, setNewCertFileName] = useState('');
  const [newCertFileSize, setNewCertFileSize] = useState('');
  const [newCertFileData, setNewCertFileData] = useState('');
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewCert, setPreviewCert] = useState<CertificateAttachment | null>(null);

  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const certFileInputRef = useRef<HTMLInputElement>(null);
  const batchCertInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (staffToEdit) {
      setName(staffToEdit.name);
      setRoleTitle(staffToEdit.roleTitle);
      setDepartment(staffToEdit.department);
      setEmail(staffToEdit.email);
      setExperienceYears(staffToEdit.experienceYears);
      setTargetBenchmark(staffToEdit.targetBenchmark);
      setAvatarUrl(staffToEdit.avatarUrl || '');
      setCertificates(staffToEdit.certificates ? [...staffToEdit.certificates] : []);
    } else {
      setName('');
      setRoleTitle('');
      setDepartment('Structural Design & Mechanics');
      setEmail('');
      setExperienceYears(2);
      setTargetBenchmark('junior_mechanical');
      setAvatarUrl('');
      setCertificates([]);
      setInitialSkillPreset('developing');
    }
    setNewCertName('');
    setNewCertIssuer('');
    setNewCertYear(new Date().getFullYear());
    setNewCertFileName('');
    setNewCertFileSize('');
    setNewCertFileData('');
    setIsAddingCert(false);
    setFormError(null);
    setPreviewCert(null);
  }, [staffToEdit, isOpen]);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  // Compress image certificates / photos to keep localStorage & Firestore (<1MB) safe
  const readAndOptimizeFile = (file: File): Promise<{ dataUrl: string; sizeStr: string }> => {
    return new Promise((resolve, reject) => {
      const isImage = file.type.startsWith('image/');
      const maxRawSize = isImage ? 5 * 1024 * 1024 : 900 * 1024; // 5MB for images (compressed), 900KB for PDFs
      if (file.size > maxRawSize) {
        reject(
          new Error(
            isImage
              ? `Ukuran gambar "${file.name}" melebihi batas 5MB.`
              : `Ukuran file PDF "${file.name}" melebihi batas 900KB agar tersimpan aman di database.`
          )
        );
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Gagal membaca file "${file.name}".`));
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) {
          reject(new Error(`File "${file.name}" kosong.`));
          return;
        }

        if (!isImage) {
          resolve({ dataUrl: result, sizeStr: formatFileSize(file.size) });
          return;
        }

        const img = new Image();
        img.onerror = () => resolve({ dataUrl: result, sizeStr: formatFileSize(file.size) });
        img.onload = () => {
          const maxDim = 1400;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: result, sizeStr: formatFileSize(file.size) });
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.78);
          const approxBytes = Math.round((compressed.length * 3) / 4);
          resolve({ dataUrl: compressed, sizeStr: formatFileSize(approxBytes) });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFormError(null);
    try {
      const { dataUrl } = await readAndOptimizeFile(file);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengunggah foto profil.');
    }
  };

  // Handle Certificate File Upload (Single)
  const handleCertFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFormError(null);
    try {
      const { dataUrl, sizeStr } = await readAndOptimizeFile(file);
      setNewCertFileName(file.name);
      setNewCertFileSize(sizeStr);
      setNewCertFileData(dataUrl);
      if (!newCertName.trim()) {
        setNewCertName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal membaca berkas sertifikat.');
    }
  };

  // Handle Multi-Certificate Batch Upload (Select multiple files at once)
  const handleBatchCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    e.target.value = '';
    setFormError(null);

    const errors: string[] = [];
    const added: CertificateAttachment[] = [];

    for (const file of fileList) {
      try {
        const { dataUrl, sizeStr } = await readAndOptimizeFile(file);
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        added.push({
          id: `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: cleanName,
          issuer: 'Dokumen Kredensial Terverifikasi',
          year: new Date().getFullYear(),
          fileName: file.name,
          fileSize: sizeStr,
          fileUrl: dataUrl,
        });
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `Gagal memproses ${file.name}`);
      }
    }

    if (added.length > 0) {
      setCertificates((prev) => [...prev, ...added]);
    }
    if (errors.length > 0) {
      setFormError(errors.join(' '));
    }
  };

  const buildPendingCertificate = (): CertificateAttachment | null => {
    if (!newCertName.trim()) return null;
    const cert: CertificateAttachment = {
      id: `cert_${Date.now()}`,
      name: newCertName.trim(),
      issuer: newCertIssuer.trim() || 'Lembaga Sertifikasi Terakreditasi',
      year: newCertYear || new Date().getFullYear(),
    };
    if (newCertFileName) cert.fileName = newCertFileName;
    if (newCertFileSize) cert.fileSize = newCertFileSize;
    if (newCertFileData) cert.fileUrl = newCertFileData;
    return cert;
  };

  const handleAddCertificate = () => {
    if (!newCertName.trim()) {
      setFormError('Nama sertifikasi wajib diisi sebelum menyimpan sertifikat.');
      return;
    }
    setFormError(null);

    const newCert = buildPendingCertificate();
    if (!newCert) return;

    setCertificates((prev) => [...prev, newCert]);
    setNewCertName('');
    setNewCertIssuer('');
    setNewCertFileName('');
    setNewCertFileSize('');
    setNewCertFileData('');
    setIsAddingCert(false);
  };

  const handleDeleteCertificate = (certId: string) => {
    setCertificates((prev) => prev.filter((c) => c.id !== certId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roleTitle.trim()) {
      setFormError('Nama lengkap dan jabatan teknis wajib diisi.');
      return;
    }

    // Auto-commit pending certificate form if user filled it and forgot to click "Simpan Sertifikat"
    let finalCertificates = [...certificates];
    if (isAddingCert && newCertName.trim()) {
      const pending = buildPendingCertificate();
      if (pending) finalCertificates.push(pending);
    }

    // Build initial skills if new staff
    const initialSkills: Record<string, SkillLevel> = staffToEdit?.skills ? { ...staffToEdit.skills } : {};
    if (!isEditMode) {
      const presetLevel: SkillLevel = initialSkillPreset === 'novice' ? 1 : initialSkillPreset === 'developing' ? 2 : 3;
      SKILL_DEFINITIONS.forEach((skill) => {
        initialSkills[skill.id] = presetLevel;
      });
    }

    onSaveStaff({
      id: staffToEdit ? staffToEdit.id : `eng_${Date.now()}`,
      name: name.trim(),
      roleTitle: roleTitle.trim(),
      department,
      email: email.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@aerotech.id`,
      experienceYears: Number(experienceYears) || 1,
      targetBenchmark,
      avatarUrl: avatarUrl.trim(),
      certificates: finalCertificates,
      skills: initialSkills,
      selfAssessments: staffToEdit?.selfAssessments || {},
    });

    onClose();
  };

  const handleDelete = () => {
    if (!staffToEdit || !onDeleteStaff) return;
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus data personil ${staffToEdit.name}?`);
    if (confirmDelete) {
      onDeleteStaff(staffToEdit.id);
      onClose();
    }
  };

  const departmentList = [
    'Structural Design & Mechanics',
    'Aerospace & Powertrain Cooling',
    'Automation & Mechanism Control',
    'Tooling & Advanced Manufacturing',
    'Quality & Reliability Assurance (RAMS)',
    'Mechanical Systems R&D',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 text-slate-800 dark:text-slate-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
              {isEditMode ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isEditMode ? 'Edit Data Personil Insinyur' : 'Input Staff Insinyur Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditMode ? 'Perbarui identitas, foto personil, target benchmark, dan berkas sertifikasi.' : 'Tambahkan anggota tim baru, unggah sertifikat kompetensi, dan atur foto profil.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs overflow-y-auto flex-1 pr-1">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-500 hover:text-rose-700 font-bold"
              >
                ✕
              </button>
            </div>
          )}
          {/* PHOTO UPLOAD & AVATAR SECTION */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-cyan-500 flex items-center justify-center shadow-md">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Preview Foto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-linear-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-850">
                      <ImageIcon className="w-7 h-7" />
                      <span className="text-[9px] font-semibold mt-0.5">Tanpa Foto</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => photoFileInputRef.current?.click()}
                  title="Ganti Foto Personil"
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-md transition-transform hover:scale-110"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Upload Controls */}
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-1.5">
                  <span>Foto Profil Personil Insinyur</span>
                  {avatarUrl && <span className="text-[10px] text-emerald-600 font-normal">● Foto Terpasang</span>}
                </div>
                <p className="text-[11px] text-slate-500">
                  Format gambar JPG, PNG, atau WebP (maks. 5MB). Foto akan tampil pada Matriks Kompetensi dan Laporan IDP.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <input
                    type="file"
                    ref={photoFileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{avatarUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-3 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BASIC INFORMATION */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap & Gelar <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Arif Hidayat, S.T., M.Sc."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jabatan / Spesialisasi <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Contoh: Piping & Stress FEA Engineer"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pengalaman Kerja (Tahun)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Departemen / Kelompok Rekayasa
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              >
                {departmentList.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Standar Benchmark
              </label>
              <select
                value={targetBenchmark}
                onChange={(e) => setTargetBenchmark(e.target.value as RoleBenchmark)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              >
                <option value="junior_mechanical">Junior Mechanical Engineer (L2 - L3)</option>
                <option value="mid_mechanical">Mid Mechanical Engineer (L3 - L4)</option>
                <option value="senior_mechanical">Senior Mechanical Engineer (L4 - L5)</option>
                <option value="lead_specialist">Lead Specialist / Principal (L5 Master)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Perusahaan
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@aerotech.id"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* CERTIFICATES ATTACHMENT SECTION */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  Dokumen Sertifikasi Teknis ({certificates.length})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="file"
                  ref={batchCertInputRef}
                  accept=".pdf,image/*"
                  multiple
                  onChange={handleBatchCertUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => batchCertInputRef.current?.click()}
                  className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-[11px] font-medium transition-colors flex items-center gap-1 shadow-2xs"
                  title="Pilih beberapa berkas sertifikat sekaligus (Multi-file upload)"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Multi-Upload File</span>
                </button>
                {!isAddingCert && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCert(true)}
                    className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-medium transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Form Sertifikat</span>
                  </button>
                )}
              </div>
            </div>

            {/* List of current certificates */}
            {certificates.length > 0 ? (
              <div className="space-y-2">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {cert.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {cert.issuer} · {cert.year} {cert.fileSize ? `(${cert.fileSize})` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {cert.fileUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewCert(cert)}
                            title="Lihat Pratinjau Sertifikat"
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={cert.fileUrl}
                            download={cert.fileName || `${cert.name.replace(/\s+/g, '_')}.pdf`}
                            title="Unduh Berkas Sertifikat"
                            className="p-1 rounded text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteCertificate(cert.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Hapus Sertifikat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 italic py-1">
                Belum ada sertifikasi teknis terlampir. Klik "Upload Sertifikat" untuk menambahkan bukti kredensial CSWP, ASME, Ansys, dsb.
              </div>
            )}

            {/* Form to add certificate */}
            {isAddingCert && (
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-cyan-200 dark:border-cyan-800 space-y-3 animate-in fade-in duration-150">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>Input Dokumen Sertifikasi Baru</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingCert(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Nama Sertifikasi: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCertName}
                      onChange={(e) => setNewCertName(e.target.value)}
                      placeholder="Contoh: Certified SolidWorks Professional (CSWP)"
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Lembaga / Penerbit:
                      </label>
                      <input
                        type="text"
                        value={newCertIssuer}
                        onChange={(e) => setNewCertIssuer(e.target.value)}
                        placeholder="Contoh: Dassault Systèmes"
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                        Tahun Terbit:
                      </label>
                      <input
                        type="number"
                        value={newCertYear}
                        onChange={(e) => setNewCertYear(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                      Unggah File Lampiran (PDF / Gambar):
                    </label>
                    <input
                      type="file"
                      ref={certFileInputRef}
                      accept=".pdf,image/*"
                      onChange={handleCertFileUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => certFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-medium"
                      >
                        <Upload className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Pilih Berkas File</span>
                      </button>
                      <span className="text-[11px] text-slate-500 truncate">
                        {newCertFileName ? `${newCertFileName} (${newCertFileSize})` : 'Belum ada file dipilih'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsAddingCert(false)}
                    className="px-3 py-1 text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCertificate}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-medium text-xs shadow-2xs"
                  >
                    Simpan Sertifikat
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PRESET INITIAL SKILLS (NEW STAFF ONLY) */}
          {!isEditMode && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preset Level Kompetensi Awal:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setInitialSkillPreset('novice')}
                  className={`py-1.5 px-2 rounded border text-center transition-all ${
                    initialSkillPreset === 'novice'
                      ? 'border-cyan-600 bg-cyan-600 text-white font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Dasar (L1)
                </button>
                <button
                  type="button"
                  onClick={() => setInitialSkillPreset('developing')}
                  className={`py-1.5 px-2 rounded border text-center transition-all ${
                    initialSkillPreset === 'developing'
                      ? 'border-cyan-600 bg-cyan-600 text-white font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Berkembang (L2)
                </button>
                <button
                  type="button"
                  onClick={() => setInitialSkillPreset('competent')}
                  className={`py-1.5 px-2 rounded border text-center transition-all ${
                    initialSkillPreset === 'competent'
                      ? 'border-cyan-600 bg-cyan-600 text-white font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Mandiri (L3)
                </button>
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5">
                Nilai per keahlian dapat disesuaikan satu per satu secara langsung di matriks setelah staff dibuat.
              </div>
            </div>
          )}

          {/* MODAL FOOTER */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            {isEditMode && onDeleteStaff ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Personil</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition-colors shadow-2xs"
              >
                {isEditMode ? 'Simpan Perubahan' : 'Tambah Staff Insinyur'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* In-app Certificate Preview Overlay */}
      <CertificatePreviewModal cert={previewCert} onClose={() => setPreviewCert(null)} />
    </div>
  );
};
