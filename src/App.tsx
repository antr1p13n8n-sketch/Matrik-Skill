/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Engineer, 
  SkillDefinition, 
  CurrentUser, 
  AuditRecord, 
  SkillLevel,
  DevelopmentReport,
  CertificateAttachment,
  PendingProfileChange
} from './types/skills';
import { 
  INITIAL_ENGINEERS, 
  INITIAL_USERS, 
  INITIAL_AUDIT_LOGS, 
  SKILL_DEFINITIONS 
} from './data/initialData';
import { generateAutomatedReport } from './utils/reportGenerator';
import { getAvatarGradient } from './utils/domainColors';
import { AccessControlBar } from './components/AccessControlBar';
import { MatrixGrid } from './components/MatrixGrid';
import { SpiderOverviewSection } from './components/SpiderOverviewSection';
import { DevelopmentReportModal } from './components/DevelopmentReportModal';
import { CertificatePreviewModal } from './components/CertificatePreviewModal';
import { SkillEditModal } from './components/SkillEditModal';
import { SelfAssessmentModal } from './components/SelfAssessmentModal';
import { ApprovalsModal } from './components/ApprovalsModal';
import { AuditTrailModal } from './components/AuditTrailModal';
import { GasExportModal } from './components/GasExportModal';
import { StaffModal } from './components/StaffModal';
import { PasswordAuthModal } from './components/PasswordAuthModal';
import { AssessmentStandardModal } from './components/AssessmentStandardModal';
import { LogoCustomizerModal } from './components/LogoCustomizerModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { SqlDatabaseModal } from './components/SqlDatabaseModal';
import { VercelDeployModal } from './components/VercelDeployModal';
import { EngineerQrModal } from './components/EngineerQrModal';
import { GapAnalysisSection } from './components/GapAnalysisSection';
import { SmartDispatchSection } from './components/SmartDispatchSection';
import { OrbitBackdrop } from './components/OrbitBackdrop';
import { QRCodeSVG } from 'qrcode.react';
import { syncDataToSql } from './services/sqlDatabase';
import { 
  subscribeToEngineers, 
  subscribeToAuditLogs, 
  subscribeToConfig,
  saveEngineerToFirestore,
  deleteEngineerFromFirestore,
  saveAuditLogToFirestore,
  saveConfigToFirestore,
  seedInitialFirestoreData,
  testConnection
} from './services/firebase';
import { UserRoleType } from './types/skills';
import { 
  LayoutDashboard, 
  Radar, 
  FileSpreadsheet, 
  ShieldCheck, 
  Moon, 
  Sun, 
  Users, 
  Flame, 
  Cpu, 
  Activity, 
  Sparkles,
  Download,
  FileCode,
  UserPlus,
  Award,
  Pencil,
  Eye,
  QrCode,
  Orbit
} from 'lucide-react';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('mechmatrix_theme') as 'light' | 'dark') || 'light';
  });

  // Orbit animation state
  const [orbitEnabled, setOrbitEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('mechmatrix_orbit_enabled');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('mechmatrix_orbit_enabled', String(orbitEnabled));
  }, [orbitEnabled]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mechmatrix_theme', theme);
  }, [theme]);

  // Engineers state with persistence
  const [engineers, setEngineers] = useState<Engineer[]>(() => {
    const saved = localStorage.getItem('mechmatrix_engineers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_ENGINEERS;
  });

  const engineersRef = useRef<Engineer[]>(engineers);
  engineersRef.current = engineers;

  useEffect(() => {
    try {
      localStorage.setItem('mechmatrix_engineers', JSON.stringify(engineers));
    } catch (err) {
      console.warn('localStorage penuh, menyimpan metadata sertifikat tanpa fileUrl:', err);
      try {
        const compact = engineers.map((eng) => ({
          ...eng,
          certificates: (eng.certificates || []).map(({ fileUrl: _omitted, ...rest }) => rest),
        }));
        localStorage.setItem('mechmatrix_engineers', JSON.stringify(compact));
      } catch (err2) {
        console.warn('Gagal menyimpan data ke localStorage:', err2);
      }
    }
  }, [engineers]);

  // Pending profile/certificate edits submitted by Supervisor awaiting Manager approval
  const [pendingProfileChanges, setPendingProfileChanges] = useState<PendingProfileChange[]>(() => {
    try {
      const saved = localStorage.getItem('mechmatrix_pending_profile_changes');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mechmatrix_pending_profile_changes', JSON.stringify(pendingProfileChanges));
    } catch (err) {
      console.warn('Gagal menyimpan antrean perubahan profil:', err);
    }
  }, [pendingProfileChanges]);

  const [supervisorNotice, setSupervisorNotice] = useState<string | null>(null);

  // Mode Akses: Wajib mulai dalam mode Viewer saat pertama kali buka app
  const defaultViewerUser = INITIAL_USERS.find((u) => u.roleType === 'viewer') || INITIAL_USERS[3];
  const [currentUser, setCurrentUser] = useState<CurrentUser>(defaultViewerUser);

  // Password Authentication State (Selalu terkunci saat buka app / reload)
  const [isManagerUnlocked, setIsManagerUnlocked] = useState<boolean>(false);
  const [isSupervisorUnlocked, setIsSupervisorUnlocked] = useState<boolean>(false);

  // Bersihkan data session lama pada saat inisialisasi awal agar selalu masuk sebagai Viewer
  useEffect(() => {
    sessionStorage.removeItem('mech_manager_unlocked');
    sessionStorage.removeItem('mech_supervisor_unlocked');
    localStorage.removeItem('mechmatrix_current_user');
  }, []);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [authTargetRole, setAuthTargetRole] = useState<UserRoleType>('manager');
  const [pendingUserSwitch, setPendingUserSwitch] = useState<CurrentUser | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [authActionDesc, setAuthActionDesc] = useState<string>('');

  // Assessment Standard Modal State (Manager Only)
  const [isAssessmentStandardOpen, setIsAssessmentStandardOpen] = useState(false);

  // Logo & Brand Customization State
  const [customLogoUrl, setCustomLogoUrl] = useState<string>(() => {
    return localStorage.getItem('mechmatrix_custom_logo') || '';
  });
  const [brandName, setBrandName] = useState<string>(() => {
    return localStorage.getItem('mechmatrix_brand_name') || 'MechMatrix';
  });
  const [brandSub, setBrandSub] = useState<string>(() => {
    return localStorage.getItem('mechmatrix_brand_sub') || 'Mechanical Engineering Matrix';
  });
  // Firebase State & Real-time Cloud Sync
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(true);

  // SQL Relational Database State (database: MechMatrix Engineering, User: Engineering)
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // Vercel Deployment Modal State
  const [isVercelModalOpen, setIsVercelModalOpen] = useState(false);

  // Real-time synchronization with Google Firebase Firestore
  useEffect(() => {
    testConnection().then((online) => setIsFirebaseOnline(online));

    const unsubEng = subscribeToEngineers((data) => {
      if (data && data.length > 0) {
        engineersRef.current = data;
        setEngineers(data);
      } else {
        // Initial seeding if Firestore collection is empty
        seedInitialFirestoreData(INITIAL_ENGINEERS, INITIAL_AUDIT_LOGS);
      }
    });

    const unsubAudit = subscribeToAuditLogs((logs) => {
      if (logs && logs.length > 0) {
        setAuditLogs(logs);
      }
    });

    const unsubConfig = subscribeToConfig((cfg) => {
      if (cfg.brandName) setBrandName(cfg.brandName);
      if (cfg.brandSub) setBrandSub(cfg.brandSub);
      if (cfg.customLogo !== undefined) setCustomLogoUrl(cfg.customLogo);
    });

    return () => {
      unsubEng();
      unsubAudit();
      unsubConfig();
    };
  }, []);

  const handleSaveLogo = (newLogoUrl: string, newBrandName: string, newBrandSub: string) => {
    setCustomLogoUrl(newLogoUrl);
    setBrandName(newBrandName);
    setBrandSub(newBrandSub);
    localStorage.setItem('mechmatrix_custom_logo', newLogoUrl);
    localStorage.setItem('mechmatrix_brand_name', newBrandName);
    localStorage.setItem('mechmatrix_brand_sub', newBrandSub);
    saveConfigToFirestore({ brandName: newBrandName, brandSub: newBrandSub, customLogo: newLogoUrl });
  };

  const handleResetLogo = () => {
    setCustomLogoUrl('');
    setBrandName('MechMatrix');
    setBrandSub('Mechanical Engineering Matrix');
    localStorage.removeItem('mechmatrix_brand_sub');
    saveConfigToFirestore({ brandName: 'MechMatrix', brandSub: 'Mechanical Engineering Matrix', customLogo: '' });
  };

  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  // Role Switch & Auth Handler
  const handleUserChangeRequest = (targetUser: CurrentUser) => {
    if (targetUser.roleType === 'viewer') {
      setCurrentUser(targetUser);
      return;
    }

    if (targetUser.roleType === 'manager') {
      if (isManagerUnlocked) {
        setCurrentUser(targetUser);
      } else {
        setAuthTargetRole('manager');
        setPendingUserSwitch(targetUser);
        setPendingAction(null);
        setAuthActionDesc('Otorisasi peran Manager (Akses Penuh). Masukkan sandi manager.');
        setIsPasswordModalOpen(true);
      }
      return;
    }

    if (targetUser.roleType === 'supervisor') {
      if (isSupervisorUnlocked || isManagerUnlocked) {
        setCurrentUser(targetUser);
      } else {
        setAuthTargetRole('supervisor');
        setPendingUserSwitch(targetUser);
        setPendingAction(null);
        setAuthActionDesc('Otorisasi peran Supervisor (Penyelia Teknis). Masukkan sandi supervisor.');
        setIsPasswordModalOpen(true);
      }
      return;
    }
  };

  const handlePasswordSuccess = (role: UserRoleType) => {
    if (role === 'manager') {
      setIsManagerUnlocked(true);
      sessionStorage.setItem('mech_manager_unlocked', 'true');
    } else if (role === 'supervisor') {
      setIsSupervisorUnlocked(true);
      sessionStorage.setItem('mech_supervisor_unlocked', 'true');
    }

    setIsPasswordModalOpen(false);

    if (pendingUserSwitch) {
      setCurrentUser(pendingUserSwitch);
      setPendingUserSwitch(null);
    }

    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleLockRole = () => {
    setIsManagerUnlocked(false);
    setIsSupervisorUnlocked(false);
    sessionStorage.removeItem('mech_manager_unlocked');
    sessionStorage.removeItem('mech_supervisor_unlocked');
    const viewerUser = INITIAL_USERS.find((u) => u.roleType === 'viewer') || INITIAL_USERS[3];
    setCurrentUser(viewerUser);
  };

  const handleOpenAssessmentStandard = () => {
    if (currentUser.roleType === 'manager' && isManagerUnlocked) {
      setIsAssessmentStandardOpen(true);
    } else {
      setAuthTargetRole('manager');
      setPendingUserSwitch(null);
      setPendingAction(() => () => setIsAssessmentStandardOpen(true));
      setAuthActionDesc('Standar dan panduan penilaian teknis bersifat rahasia manajerial. Masukkan kata sandi manager.');
      setIsPasswordModalOpen(true);
    }
  };

  // Audit records with persistence
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(() => {
    const saved = localStorage.getItem('mechmatrix_audit_logs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    localStorage.setItem('mechmatrix_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Synchronize master data to embedded SQL engine (database: MechMatrix Engineering, User: Engineering)
  useEffect(() => {
    if (engineers && engineers.length > 0) {
      syncDataToSql(engineers, auditLogs).catch((err) => {
        console.warn('Background SQL sync:', err);
      });
    }
  }, [engineers, auditLogs]);

  // Selected engineer for radar overview
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>(engineers[0].id);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'matrix' | 'spider' | 'analisis_gap' | 'smart_dispatch' | 'gap_analysis'>('matrix');

  // Modal states
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTargetEngineer, setReportTargetEngineer] = useState<Engineer | null>(null);
  const [activeReport, setActiveReport] = useState<DevelopmentReport | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSelfAssessmentOpen, setIsSelfAssessmentOpen] = useState(false);
  const [selectedCellTarget, setSelectedCellTarget] = useState<{ engineer: Engineer; skill: SkillDefinition } | null>(null);

  const [isApprovalsOpen, setIsApprovalsOpen] = useState(false);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Engineer | null>(null);
  const [previewCert, setPreviewCert] = useState<CertificateAttachment | null>(null);
  const [qrTargetEngineer, setQrTargetEngineer] = useState<Engineer | null>(null);
  const handledDeepLinkIdRef = useRef<string | null>(null);

  const getEngineerIdpUrl = (engineerId: string) => {
    if (typeof window === 'undefined') return `?idp=${encodeURIComponent(engineerId)}`;
    return `${window.location.origin}${window.location.pathname}?idp=${encodeURIComponent(engineerId)}`;
  };

  // Auto-open IDP Report directly when opened via QR Code (?idp=<engineerId>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idpParam = params.get('idp');
    if (!idpParam || handledDeepLinkIdRef.current === idpParam) return;

    const targetEng = engineers.find((e) => e.id === idpParam);
    if (targetEng) {
      handledDeepLinkIdRef.current = idpParam;
      setActiveTab('gap_analysis');
      setSelectedEngineerId(targetEng.id);
      const generated = generateAutomatedReport(targetEng, engineers, SKILL_DEFINITIONS);
      setActiveReport(generated);
      setReportTargetEngineer(targetEng);
      setIsReportOpen(true);
    }
  }, [engineers]);

  // Keep open IDP report synced if engineers data updates from Firestore
  useEffect(() => {
    if (!isReportOpen || !reportTargetEngineer) return;
    const fresh = engineers.find((e) => e.id === reportTargetEngineer.id);
    if (fresh && fresh !== reportTargetEngineer) {
      setReportTargetEngineer(fresh);
      setActiveReport(generateAutomatedReport(fresh, engineers, SKILL_DEFINITIONS));
    }
  }, [engineers, isReportOpen, reportTargetEngineer]);

  // Staff Management Handlers with password verification
  const handleOpenAddStaff = () => {
    if (currentUser.roleType === 'manager' && isManagerUnlocked) {
      setStaffToEdit(null);
      setIsStaffModalOpen(true);
    } else {
      setAuthTargetRole('manager');
      setPendingUserSwitch(null);
      setPendingAction(() => () => {
        setStaffToEdit(null);
        setIsStaffModalOpen(true);
      });
      setAuthActionDesc('Fitur input staff baru hanya dapat diakses oleh Manager. Masukkan kata sandi manager.');
      setIsPasswordModalOpen(true);
    }
  };

  const handleOpenEditStaff = (engineer: Engineer) => {
    if (
      (currentUser.roleType === 'manager' && isManagerUnlocked) ||
      (currentUser.roleType === 'supervisor' && isSupervisorUnlocked)
    ) {
      setStaffToEdit(engineer);
      setIsStaffModalOpen(true);
    } else {
      setAuthTargetRole('manager');
      setPendingUserSwitch(null);
      setPendingAction(() => () => {
        setStaffToEdit(engineer);
        setIsStaffModalOpen(true);
      });
      setAuthActionDesc('Fitur edit data staff hanya dapat diakses oleh Manager atau Supervisor.');
      setIsPasswordModalOpen(true);
    }
  };

  const handleSaveStaff = (engineerData: Partial<Engineer> & { id?: string }) => {
    const isExisting = engineers.some((e) => e.id === engineerData.id);

    // Supervisor edits require Manager approval before taking effect
    if (currentUser.roleType === 'supervisor' && isExisting && engineerData.id) {
      const existingEng = engineers.find((e) => e.id === engineerData.id);
      const certCountOld = existingEng?.certificates?.length || 0;
      const certCountNew = engineerData.certificates?.length || 0;
      const summaryParts: string[] = [];
      if (engineerData.name && engineerData.name !== existingEng?.name) summaryParts.push(`Nama: ${engineerData.name}`);
      if (engineerData.roleTitle && engineerData.roleTitle !== existingEng?.roleTitle) summaryParts.push(`Jabatan: ${engineerData.roleTitle}`);
      if (engineerData.department && engineerData.department !== existingEng?.department) summaryParts.push(`Departemen: ${engineerData.department}`);
      if (engineerData.targetBenchmark && engineerData.targetBenchmark !== existingEng?.targetBenchmark) summaryParts.push(`Benchmark: ${engineerData.targetBenchmark}`);
      if (certCountNew > certCountOld) summaryParts.push(`+${certCountNew - certCountOld} sertifikat baru`);
      if (engineerData.avatarUrl && engineerData.avatarUrl !== existingEng?.avatarUrl) summaryParts.push('Pembaruan foto profil');
      if (summaryParts.length === 0) summaryParts.push('Pembaruan data profil/sertifikat');

      const pendingChange: PendingProfileChange = {
        id: `pchange_${Date.now()}`,
        engineerId: engineerData.id,
        engineerName: existingEng?.name || engineerData.name || 'Staff',
        submittedBy: `${currentUser.name} (Supervisor)`,
        submittedAt: new Date().toISOString().split('T')[0],
        summary: summaryParts.join(', '),
        proposedData: engineerData,
      };

      setPendingProfileChanges((prev) => [pendingChange, ...prev]);
      setSupervisorNotice(`Perubahan profil ${pendingChange.engineerName} diajukan dan menunggu persetujuan Manager.`);
      setTimeout(() => setSupervisorNotice(null), 5000);
      return;
    }

    if (isExisting) {
      const existingEng = engineersRef.current.find((e) => e.id === engineerData.id);
      if (!existingEng) return;

      const updatedEng = {
        ...existingEng,
        ...engineerData,
      } as Engineer;

      const nextList = engineersRef.current.map((e) => (e.id === engineerData.id ? updatedEng : e));
      engineersRef.current = nextList;
      setEngineers(nextList);

      // Audit trail
      const audit: AuditRecord = {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        engineerId: engineerData.id!,
        engineerName: engineerData.name || 'Staff',
        skillId: 'profile_update',
        skillName: 'Pembaruan Profil Staff',
        previousLevel: 0,
        newLevel: 0,
        updatedBy: `${currentUser.name} (${currentUser.roleType})`,
        reason: `Memperbarui jabatan: ${engineerData.roleTitle}, departemen: ${engineerData.department}`,
      };
      setAuditLogs((prev) => [audit, ...prev]);

      // Sync to Firebase Cloud Firestore
      saveEngineerToFirestore(updatedEng).catch((err) => console.error('Firestore engineer sync failed:', err));
      saveAuditLogToFirestore(audit).catch((err) => console.error('Firestore audit sync failed:', err));
    } else {
      const newEng: Engineer = {
        id: engineerData.id || `eng_${Date.now()}`,
        name: engineerData.name || 'New Engineer',
        roleTitle: engineerData.roleTitle || 'Mechanical Engineer',
        department: engineerData.department || 'Mechanical Systems R&D',
        avatarUrl: engineerData.avatarUrl || '',
        email: engineerData.email || '',
        experienceYears: engineerData.experienceYears || 1,
        targetBenchmark: engineerData.targetBenchmark || 'mid_mechanical',
        skills: engineerData.skills || {},
        certificates: engineerData.certificates || [],
        selfAssessments: {},
      };

      const nextList = [...engineersRef.current, newEng];
      engineersRef.current = nextList;
      setEngineers(nextList);

      // Audit trail
      const audit: AuditRecord = {
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        engineerId: newEng.id,
        engineerName: newEng.name,
        skillId: 'staff_onboarding',
        skillName: 'Penambahan Personil Baru',
        previousLevel: 0,
        newLevel: 1,
        updatedBy: `${currentUser.name} (Manager)`,
        reason: `Input personil baru ${newEng.name} sebagai ${newEng.roleTitle} di ${newEng.department}`,
      };
      setAuditLogs((prev) => [audit, ...prev]);

      // Sync to Firebase Cloud Firestore
      saveEngineerToFirestore(newEng).catch((err) => console.error('Firestore engineer sync failed:', err));
      saveAuditLogToFirestore(audit).catch((err) => console.error('Firestore audit sync failed:', err));
    }
  };

  const handleDeleteStaff = (engineerId: string) => {
    if (currentUser.roleType !== 'manager') return;
    const targetEng = engineersRef.current.find((e) => e.id === engineerId);
    const remaining = engineersRef.current.filter((e) => e.id !== engineerId);
    engineersRef.current = remaining;
    setEngineers(remaining);

    if (selectedEngineerId === engineerId) {
      if (remaining.length > 0) setSelectedEngineerId(remaining[0].id);
    }

    const audit: AuditRecord = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      engineerId,
      engineerName: targetEng?.name || engineerId,
      skillId: 'staff_removed',
      skillName: 'Pengarsipan / Penghapusan Personil',
      previousLevel: 0,
      newLevel: 0,
      updatedBy: `${currentUser.name} (Manager)`,
      reason: `Menghapus personil ${targetEng?.name} dari matriks kompetensi aktif divisi`,
    };
    setAuditLogs((prev) => [audit, ...prev]);

    // Sync to Firebase Cloud Firestore
    deleteEngineerFromFirestore(engineerId).catch((err) => console.error('Firestore delete failed:', err));
    saveAuditLogToFirestore(audit).catch((err) => console.error('Firestore audit sync failed:', err));
  };

  // Calculate pending self-assessments
  const pendingApprovalsList = engineers.flatMap((eng) => {
    if (!eng.selfAssessments) return [];
    return Object.entries(eng.selfAssessments)
      .filter(([_, data]) => data.status === 'pending')
      .map(([skillId, data]) => {
        const skill = SKILL_DEFINITIONS.find((s) => s.id === skillId);
        return {
          engineerId: eng.id,
          engineerName: eng.name,
          skillId,
          skillName: skill?.name || skillId,
          currentLevel: eng.skills[skillId] ?? 0,
          proposedLevel: data.proposedLevel,
          notes: data.notes,
          submittedAt: data.submittedAt,
        };
      });
  });

  // Cell selection handler (differentiates by Viewer, Supervisor, Manager)
  const handleSelectCell = (engineer: Engineer, skill: SkillDefinition) => {
    setSelectedCellTarget({ engineer, skill });
    if (currentUser.roleType === 'manager' || currentUser.roleType === 'supervisor') {
      setIsEditModalOpen(true);
    } else {
      // Viewer: inspect report or skill info
      handleOpenReport(engineer);
    }
  };

  // Open automated report for any engineer
  const handleOpenReport = (engineer: Engineer) => {
    const generated = generateAutomatedReport(engineer, engineers, SKILL_DEFINITIONS);
    setActiveReport(generated);
    setReportTargetEngineer(engineer);
    setIsReportOpen(true);
  };

  const handleCloseReport = () => {
    setIsReportOpen(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('idp')) {
        url.searchParams.delete('idp');
        window.history.replaceState({}, '', url.pathname + url.search + url.hash);
      }
    }
  };

  // Manager saves skill level directly; Supervisor submits for Manager approval
  const handleSaveSkillLevel = (
    engineerId: string, 
    skillId: string, 
    newLevel: SkillLevel, 
    reason: string
  ) => {
    if (currentUser.roleType === 'supervisor') {
      const targetEng = engineersRef.current.find((e) => e.id === engineerId);
      handleSubmitSelfAssessment(
        engineerId,
        skillId,
        newLevel,
        `[Pengajuan Supervisor: ${currentUser.name}] ${reason}`
      );
      setSupervisorNotice(`Perubahan skor kompetensi ${targetEng?.name || ''} diajukan untuk persetujuan Manager.`);
      setTimeout(() => setSupervisorNotice(null), 5000);
      return;
    }

    const engineer = engineersRef.current.find((e) => e.id === engineerId);
    if (!engineer) return;

    const updatedTargetEng: Engineer = {
      ...engineer,
      skills: {
        ...engineer.skills,
        [skillId]: newLevel,
      },
    };

    const nextList = engineersRef.current.map((eng) =>
      eng.id === engineerId ? updatedTargetEng : eng
    );
    engineersRef.current = nextList;
    setEngineers(nextList);

    const skill = SKILL_DEFINITIONS.find((s) => s.id === skillId);

    // Record audit trail
    const newRecord: AuditRecord = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      engineerId,
      engineerName: engineer.name || engineerId,
      skillId,
      skillName: skill?.name || skillId,
      previousLevel: (engineer.skills[skillId] ?? 0) as SkillLevel,
      newLevel,
      updatedBy: `${currentUser.name} (${currentUser.title})`,
      reason,
    };

    setAuditLogs((prev) => [newRecord, ...prev]);

    // Sync to Firestore
    saveEngineerToFirestore(updatedTargetEng).catch((err) => console.error('Firestore engineer sync failed:', err));
    saveAuditLogToFirestore(newRecord).catch((err) => console.error('Firestore audit sync failed:', err));
  };

  // Engineer submits self-assessment
  const handleSubmitSelfAssessment = (
    engineerId: string,
    skillId: string,
    proposedLevel: SkillLevel,
    notes: string
  ) => {
    const engineer = engineersRef.current.find((e) => e.id === engineerId);
    if (!engineer) return;

    const updatedTargetEng: Engineer = {
      ...engineer,
      selfAssessments: {
        ...(engineer.selfAssessments || {}),
        [skillId]: {
          proposedLevel,
          notes,
          submittedAt: new Date().toISOString().split('T')[0],
          status: 'pending' as const,
        },
      },
    };

    const nextList = engineersRef.current.map((eng) =>
      eng.id === engineerId ? updatedTargetEng : eng
    );
    engineersRef.current = nextList;
    setEngineers(nextList);

    // Sync to Firestore
    saveEngineerToFirestore(updatedTargetEng).catch((err) => console.error('Firestore engineer sync failed:', err));
  };

  // Manager approves self-assessment
  const handleApproveSelfAssessment = (
    engineerId: string,
    skillId: string,
    level: number,
    notes: string
  ) => {
    if (currentUser.roleType !== 'manager') return;
    const engineer = engineersRef.current.find((e) => e.id === engineerId);
    if (!engineer) return;

    const newSelf = { ...(engineer.selfAssessments || {}) };
    if (newSelf[skillId]) {
      newSelf[skillId] = { ...newSelf[skillId], status: 'approved' };
    } else {
      newSelf[skillId] = {
        proposedLevel: level as SkillLevel,
        notes,
        submittedAt: new Date().toISOString().split('T')[0],
        status: 'approved',
      };
    }

    const updatedTargetEng: Engineer = {
      ...engineer,
      skills: {
        ...engineer.skills,
        [skillId]: level as SkillLevel,
      },
      selfAssessments: newSelf,
    };

    const nextList = engineersRef.current.map((eng) =>
      eng.id === engineerId ? updatedTargetEng : eng
    );
    engineersRef.current = nextList;
    setEngineers(nextList);

    const skill = SKILL_DEFINITIONS.find((s) => s.id === skillId);

    // Record audit
    const newRecord: AuditRecord = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      engineerId,
      engineerName: engineer.name || engineerId,
      skillId,
      skillName: skill?.name || skillId,
      previousLevel: (engineer.skills[skillId] ?? 0) as SkillLevel,
      newLevel: level as SkillLevel,
      updatedBy: `${currentUser.name} (Manager Approval)`,
      reason: `Persetujuan penilaian mandiri insinyur: "${notes}"`,
    };

    setAuditLogs((prev) => [newRecord, ...prev]);

    // Sync to Firestore
    saveEngineerToFirestore(updatedTargetEng).catch((err) => console.error('Firestore engineer sync failed:', err));
    saveAuditLogToFirestore(newRecord).catch((err) => console.error('Firestore audit sync failed:', err));
  };

  // Manager approves Supervisor's profile/certificate change
  const handleApproveProfileChange = (changeId: string) => {
    if (currentUser.roleType !== 'manager') return;
    const change = pendingProfileChanges.find((c) => c.id === changeId);
    if (!change) return;

    const engineer = engineersRef.current.find((e) => e.id === change.engineerId);
    if (!engineer) return;

    const updatedTargetEng: Engineer = {
      ...engineer,
      ...change.proposedData,
    } as Engineer;

    const nextList = engineersRef.current.map((eng) =>
      eng.id === change.engineerId ? updatedTargetEng : eng
    );
    engineersRef.current = nextList;
    setEngineers(nextList);

    const audit: AuditRecord = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      engineerId: change.engineerId,
      engineerName: change.engineerName,
      skillId: 'profile_approval',
      skillName: 'Persetujuan Edit Profil & Sertifikat',
      previousLevel: 0,
      newLevel: 0,
      updatedBy: `${currentUser.name} (Manager)`,
      reason: `Menyetujui pengajuan ${change.submittedBy}: ${change.summary}`,
    };
    setAuditLogs((prev) => [audit, ...prev]);

    saveEngineerToFirestore(updatedTargetEng).catch((err) => console.error('Firestore engineer sync failed:', err));
    saveAuditLogToFirestore(audit).catch((err) => console.error('Firestore audit sync failed:', err));
    setPendingProfileChanges((prev) => prev.filter((c) => c.id !== changeId));
  };

  // Manager rejects Supervisor's profile/certificate change
  const handleRejectProfileChange = (changeId: string) => {
    if (currentUser.roleType !== 'manager') return;
    setPendingProfileChanges((prev) => prev.filter((c) => c.id !== changeId));
  };

  // Manager rejects self-assessment
  const handleRejectSelfAssessment = (engineerId: string, skillId: string) => {
    if (currentUser.roleType !== 'manager') return;
    const engineer = engineersRef.current.find((e) => e.id === engineerId);
    if (!engineer) return;

    const newSelf = { ...(engineer.selfAssessments || {}) };
    if (newSelf[skillId]) {
      newSelf[skillId] = { ...newSelf[skillId], status: 'rejected' };
    }
    const updatedTargetEng: Engineer = {
      ...engineer,
      selfAssessments: newSelf,
    };

    const nextList = engineersRef.current.map((eng) =>
      eng.id === engineerId ? updatedTargetEng : eng
    );
    engineersRef.current = nextList;
    setEngineers(nextList);

    saveEngineerToFirestore(updatedTargetEng).catch((err) => console.error('Firestore engineer sync failed:', err));
  };

  // Division summary calculations
  const totalEngineers = engineers.length;
  let totalScoreSum = 0;
  let totalDataPoints = 0;
  engineers.forEach((eng) => {
    SKILL_DEFINITIONS.forEach((s) => {
      totalScoreSum += eng.skills[s.id] ?? 0;
      totalDataPoints += 1;
    });
  });
  const divisionAvgScore = totalDataPoints > 0 ? (totalScoreSum / totalDataPoints).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-prism-mesh relative text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 print:min-h-0 print:bg-white">
      {orbitEnabled && <OrbitBackdrop />}
      <div className={isReportOpen ? 'print:hidden flex flex-col flex-1 relative z-10' : 'flex flex-col flex-1 relative z-10'}>
      {/* 1. Access Control Bar */}
      <AccessControlBar
        currentUser={currentUser}
        onUserChangeRequest={handleUserChangeRequest}
        pendingApprovalsCount={pendingApprovalsList.length + pendingProfileChanges.length}
        onOpenApprovals={() => setIsApprovalsOpen(true)}
        onOpenAuditLogs={() => setIsAuditTrailOpen(true)}
        onOpenAssessmentStandard={handleOpenAssessmentStandard}
        onLockRole={handleLockRole}
        isManagerUnlocked={isManagerUnlocked}
        isSupervisorUnlocked={isSupervisorUnlocked}
        onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)}
        onOpenSqlDatabase={() => setIsSqlModalOpen(true)}
      />

      {supervisorNotice && (
        <div className="bg-linear-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/70 dark:via-orange-950/60 dark:to-amber-950/70 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-800 dark:text-amber-200 text-center font-semibold print:hidden">
          {supervisorNotice}
        </div>
      )}

      {/* 2. Top Navigation Bar (Strict Top Bar Contract: 3 Zones separated by gap-8) */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-3 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Customizable Wordmark / Company Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 flex items-center gap-2.5 hover:opacity-85 transition-opacity text-left group cursor-pointer"
              title="Klik untuk mengganti logo atau nama departemen"
            >
              {customLogoUrl ? (
                <img
                  src={customLogoUrl}
                  alt={brandName}
                  className="h-8 max-w-[130px] object-contain rounded"
                />
              ) : (
                <span className="relative w-8 h-8 rounded-xl bg-linear-to-br from-cyan-500 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-black shadow-sm shadow-indigo-500/30 shrink-0">
                  M
                  {orbitEnabled && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-1.5 rounded-full border border-dashed border-cyan-500/55 dark:border-cyan-400/55 animate-orbit-cw"
                      style={{ '--orbit-duration': '12s' } as React.CSSProperties}
                    >
                      <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)]" />
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-fuchsia-400" />
                    </span>
                  )}
                </span>
              )}
              <div className="flex flex-col">
                <span className="leading-tight flex items-center gap-1.5 font-extrabold bg-linear-to-r from-slate-900 via-indigo-900 to-cyan-800 dark:from-white dark:via-cyan-200 dark:to-indigo-200 bg-clip-text text-transparent">
                  {brandName}
                  <Pencil className="w-3 h-3 text-slate-400 group-hover:text-cyan-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight hidden sm:block">
                  {brandSub}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: clean single-line colorful segmented navigation links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-linear-to-r from-cyan-500 to-sky-600 text-white shadow-xs shadow-cyan-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
              }`}
            >
              Matriks Real-Time
            </button>
            <button
              onClick={() => setActiveTab('spider')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'spider'
                  ? 'bg-linear-to-r from-indigo-500 to-violet-600 text-white shadow-xs shadow-indigo-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
              }`}
            >
              Spider Chart
            </button>
            <button
              onClick={() => setActiveTab('analisis_gap')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'analisis_gap'
                  ? 'bg-linear-to-r from-rose-500 to-amber-500 text-white shadow-xs shadow-rose-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
              }`}
            >
              Analisis Gap
            </button>
            <button
              onClick={() => setActiveTab('smart_dispatch')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'smart_dispatch'
                  ? 'bg-linear-to-r from-amber-500 to-orange-600 text-white shadow-xs shadow-amber-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
              }`}
            >
              Smart Dispatch
            </button>
            <button
              onClick={() => setActiveTab('gap_analysis')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'gap_analysis'
                  ? 'bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700/60'
              }`}
            >
              Rencana Pengembangan (IDP)
            </button>
          </nav>

          {/* Zone 3: 1 primary action + theme toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            {currentUser.roleType === 'manager' && isManagerUnlocked && (
              <>
                <button
                  onClick={() => setIsGasModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:brightness-95 transition-all whitespace-nowrap shadow-2xs cursor-pointer"
                  title="Salin Code.gs dan Index.html untuk Google Apps Script"
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Kode Apps Script</span>
                </button>

                <button
                  onClick={() => setIsVercelModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-900/20 dark:border-white/20 bg-slate-900 text-white dark:bg-black text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
                  title="Panduan & Konfigurasi Online Vercel (vercel.app)"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 1155 1000">
                    <path d="m577.3 0 577.4 1000H0z" />
                  </svg>
                  <span>Deploy Vercel</span>
                </button>
              </>
            )}

            <button
              onClick={() => setOrbitEnabled((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                orbitEnabled
                  ? 'border-cyan-300 dark:border-cyan-700 bg-cyan-50/90 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 hover:brightness-95'
                  : 'border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-400 dark:text-slate-500 hover:border-cyan-300 dark:hover:border-cyan-700'
              }`}
              title={orbitEnabled ? 'Nonaktifkan efek animasi orbit' : 'Aktifkan efek animasi orbit'}
              aria-label="Toggle efek animasi orbit"
            >
              <Orbit className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer shadow-2xs"
              title={`Beralih ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            <button
              onClick={() => handleOpenReport(engineers.find((e) => e.id === selectedEngineerId) || engineers[0])}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-linear-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:brightness-110 rounded-xl transition-all whitespace-nowrap shrink-0 shadow-sm shadow-indigo-500/25 cursor-pointer"
            >
              Laporan Pengembangan
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="md:hidden mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-semibold text-slate-600 dark:text-slate-400">
          {[
            { id: 'matrix', label: 'Matriks', activeClass: 'bg-linear-to-r from-cyan-500 to-sky-600 text-white' },
            { id: 'spider', label: 'Spider Chart', activeClass: 'bg-linear-to-r from-indigo-500 to-violet-600 text-white' },
            { id: 'analisis_gap', label: 'Analisis Gap', activeClass: 'bg-linear-to-r from-rose-500 to-amber-500 text-white' },
            { id: 'smart_dispatch', label: 'Smart Dispatch', activeClass: 'bg-linear-to-r from-amber-500 to-orange-600 text-white' },
            { id: 'gap_analysis', label: 'IDP', activeClass: 'bg-linear-to-r from-emerald-500 to-teal-600 text-white' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`whitespace-nowrap shrink-0 px-3 py-1 rounded-lg transition-all ${
                activeTab === tab.id
                  ? tab.activeClass
                  : 'bg-slate-100/80 dark:bg-slate-800/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 3. Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Executive Department KPI Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl border border-cyan-200/80 dark:border-cyan-800/60 bg-linear-to-br from-white via-cyan-50/60 to-sky-50/80 dark:from-slate-900 dark:via-cyan-950/25 dark:to-sky-950/25 shadow-2xs">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center justify-between">
              <span>Total Insinyur Divisi</span>
              <span className="w-8 h-8 rounded-xl bg-linear-to-br from-cyan-500 to-sky-600 text-white flex items-center justify-center shadow-xs shadow-cyan-500/25">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-2">
              {totalEngineers} <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Personil</span>
            </div>
            <div className="text-[11px] text-cyan-700 dark:text-cyan-400 font-medium mt-1">Aerospace & Automation Group</div>
          </div>

          <div className="p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 bg-linear-to-br from-white via-indigo-50/60 to-violet-50/80 dark:from-slate-900 dark:via-indigo-950/25 dark:to-violet-950/25 shadow-2xs">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center justify-between">
              <span>Rata-rata Skor Teknis</span>
              <span className="w-8 h-8 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-xs shadow-indigo-500/25">
                <Activity className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums mt-2">
              {divisionAvgScore} <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ 5.0</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Status: Kompeten (L3 Mandiri)</div>
          </div>

          <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-linear-to-br from-white via-amber-50/60 to-orange-50/80 dark:from-slate-900 dark:via-amber-950/25 dark:to-orange-950/25 shadow-2xs">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center justify-between">
              <span>Domain Kompetensi</span>
              <span className="w-8 h-8 rounded-xl bg-linear-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs shadow-amber-500/25">
                <Flame className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tabular-nums mt-2">
              7 <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kategori Utama</span>
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-1">{SKILL_DEFINITIONS.length} Kriteria Terpantau</div>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 bg-linear-to-br from-white via-emerald-50/60 to-teal-50/80 dark:from-slate-900 dark:via-emerald-950/25 dark:to-teal-950/25 shadow-2xs">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold flex items-center justify-between">
              <span>Kepatuhan Standar</span>
              <span className="w-8 h-8 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shadow-emerald-500/25">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-2">
              ISO 9001 <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">& AS9100</span>
            </div>
            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">Audit Trail Aktif & Terlindungi</div>
          </div>
        </section>

        {/* View 1: Real-Time Competency Matrix */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <span className="w-2.5 h-8 rounded-full bg-linear-to-b from-cyan-500 to-indigo-600 mt-0.5 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Matriks Kompetensi Teknik Mesin Real-Time
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lacak penguasaan teknis personil secara langsung. Klik pada sel kompetensi untuk mengevaluasi skor (Manajer) atau mengajukan verifikasi mandiri (Insinyur).
                </p>
              </div>
            </div>

            <MatrixGrid
              engineers={engineers}
              skills={SKILL_DEFINITIONS}
              currentUser={currentUser}
              onSelectCell={handleSelectCell}
              onOpenReport={handleOpenReport}
              onAddStaff={handleOpenAddStaff}
              onEditStaff={handleOpenEditStaff}
            />

            {/* Embedded Spider Chart preview below matrix */}
            <div className="pt-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                Visualisasi Spider Chart Terpilih
              </h3>
              <SpiderOverviewSection
                engineers={engineers}
                skills={SKILL_DEFINITIONS}
                auditLogs={auditLogs}
                selectedEngineerId={selectedEngineerId}
                onSelectEngineerId={setSelectedEngineerId}
                onOpenReport={handleOpenReport}
                orbitEnabled={orbitEnabled}
              />
            </div>
          </div>
        )}

        {/* View 2: Spider Chart Visualizer */}
        {activeTab === 'spider' && (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <span className="w-2.5 h-8 rounded-full bg-linear-to-b from-indigo-500 to-fuchsia-600 mt-0.5 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Analisis Visualisasi Spider Chart (Radar Kompetensi)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visualisasikan distribusi kekuatan mekanikal (CAD, FEA, CFD, Material, Mekatronika, RAMS, Regulasi). Bandingkan langsung dengan standar peran atau rata-rata divisi.
                </p>
              </div>
            </div>

            <SpiderOverviewSection
              engineers={engineers}
              skills={SKILL_DEFINITIONS}
              auditLogs={auditLogs}
              selectedEngineerId={selectedEngineerId}
              onSelectEngineerId={setSelectedEngineerId}
              onOpenReport={handleOpenReport}
              orbitEnabled={orbitEnabled}
            />
          </div>
        )}

        {/* View 2B: Analisis Gap Kompetensi */}
        {activeTab === 'analisis_gap' && (
          <GapAnalysisSection
            engineers={engineers}
            skills={SKILL_DEFINITIONS}
            onOpenReport={handleOpenReport}
          />
        )}

        {/* View 2C: Smart Dispatch */}
        {activeTab === 'smart_dispatch' && (
          <SmartDispatchSection
            engineers={engineers}
            skills={SKILL_DEFINITIONS}
            onOpenReport={handleOpenReport}
          />
        )}

        {/* View 3: Individual Development Plan (IDP) Catalog for Engineers */}
        {activeTab === 'gap_analysis' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-2.5 h-8 rounded-full bg-linear-to-b from-emerald-500 to-teal-600 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Katalog Laporan Otomatis Pengembangan Insinyur (IDP)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Setiap pengembang / insinyur memiliki profil rencana aksi mandiri (30-60-90 hari) dengan rekomendasi mentor sebaya internal dan kurikulum sertifikasi.
                  </p>
                </div>
              </div>

              {currentUser.roleType === 'manager' && (
                <button
                  onClick={handleOpenAddStaff}
                  className="px-4 py-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/25 self-start sm:self-auto whitespace-nowrap cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Input Staff Baru</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {engineers.map((eng) => {
                const rep = generateAutomatedReport(eng, engineers, SKILL_DEFINITIONS);
                const idpDirectUrl = getEngineerIdpUrl(eng.id);

                return (
                  <div
                    key={eng.id}
                    className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-xs hover:border-cyan-400/70 hover:shadow-md hover:shadow-cyan-500/5 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          {eng.avatarUrl ? (
                            <img
                              src={eng.avatarUrl}
                              alt={eng.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-full object-cover border-2 border-cyan-300 dark:border-cyan-700 shrink-0"
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-full bg-linear-to-br ${getAvatarGradient(eng.name)} flex items-center justify-center text-white font-bold shadow-xs shrink-0`}>
                              {eng.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{eng.name}</h4>
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">{eng.roleTitle}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{eng.department}</span>
                              {eng.certificates && eng.certificates.length > 0 && (
                                <span 
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[9px] font-semibold shrink-0" 
                                  title={`${eng.certificates.length} Sertifikat Terverifikasi`}
                                >
                                  <Award className="w-2.5 h-2.5" />
                                  <span>{eng.certificates.length}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Scannable QR Code Badge on Profile Card */}
                        <button
                          type="button"
                          onClick={() => setQrTargetEngineer(eng)}
                          title={`Scan atau klik untuk perbesar / unduh QR Code Laporan IDP ${eng.name}`}
                          className="shrink-0 p-1.5 rounded-xl bg-white border border-cyan-200 dark:border-cyan-700/80 shadow-xs hover:scale-105 hover:border-indigo-400 transition-all cursor-pointer group flex flex-col items-center"
                        >
                          <QRCodeSVG
                            value={idpDirectUrl}
                            size={52}
                            bgColor="#ffffff"
                            fgColor="#0f172a"
                            level="L"
                          />
                          <span className="text-[8px] font-bold tracking-wide text-indigo-600 group-hover:text-cyan-600 mt-0.5 uppercase">
                            QR IDP
                          </span>
                        </button>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-800/40">
                          <div className="text-cyan-700 dark:text-cyan-300 text-[10px] font-semibold">Skor Rata2</div>
                          <div className="font-mono font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums mt-0.5">
                            {rep.summary.averageScore}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
                          <div className="text-amber-700 dark:text-amber-300 text-[10px] font-semibold">Target</div>
                          <div className="font-mono font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                            {rep.summary.targetScore}
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40">
                          <div className="text-rose-700 dark:text-rose-300 text-[10px] font-semibold">Kesenjangan</div>
                          <div className="font-mono font-extrabold text-rose-600 dark:text-rose-400 tabular-nums mt-0.5">
                            {rep.summary.gapCount} skills
                          </div>
                        </div>
                      </div>

                      {rep.criticalGaps.length > 0 && (
                        <div className="mt-3 text-xs">
                          <div className="text-slate-500 text-[11px] font-semibold mb-1">Fokus Gap Utama:</div>
                          <div className="p-2.5 rounded-xl bg-linear-to-r from-rose-50/80 to-amber-50/60 dark:from-rose-950/30 dark:to-amber-950/20 border border-rose-200/70 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 text-[11px] font-medium">
                            {rep.criticalGaps[0].skillName} (-{rep.criticalGaps[0].deficit} level)
                          </div>
                        </div>
                      )}

                      {eng.certificates && eng.certificates.length > 0 && (
                        <div className="mt-3 text-xs">
                          <div className="text-slate-500 text-[11px] font-semibold mb-1 flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-500" />
                            <span>Sertifikasi Terlampir ({eng.certificates.length}):</span>
                          </div>
                          <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
                            {eng.certificates.map((cert) => (
                              <button
                                key={cert.id}
                                type="button"
                                onClick={() => setPreviewCert(cert)}
                                title={cert.fileUrl ? 'Klik untuk membuka sertifikat' : 'Lihat detail sertifikat'}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl bg-amber-500/8 hover:bg-amber-500/15 border border-amber-500/25 flex items-center justify-between gap-2 text-[11px] transition-colors group cursor-pointer"
                              >
                                <span className="font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                                  {cert.name}
                                </span>
                                <span className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {cert.year}
                                  </span>
                                  {(cert.fileUrl || cert.hasFile) && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                                      <Eye className="w-2.5 h-2.5" />
                                      Buka
                                    </span>
                                  )}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 font-medium">
                        {eng.experienceYears} Tahun Pengalaman
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQrTargetEngineer(eng)}
                          className="p-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                          title="Generate / Perbesar QR Code IDP"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenReport(eng)}
                          className="px-3.5 py-1.5 rounded-xl bg-linear-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:brightness-110 text-white font-semibold text-xs transition-all shadow-sm shadow-cyan-500/20 cursor-pointer"
                        >
                          Buka Laporan IDP
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-linear-to-r from-cyan-500 to-indigo-500" />
            <span className="font-bold text-slate-800 dark:text-slate-200">MechMatrix</span>
            <span>· Sistem Matriks Kompetensi Rekayasa Mekanikal & Otomasi</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Standar Acuan: ASME Y14.5 · ISO 9001 · AS9100 Rev D</span>
          </div>
        </div>
      </footer>
      </div>

      {/* Modals */}
      <DevelopmentReportModal
        isOpen={isReportOpen}
        onClose={handleCloseReport}
        report={activeReport}
        engineer={reportTargetEngineer}
      />

      <SkillEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        engineer={selectedCellTarget?.engineer || null}
        skill={selectedCellTarget?.skill || null}
        isSupervisor={currentUser.roleType === 'supervisor'}
        onSave={handleSaveSkillLevel}
      />

      <SelfAssessmentModal
        isOpen={isSelfAssessmentOpen}
        onClose={() => setIsSelfAssessmentOpen(false)}
        engineer={selectedCellTarget?.engineer || null}
        skill={selectedCellTarget?.skill || null}
        onSubmitSelfAssessment={handleSubmitSelfAssessment}
      />

      <ApprovalsModal
        isOpen={isApprovalsOpen}
        onClose={() => setIsApprovalsOpen(false)}
        canApprove={currentUser.roleType === 'manager'}
        pendingItems={pendingApprovalsList}
        pendingProfileChanges={pendingProfileChanges}
        onApprove={handleApproveSelfAssessment}
        onReject={handleRejectSelfAssessment}
        onApproveProfileChange={handleApproveProfileChange}
        onRejectProfileChange={handleRejectProfileChange}
      />

      <AuditTrailModal
        isOpen={isAuditTrailOpen}
        onClose={() => setIsAuditTrailOpen(false)}
        logs={auditLogs}
      />

      <GasExportModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />

      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        staffToEdit={staffToEdit}
        canDelete={currentUser.roleType === 'manager'}
        requiresApproval={currentUser.roleType === 'supervisor'}
        onSaveStaff={handleSaveStaff}
        onDeleteStaff={handleDeleteStaff}
      />

      <PasswordAuthModal
        isOpen={isPasswordModalOpen}
        targetRole={authTargetRole}
        onSuccess={handlePasswordSuccess}
        onCancel={() => {
          setIsPasswordModalOpen(false);
          setPendingUserSwitch(null);
          setPendingAction(null);
        }}
        actionDescription={authActionDesc}
      />

      <AssessmentStandardModal
        isOpen={isAssessmentStandardOpen}
        onClose={() => setIsAssessmentStandardOpen(false)}
      />

      <LogoCustomizerModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        currentLogoUrl={customLogoUrl}
        currentBrandName={brandName}
        currentBrandSub={brandSub}
        onSaveLogo={handleSaveLogo}
        onResetLogo={handleResetLogo}
      />

      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        engineersCount={engineers.length}
        auditLogsCount={auditLogs.length}
        engineers={engineers}
        auditLogs={auditLogs}
        isOnline={isFirebaseOnline}
      />

      <SqlDatabaseModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        engineers={engineers}
        auditLogs={auditLogs}
      />

      <VercelDeployModal
        isOpen={isVercelModalOpen}
        onClose={() => setIsVercelModalOpen(false)}
      />

      <CertificatePreviewModal
        cert={previewCert}
        onClose={() => setPreviewCert(null)}
      />

      <EngineerQrModal
        engineer={qrTargetEngineer}
        idpUrl={qrTargetEngineer ? getEngineerIdpUrl(qrTargetEngineer.id) : ''}
        onClose={() => setQrTargetEngineer(null)}
        onOpenReport={handleOpenReport}
      />
    </div>
  );
}
