/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Engineer, 
  SkillDefinition, 
  CurrentUser, 
  AuditRecord, 
  SkillLevel,
  DevelopmentReport,
  CertificateAttachment
} from './types/skills';
import { 
  INITIAL_ENGINEERS, 
  INITIAL_USERS, 
  INITIAL_AUDIT_LOGS, 
  SKILL_DEFINITIONS 
} from './data/initialData';
import { generateAutomatedReport } from './utils/reportGenerator';
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
import { GapAnalysisSection } from './components/GapAnalysisSection';
import { SmartDispatchSection } from './components/SmartDispatchSection';
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
  Eye
} from 'lucide-react';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('mechmatrix_theme') as 'light' | 'dark') || 'light';
  });

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
    if (currentUser.roleType === 'manager' && isManagerUnlocked) {
      setStaffToEdit(engineer);
      setIsStaffModalOpen(true);
    } else {
      setAuthTargetRole('manager');
      setPendingUserSwitch(null);
      setPendingAction(() => () => {
        setStaffToEdit(engineer);
        setIsStaffModalOpen(true);
      });
      setAuthActionDesc('Fitur edit data staff hanya dapat diakses oleh Manager. Masukkan kata sandi manager.');
      setIsPasswordModalOpen(true);
    }
  };

  const handleSaveStaff = (engineerData: Partial<Engineer> & { id?: string }) => {
    const isExisting = engineers.some((e) => e.id === engineerData.id);

    if (isExisting) {
      const updatedEng = {
        ...engineers.find((e) => e.id === engineerData.id),
        ...engineerData,
      } as Engineer;

      setEngineers((prev) =>
        prev.map((e) => (e.id === engineerData.id ? updatedEng : e))
      );

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
      saveEngineerToFirestore(updatedEng);
      saveAuditLogToFirestore(audit);
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

      setEngineers((prev) => [...prev, newEng]);

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
      saveEngineerToFirestore(newEng);
      saveAuditLogToFirestore(audit);
    }
  };

  const handleDeleteStaff = (engineerId: string) => {
    const targetEng = engineers.find((e) => e.id === engineerId);
    setEngineers((prev) => prev.filter((e) => e.id !== engineerId));

    if (selectedEngineerId === engineerId) {
      const remaining = engineers.filter((e) => e.id !== engineerId);
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
    deleteEngineerFromFirestore(engineerId);
    saveAuditLogToFirestore(audit);
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

  // Manager saves skill level directly
  const handleSaveSkillLevel = (
    engineerId: string, 
    skillId: string, 
    newLevel: SkillLevel, 
    reason: string
  ) => {
    let updatedTargetEng: Engineer | null = null;
    setEngineers((prev) =>
      prev.map((eng) => {
        if (eng.id !== engineerId) return eng;
        const updated = {
          ...eng,
          skills: {
            ...eng.skills,
            [skillId]: newLevel,
          },
        };
        updatedTargetEng = updated;
        return updated;
      })
    );

    const engineer = engineers.find((e) => e.id === engineerId);
    const skill = SKILL_DEFINITIONS.find((s) => s.id === skillId);

    // Record audit trail
    const newRecord: AuditRecord = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      engineerId,
      engineerName: engineer?.name || engineerId,
      skillId,
      skillName: skill?.name || skillId,
      previousLevel: (engineer?.skills[skillId] ?? 0) as SkillLevel,
      newLevel,
      updatedBy: `${currentUser.name} (${currentUser.title})`,
      reason,
    };

    setAuditLogs((prev) => [newRecord, ...prev]);

    // Sync to Firestore
    if (updatedTargetEng) {
      saveEngineerToFirestore(updatedTargetEng);
    }
    saveAuditLogToFirestore(newRecord);
  };

  // Engineer submits self-assessment
  const handleSubmitSelfAssessment = (
    engineerId: string,
    skillId: string,
    proposedLevel: SkillLevel,
    notes: string
  ) => {
    let updatedTargetEng: Engineer | null = null;
    setEngineers((prev) =>
      prev.map((eng) => {
        if (eng.id !== engineerId) return eng;
        const updated = {
          ...eng,
          selfAssessments: {
            ...eng.selfAssessments,
            [skillId]: {
              proposedLevel,
              notes,
              submittedAt: new Date().toISOString().split('T')[0],
              status: 'pending' as const,
            },
          },
        };
        updatedTargetEng = updated;
        return updated;
      })
    );

    // Sync to Firestore
    if (updatedTargetEng) {
      saveEngineerToFirestore(updatedTargetEng);
    }
  };

  // Manager approves self-assessment
  const handleApproveSelfAssessment = (
    engineerId: string,
    skillId: string,
    level: number,
    notes: string
  ) => {
    let updatedTargetEng: Engineer | null = null;
    setEngineers((prev) =>
      prev.map((eng) => {
        if (eng.id !== engineerId) return eng;
        const newSelf = { ...eng.selfAssessments };
        if (newSelf[skillId]) {
          newSelf[skillId] = { ...newSelf[skillId], status: 'approved' };
        }
        const updated = {
          ...eng,
          skills: {
            ...eng.skills,
            [skillId]: level as SkillLevel,
          },
          selfAssessments: newSelf,
        };
        updatedTargetEng = updated;
        return updated;
      })
    );

    const engineer = engineers.find((e) => e.id === engineerId);
    const skill = SKILL_DEFINITIONS.find((s) => s.id === skillId);

    // Record audit
    const newRecord: AuditRecord = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      engineerId,
      engineerName: engineer?.name || engineerId,
      skillId,
      skillName: skill?.name || skillId,
      previousLevel: (engineer?.skills[skillId] ?? 0) as SkillLevel,
      newLevel: level as SkillLevel,
      updatedBy: `${currentUser.name} (Manager Approval)`,
      reason: `Persetujuan penilaian mandiri insinyur: "${notes}"`,
    };

    setAuditLogs((prev) => [newRecord, ...prev]);

    // Sync to Firestore
    if (updatedTargetEng) {
      saveEngineerToFirestore(updatedTargetEng);
    }
    saveAuditLogToFirestore(newRecord);
  };

  // Manager rejects self-assessment
  const handleRejectSelfAssessment = (engineerId: string, skillId: string) => {
    let updatedTargetEng: Engineer | null = null;
    setEngineers((prev) =>
      prev.map((eng) => {
        if (eng.id !== engineerId) return eng;
        const newSelf = { ...eng.selfAssessments };
        if (newSelf[skillId]) {
          newSelf[skillId] = { ...newSelf[skillId], status: 'rejected' };
        }
        const updated = { ...eng, selfAssessments: newSelf };
        updatedTargetEng = updated;
        return updated;
      })
    );

    if (updatedTargetEng) {
      saveEngineerToFirestore(updatedTargetEng);
    }
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
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 print:min-h-0 print:bg-white">
      <div className={isReportOpen ? 'print:hidden flex flex-col flex-1' : 'flex flex-col flex-1'}>
      {/* 1. Access Control Bar */}
      <AccessControlBar
        currentUser={currentUser}
        onUserChangeRequest={handleUserChangeRequest}
        pendingApprovalsCount={pendingApprovalsList.length}
        onOpenApprovals={() => setIsApprovalsOpen(true)}
        onOpenAuditLogs={() => setIsAuditTrailOpen(true)}
        onOpenAssessmentStandard={handleOpenAssessmentStandard}
        onLockRole={handleLockRole}
        isManagerUnlocked={isManagerUnlocked}
        isSupervisorUnlocked={isSupervisorUnlocked}
        onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)}
        onOpenSqlDatabase={() => setIsSqlModalOpen(true)}
      />

      {/* 2. Top Navigation Bar (Strict Top Bar Contract: 3 Zones separated by gap-8) */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 sticky top-0 z-30 shadow-2xs">
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
                <span className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white text-xs font-black shadow-xs">
                  M
                </span>
              )}
              <div className="flex flex-col">
                <span className="leading-tight flex items-center gap-1.5 font-bold">
                  {brandName}
                  <Pencil className="w-3 h-3 text-slate-400 group-hover:text-cyan-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="text-[10px] text-slate-400 font-normal leading-tight hidden sm:block">
                  {brandSub}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'matrix' ? 'text-cyan-600 dark:text-cyan-400 font-bold border-b-2 border-cyan-600 pb-0.5' : ''
              }`}
            >
              Matriks Real-Time
            </button>
            <button
              onClick={() => setActiveTab('spider')}
              className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'spider' ? 'text-cyan-600 dark:text-cyan-400 font-bold border-b-2 border-cyan-600 pb-0.5' : ''
              }`}
            >
              Spider Chart
            </button>
            <button
              onClick={() => setActiveTab('analisis_gap')}
              className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'analisis_gap' ? 'text-cyan-600 dark:text-cyan-400 font-bold border-b-2 border-cyan-600 pb-0.5' : ''
              }`}
            >
              Analisis Gap
            </button>
            <button
              onClick={() => setActiveTab('smart_dispatch')}
              className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'smart_dispatch' ? 'text-cyan-600 dark:text-cyan-400 font-bold border-b-2 border-cyan-600 pb-0.5' : ''
              }`}
            >
              Smart Dispatch
            </button>
            <button
              onClick={() => setActiveTab('gap_analysis')}
              className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'gap_analysis' ? 'text-cyan-600 dark:text-cyan-400 font-bold border-b-2 border-cyan-600 pb-0.5' : ''
              }`}
            >
              Rencana Pengembangan (IDP)
            </button>
          </nav>

          {/* Zone 3: 1 primary action + theme toggle */}
          <div className="flex items-center gap-3 shrink-0">
            {currentUser.roleType === 'manager' && isManagerUnlocked && (
              <>
                <button
                  onClick={() => setIsGasModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors whitespace-nowrap shadow-2xs"
                  title="Salin Code.gs dan Index.html untuk Google Apps Script"
                >
                  <FileCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Kode Apps Script</span>
                </button>

                <button
                  onClick={() => setIsVercelModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-900/20 dark:border-white/20 bg-slate-900 text-white dark:bg-black text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
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
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors"
              title={`Beralih ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => handleOpenReport(engineers.find((e) => e.id === selectedEngineerId) || engineers[0])}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-cyan-600 hover:bg-slate-800 dark:hover:bg-cyan-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              Laporan Pengembangan
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        <div className="md:hidden mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 overflow-x-auto text-xs font-medium text-slate-600 dark:text-slate-400">
          {[
            { id: 'matrix', label: 'Matriks' },
            { id: 'spider', label: 'Spider Chart' },
            { id: 'analisis_gap', label: 'Analisis Gap' },
            { id: 'smart_dispatch', label: 'Smart Dispatch' },
            { id: 'gap_analysis', label: 'IDP' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`whitespace-nowrap shrink-0 pb-1 ${
                activeTab === tab.id
                  ? 'text-cyan-600 dark:text-cyan-400 font-bold border-b-2 border-cyan-600'
                  : ''
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
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Total Insinyur Divisi</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
              {totalEngineers} <span className="text-xs text-slate-400 font-normal">Personil</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Aerospace & Automation Group</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Rata-rata Skor Teknis</span>
              <Activity className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 tabular-nums mt-1.5">
              {divisionAvgScore} <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Status: Kompeten (L3 Mandiri)</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Domain Kompetensi</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums mt-1.5">
              7 <span className="text-xs text-slate-400 font-normal">Kategori Utama</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{SKILL_DEFINITIONS.length} Kriteria Terpantau</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Kepatuhan Standar</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums mt-1.5">
              ISO 9001 <span className="text-xs text-slate-400 font-normal">& AS9100</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Audit Trail Aktif & Terlindungi</div>
          </div>
        </section>

        {/* View 1: Real-Time Competency Matrix */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Matriks Kompetensi Teknik Mesin Real-Time
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Lacak penguasaan teknis personil secara langsung. Klik pada sel kompetensi untuk mengevaluasi skor (Manajer) atau mengajukan verifikasi mandiri (Insinyur).
              </p>
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
                selectedEngineerId={selectedEngineerId}
                onSelectEngineerId={setSelectedEngineerId}
                onOpenReport={handleOpenReport}
              />
            </div>
          </div>
        )}

        {/* View 2: Spider Chart Visualizer */}
        {activeTab === 'spider' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Analisis Visualisasi Spider Chart (Radar Kompetensi)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualisasikan distribusi kekuatan mekanikal (CAD, FEA, CFD, Material, Mekatronika, RAMS, Regulasi). Bandingkan langsung dengan standar peran atau rata-rata divisi.
              </p>
            </div>

            <SpiderOverviewSection
              engineers={engineers}
              skills={SKILL_DEFINITIONS}
              selectedEngineerId={selectedEngineerId}
              onSelectEngineerId={setSelectedEngineerId}
              onOpenReport={handleOpenReport}
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
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Katalog Laporan Otomatis Pengembangan Insinyur (IDP)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap pengembang / insinyur memiliki profil rencana aksi mandiri (30-60-90 hari) dengan rekomendasi mentor sebaya internal dan kurikulum sertifikasi.
                </p>
              </div>

              {currentUser.roleType === 'manager' && (
                <button
                  onClick={handleOpenAddStaff}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Input Staff Baru</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {engineers.map((eng) => {
                const rep = generateAutomatedReport(eng, engineers, SKILL_DEFINITIONS);

                return (
                  <div
                    key={eng.id}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-cyan-500/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        {eng.avatarUrl ? (
                          <img
                            src={eng.avatarUrl}
                            alt={eng.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-700 dark:text-cyan-300 font-bold">
                            {eng.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{eng.name}</h4>
                          <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">{eng.roleTitle}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-slate-400">{eng.department}</span>
                            {eng.certificates && eng.certificates.length > 0 && (
                              <span 
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-medium shrink-0" 
                                title={`${eng.certificates.length} Sertifikat Terverifikasi`}
                              >
                                <Award className="w-2.5 h-2.5" />
                                <span>{eng.certificates.length}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                          <div className="text-slate-400 text-[10px]">Skor Rata2</div>
                          <div className="font-mono font-bold text-cyan-600 tabular-nums">
                            {rep.summary.averageScore}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                          <div className="text-slate-400 text-[10px]">Target</div>
                          <div className="font-mono font-bold text-amber-600 tabular-nums">
                            {rep.summary.targetScore}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                          <div className="text-slate-400 text-[10px]">Kesenjangan</div>
                          <div className="font-mono font-bold text-rose-600 tabular-nums">
                            {rep.summary.gapCount} skills
                          </div>
                        </div>
                      </div>

                      {rep.criticalGaps.length > 0 && (
                        <div className="mt-3 text-xs">
                          <div className="text-slate-500 text-[11px] font-medium mb-1">Fokus Gap Utama:</div>
                          <div className="p-2 rounded bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-slate-700 dark:text-slate-300 text-[11px]">
                            {rep.criticalGaps[0].skillName} (-{rep.criticalGaps[0].deficit} level)
                          </div>
                        </div>
                      )}

                      {eng.certificates && eng.certificates.length > 0 && (
                        <div className="mt-3 text-xs">
                          <div className="text-slate-500 text-[11px] font-medium mb-1 flex items-center gap-1">
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
                                className="w-full text-left px-2 py-1.5 rounded bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/20 flex items-center justify-between gap-2 text-[11px] transition-colors group"
                              >
                                <span className="font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
                                  {cert.name}
                                </span>
                                <span className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {cert.year}
                                  </span>
                                  {(cert.fileUrl || cert.hasFile) && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
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

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {eng.experienceYears} Tahun Pengalaman
                      </span>
                      <button
                        onClick={() => handleOpenReport(eng)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-xs transition-colors shadow-2xs"
                      >
                        Buka Laporan IDP
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-6 bg-white dark:bg-slate-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">MechMatrix</span> · Sistem Matriks Kompetensi Rekayasa Mekanikal & Otomasi
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
        onClose={() => setIsReportOpen(false)}
        report={activeReport}
        engineer={reportTargetEngineer}
      />

      <SkillEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        engineer={selectedCellTarget?.engineer || null}
        skill={selectedCellTarget?.skill || null}
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
        pendingItems={pendingApprovalsList}
        onApprove={handleApproveSelfAssessment}
        onReject={handleRejectSelfAssessment}
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
    </div>
  );
}
