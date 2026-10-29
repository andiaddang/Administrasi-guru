import React, { useState, useEffect } from 'react';
import {
  SchoolProfile,
  User,
  ClassRoom,
  Student,
  Schedule,
  AttendanceRecord,
  GradeRecord,
  TeachingJournal,
  AppThemeConfig,
} from './types';
import { StorageService, DEFAULT_THEME_CONFIG } from './services/storageService';
import { Header } from './components/Header';
import { TopMenuBar } from './components/TopMenuBar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ClassManagement } from './components/ClassManagement';
import { StudentManagement } from './components/StudentManagement';
import { ScheduleManagement } from './components/ScheduleManagement';
import { AttendanceManagement } from './components/AttendanceManagement';
import { GradeManagement } from './components/GradeManagement';
import { AIAssistant } from './components/AIAssistant';
import { JournalManagement } from './components/JournalManagement';
import { SchoolSettings } from './components/SchoolSettings';
import { AuthModal } from './components/AuthModal';
import { ShareModal } from './components/ShareModal';
import { ThemeModal } from './components/ThemeModal';
import { EditProfileModal } from './components/EditProfileModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { GoogleWorkspaceView } from './components/GoogleWorkspaceView';

export default function App() {
  // Application Data States (Pure Offline-First Local Storage)
  const [school, setSchool] = useState<SchoolProfile>(() => StorageService.getSchool());
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [classes, setClasses] = useState<ClassRoom[]>(() => StorageService.getClasses());
  const [students, setStudents] = useState<Student[]>(() => StorageService.getStudents());
  const [schedules, setSchedules] = useState<Schedule[]>(() => StorageService.getSchedules());
  const [attendances, setAttendances] = useState<AttendanceRecord[]>(() =>
    StorageService.getAttendances()
  );
  const [grades, setGrades] = useState<GradeRecord[]>(() => StorageService.getGrades());
  const [journals, setJournals] = useState<TeachingJournal[]>(() => StorageService.getJournals());
  const [theme, setTheme] = useState<AppThemeConfig>(() => StorageService.getTheme());

  // UI States
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Apply dark mode & active theme to documentElement whenever theme changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme.mode === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-mode', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-mode', 'light');
      }
      root.setAttribute('data-theme', theme.menuColor || 'navy');
    }
  }, [theme.mode, theme.menuColor]);

  // Check URL query parameters on mount for deep linking (e.g. from shared QR code)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam &&
        [
          'dashboard',
          'classes',
          'students',
          'schedules',
          'attendance',
          'grades',
          'ai-assistant',
          'journals',
          'google-workspace',
          'settings',
        ].includes(tabParam)
      ) {
        setActiveTab(tabParam);
      }
    } catch (e) {
      console.error('Error reading URL params:', e);
    }
  }, []);

  // Sync state changes with StorageService
  useEffect(() => {
    StorageService.saveSchool(school);
  }, [school]);

  useEffect(() => {
    StorageService.saveClasses(classes);
  }, [classes]);

  useEffect(() => {
    StorageService.saveStudents(students);
  }, [students]);

  useEffect(() => {
    StorageService.saveSchedules(schedules);
  }, [schedules]);

  useEffect(() => {
    StorageService.saveAttendances(attendances);
  }, [attendances]);

  useEffect(() => {
    StorageService.saveGrades(grades);
  }, [grades]);

  useEffect(() => {
    StorageService.saveJournals(journals);
  }, [journals]);

  // Local mutation timestamp recorder (pure offline local storage)
  const recordLocalMutation = () => {
    StorageService.touchLocalMutation();
  };

  // RESET TO FACTORY DEFAULTS
  const handleResetToDefaults = () => {
    setIsResetConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    StorageService.resetToDefaults();
    setSchool(StorageService.getSchool());
    setCurrentUser(StorageService.getCurrentUser());
    setClasses(StorageService.getClasses());
    setStudents(StorageService.getStudents());
    setSchedules(StorageService.getSchedules());
    setAttendances(StorageService.getAttendances());
    setGrades(StorageService.getGrades());
    setJournals(StorageService.getJournals());
    setActiveTab('dashboard');
    setIsResetConfirmOpen(false);
  };

  // CLASS HANDLERS (Direct, instantaneous local persistence)
  const handleAddClass = (newClass: Omit<ClassRoom, 'id'>) => {
    recordLocalMutation();
    const created: ClassRoom = {
      ...newClass,
      id: `cls-${Date.now()}`,
    };
    setClasses((prev) => {
      const updated = [...prev, created];
      StorageService.saveClasses(updated);
      return updated;
    });
  };

  const handleUpdateClass = (updated: ClassRoom) => {
    recordLocalMutation();
    setClasses((prev) => {
      const updatedList = prev.map((c) => (c.id === updated.id ? updated : c));
      StorageService.saveClasses(updatedList);
      return updatedList;
    });
  };

  const handleDeleteClass = (id: string) => {
    recordLocalMutation();
    setClasses((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      StorageService.saveClasses(updated);
      return updated;
    });
  };

  const handleDeleteBatchClasses = (ids: string[]) => {
    recordLocalMutation();
    setClasses((prev) => {
      const updated = prev.filter((c) => !ids.includes(c.id));
      StorageService.saveClasses(updated);
      return updated;
    });
  };

  // STUDENT HANDLERS (Direct, instantaneous local persistence)
  const handleAddStudent = (newStudent: Omit<Student, 'id'>) => {
    recordLocalMutation();
    const created: Student = {
      ...newStudent,
      id: `std-${Date.now()}`,
    };
    setStudents((prev) => {
      const updated = [...prev, created];
      StorageService.saveStudents(updated);
      return updated;
    });
  };

  const handleUpdateStudent = (updated: Student) => {
    recordLocalMutation();
    setStudents((prev) => {
      const updatedList = prev.map((s) => (s.id === updated.id ? updated : s));
      StorageService.saveStudents(updatedList);
      return updatedList;
    });
  };

  const handleBatchUpdateStudents = (updatedList: Student[]) => {
    recordLocalMutation();
    setStudents((prev) => {
      const map = new Map(updatedList.map((s) => [s.id, s]));
      const updated = prev.map((s) => map.get(s.id) || s);
      StorageService.saveStudents(updated);
      return updated;
    });
  };

  const handleDeleteStudent = (id: string) => {
    recordLocalMutation();
    setStudents((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      StorageService.saveStudents(updated);
      return updated;
    });
  };

  const handleDeleteBatchStudents = (ids: string[]) => {
    recordLocalMutation();
    setStudents((prev) => {
      const updated = prev.filter((c) => !ids.includes(c.id));
      StorageService.saveStudents(updated);
      return updated;
    });
  };

  const handleBatchImportStudents = (newStudents: Omit<Student, 'id'>[]) => {
    recordLocalMutation();
    const mapped: Student[] = newStudents.map((s, idx) => ({
      ...s,
      id: `std-${Date.now()}-${idx}`,
    }));
    setStudents((prev) => {
      const updated = [...prev, ...mapped];
      StorageService.saveStudents(updated);
      return updated;
    });
  };

  const handleReorderStudents = (reorderedList: Student[]) => {
    recordLocalMutation();
    setStudents(reorderedList);
    StorageService.saveStudents(reorderedList);
  };

  // SCHEDULE HANDLERS (Direct, instantaneous local persistence)
  const handleAddSchedule = (newSchedule: Omit<Schedule, 'id'>) => {
    recordLocalMutation();
    const created: Schedule = {
      ...newSchedule,
      id: `sch-${Date.now()}`,
    };
    setSchedules((prev) => {
      const updated = [...prev, created];
      StorageService.saveSchedules(updated);
      return updated;
    });
  };

  const handleUpdateSchedule = (updated: Schedule) => {
    recordLocalMutation();
    setSchedules((prev) => {
      const updatedList = prev.map((s) => (s.id === updated.id ? updated : s));
      StorageService.saveSchedules(updatedList);
      return updatedList;
    });
  };

  const handleDeleteSchedule = (id: string) => {
    recordLocalMutation();
    setSchedules((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      StorageService.saveSchedules(updated);
      return updated;
    });
  };

  // ATTENDANCE HANDLERS
  const handleSaveAttendances = (records: AttendanceRecord[]) => {
    setAttendances(records);
    StorageService.saveAttendances(records);
  };

  // GRADE HANDLERS
  const handleSaveBatchGrades = (newGrades: GradeRecord[]) => {
    setGrades((prev) => {
      const updated = [...prev];
      newGrades.forEach((ng) => {
        const existingIdx = updated.findIndex(
          (g) =>
            g.id === ng.id ||
            (g.studentId === ng.studentId &&
              g.classId === ng.classId &&
              g.type === ng.type &&
              g.title.trim().toLowerCase() === ng.title.trim().toLowerCase() &&
              g.date === ng.date)
        );
        if (existingIdx >= 0) {
          updated[existingIdx] = { ...updated[existingIdx], ...ng };
        } else {
          updated.push(ng);
        }
      });
      StorageService.saveGrades(updated);
      return updated;
    });
  };

  const handleUpdateSingleGrade = (grade: GradeRecord) => {
    setGrades((prev) => {
      const existingIdx = prev.findIndex(
        (g) =>
          g.id === grade.id ||
          (g.studentId === grade.studentId &&
            g.classId === grade.classId &&
            g.type === grade.type &&
            g.title.trim().toLowerCase() === grade.title.trim().toLowerCase() &&
            g.date === grade.date)
      );
      let updated: GradeRecord[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...grade };
      } else {
        updated = [...prev, grade];
      }
      StorageService.saveGrades(updated);
      return updated;
    });
  };

  const handleDeleteGrade = (id: string) => {
    setGrades((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      StorageService.saveGrades(updated);
      return updated;
    });
  };

  const handleDeleteBatchGrades = (ids: string[]) => {
    setGrades((prev) => {
      const updated = prev.filter((g) => !ids.includes(g.id));
      StorageService.saveGrades(updated);
      return updated;
    });
  };

  // Synchronize entire class grades (removes cleared/empty grades permanently)
  const handleSyncClassGrades = (classId: string, updatedClassGrades: GradeRecord[]) => {
    setGrades((prev) => {
      const otherClassesGrades = prev.filter((g) => g.classId !== classId);
      const updated = [...otherClassesGrades, ...updatedClassGrades];
      StorageService.saveGrades(updated);
      return updated;
    });
  };

  // JOURNAL HANDLERS (Direct, instantaneous local persistence)
  const handleAddJournal = (newJournal: Omit<TeachingJournal, 'id'>) => {
    recordLocalMutation();
    const created: TeachingJournal = {
      ...newJournal,
      id: `jrn-${Date.now()}`,
    };
    setJournals((prev) => {
      const updated = [created, ...prev];
      StorageService.saveJournals(updated);
      return updated;
    });
  };

  const handleUpdateJournal = (updated: TeachingJournal) => {
    recordLocalMutation();
    setJournals((prev) => {
      const updatedList = prev.map((j) => (j.id === updated.id ? updated : j));
      StorageService.saveJournals(updatedList);
      return updatedList;
    });
  };

  const handleDeleteJournal = (id: string) => {
    recordLocalMutation();
    setJournals((prev) => {
      const updated = prev.filter((j) => j.id !== id);
      StorageService.saveJournals(updated);
      return updated;
    });
  };

  // SCHOOL PROFILE HANDLER
  const handleSaveSchool = (profile: SchoolProfile) => {
    setSchool(profile);
    StorageService.saveSchool(profile);
  };

  // AUTH HANDLERS
  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = () => {
    setCurrentUser(null);
    StorageService.saveCurrentUser(null);
    setIsAuthModalOpen(true);
    setIsLogoutConfirmOpen(false);
  };

  // TEACHER PROFILE HANDLER
  const handleSaveProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    StorageService.updateUserProfile(updatedUser);
  };

  // RESTORE FROM GOOGLE DRIVE BACKUP HANDLER
  const handleRestoreFromDriveBackup = (restoredData: any) => {
    if (!restoredData) return;
    if (restoredData.school) {
      setSchool(restoredData.school);
      StorageService.saveSchool(restoredData.school);
    }
    if (Array.isArray(restoredData.classes)) {
      setClasses(restoredData.classes);
      StorageService.saveClasses(restoredData.classes);
    }
    if (Array.isArray(restoredData.students)) {
      setStudents(restoredData.students);
      StorageService.saveStudents(restoredData.students);
    }
    if (Array.isArray(restoredData.schedules)) {
      setSchedules(restoredData.schedules);
      StorageService.saveSchedules(restoredData.schedules);
    }
    if (Array.isArray(restoredData.attendances)) {
      setAttendances(restoredData.attendances);
      StorageService.saveAttendances(restoredData.attendances);
    }
    if (Array.isArray(restoredData.grades)) {
      setGrades(restoredData.grades);
      StorageService.saveGrades(restoredData.grades);
    }
    if (Array.isArray(restoredData.journals)) {
      setJournals(restoredData.journals);
      StorageService.saveJournals(restoredData.journals);
    }
  };

  // THEME HANDLER
  const handleUpdateTheme = (updatedTheme: AppThemeConfig) => {
    setTheme(updatedTheme);
    StorageService.saveTheme(updatedTheme);
    if (typeof document !== 'undefined') {
      if (updatedTheme.mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors">
      {/* Top Application Navigation: Sticky Brand Header & Horizontal Menu Bar */}
      <header className="no-print sticky top-0 z-30 shadow-xs">
        <Header
          school={school}
          currentUser={currentUser}
          theme={theme}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onOpenShare={() => setIsShareModalOpen(true)}
          onOpenTheme={() => setIsThemeModalOpen(true)}
          onToggleThemeMode={() =>
            handleUpdateTheme({
              ...theme,
              mode: theme.mode === 'dark' ? 'light' : 'dark',
            })
          }
          onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
          activeTab={activeTab}
        />
        <TopMenuBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          onResetData={handleResetToDefaults}
        />
      </header>

      {/* Mobile Drawer (Sidebar for mobile screens) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
        school={school}
        theme={theme}
        onResetData={handleResetToDefaults}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenTheme={() => setIsThemeModalOpen(true)}
        onOpenEditProfile={() => setIsEditProfileModalOpen(true)}
      />

      {/* Main Container: Full-width dynamic workspace without left sidebar */}
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto">
        {/* Dynamic Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard
              classes={classes}
              students={students}
              attendances={attendances}
              grades={grades}
              journals={journals}
              schedules={schedules}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'classes' && (
            <ClassManagement
              classes={classes}
              students={students}
              onAddClass={handleAddClass}
              onUpdateClass={handleUpdateClass}
              onDeleteClass={handleDeleteClass}
              onDeleteBatchClasses={handleDeleteBatchClasses}
            />
          )}

          {activeTab === 'students' && (
            <StudentManagement
              students={students}
              classes={classes}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onBatchUpdateStudents={handleBatchUpdateStudents}
              onDeleteStudent={handleDeleteStudent}
              onDeleteBatchStudents={handleDeleteBatchStudents}
              onBatchImportStudents={handleBatchImportStudents}
              onReorderStudents={handleReorderStudents}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'schedules' && (
            <ScheduleManagement
              schedules={schedules}
              classes={classes}
              onAddSchedule={handleAddSchedule}
              onUpdateSchedule={handleUpdateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceManagement
              students={students}
              classes={classes}
              attendances={attendances}
              onSaveAttendances={handleSaveAttendances}
              school={school}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'grades' && (
            <GradeManagement
              students={students}
              classes={classes}
              grades={grades}
              onSaveBatchGrades={handleSaveBatchGrades}
              onSyncClassGrades={handleSyncClassGrades}
              onUpdateSingleGrade={handleUpdateSingleGrade}
              onDeleteGrade={handleDeleteGrade}
              onDeleteBatchGrades={handleDeleteBatchGrades}
              school={school}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'ai-assistant' && (
            <AIAssistant
              classes={classes}
              students={students}
              school={school}
              currentUser={currentUser}
              onApplyGradeToStudent={(studentId, classId, gradeType, score, topicName) => {
                const newGrade: GradeRecord = {
                  id: `grade-${Date.now()}`,
                  studentId,
                  classId,
                  subject: currentUser?.subject || 'Umum',
                  type: gradeType,
                  title: topicName,
                  score,
                  maxScore: 100,
                  date: new Date().toISOString().slice(0, 10),
                  semester: school.semester,
                };
                setGrades((prev) => [...prev, newGrade]);
              }}
            />
          )}

          {activeTab === 'journals' && (
            <JournalManagement
              journals={journals}
              classes={classes}
              onAddJournal={handleAddJournal}
              onUpdateJournal={handleUpdateJournal}
              onDeleteJournal={handleDeleteJournal}
              school={school}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'google-workspace' && (
            <GoogleWorkspaceView
              school={school}
              currentUser={currentUser}
              classes={classes}
              students={students}
              attendances={attendances}
              grades={grades}
              journals={journals}
              schedules={schedules}
              onImportStudents={handleBatchImportStudents}
              onRestoreAllData={handleRestoreFromDriveBackup}
            />
          )}

          {activeTab === 'settings' && (
            <SchoolSettings
              school={school}
              onSaveSchool={handleSaveSchool}
              currentUser={currentUser}
              onSaveProfile={handleSaveProfile}
            />
          )}
        </main>
      </div>

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
        school={school}
      />

      {/* Share Modal (Link & Barcode QR Code) */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        school={school}
        currentUser={currentUser}
      />

      {/* Theme Modal (Light/Dark & Menu Bar Color Customization) */}
      <ThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        theme={theme}
        onUpdateTheme={handleUpdateTheme}
      />

      {/* Edit Profile Modal (Teacher Name & NIP) */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        currentUser={currentUser}
        onSaveProfile={handleSaveProfile}
      />

      {/* Reset Data Confirmation Modal (Strictly in-app, no window.confirm) */}
      <ConfirmDeleteModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Data ke Pengaturan Awal"
        message="Apakah Anda yakin ingin mengatur ulang data ke data awal SMA Negeri 1 Gowa? Seluruh perubahan lokal Anda akan dikembalikan ke data percontohan bawaan."
        confirmLabel="Ya, Atur Ulang Data"
        cancelLabel="Batal"
      />

      {/* Logout Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Keluar Sesi Akun Guru"
        message="Keluar dari sesi akun guru aktif saat ini? Anda dapat masuk kembali kapan saja."
        confirmLabel="Ya, Keluar Akun"
        cancelLabel="Batal"
      />
    </div>
  );
}
