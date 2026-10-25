import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  SchoolProfile,
  ClassRoom,
  Student,
  Schedule,
  AttendanceRecord,
  GradeRecord,
  TeachingJournal,
  User,
} from '../types';

export const FirestoreSyncService = {
  // Save or update user profile
  async saveUserProfile(user: User): Promise<void> {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}`;
    try {
      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        {
          id: auth.currentUser.uid,
          name: user.name,
          email: user.email,
          nip: user.nip || '-',
          subject: user.subject || 'Guru Pengampu',
          role: user.role || 'Guru Pengampu',
          avatar: user.avatar || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Save school profile
  async saveSchoolProfile(school: SchoolProfile): Promise<void> {
    if (!auth.currentUser) return;
    const path = 'schools/default';
    try {
      await setDoc(doc(db, 'schools', 'default'), {
        ...school,
        updatedBy: auth.currentUser.uid,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Load user data from Firestore
  async loadUserData(userId: string) {
    if (!auth.currentUser) return null;

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      const [classesSnap, studentsSnap, schedulesSnap, attendancesSnap, gradesSnap, journalsSnap] =
        await Promise.all([
          getDocs(collection(db, 'users', userId, 'classes')),
          getDocs(collection(db, 'users', userId, 'students')),
          getDocs(collection(db, 'users', userId, 'schedules')),
          getDocs(collection(db, 'users', userId, 'attendances')),
          getDocs(collection(db, 'users', userId, 'grades')),
          getDocs(collection(db, 'users', userId, 'journals')),
        ]);

      return {
        userProfile: userSnap.exists() ? (userSnap.data() as User) : null,
        classes: classesSnap.docs.map((d) => d.data() as ClassRoom),
        students: studentsSnap.docs.map((d) => d.data() as Student),
        schedules: schedulesSnap.docs.map((d) => d.data() as Schedule),
        attendances: attendancesSnap.docs.map((d) => d.data() as AttendanceRecord),
        grades: gradesSnap.docs.map((d) => d.data() as GradeRecord),
        journals: journalsSnap.docs.map((d) => d.data() as TeachingJournal),
      };
    } catch (error) {
      console.warn('Error loading Firestore user data, using local fallback:', error);
      return null;
    }
  },

  // Sync entire state to Firestore in batches
  async syncAllToCloud(data: {
    classes: ClassRoom[];
    students: Student[];
    schedules: Schedule[];
    attendances: AttendanceRecord[];
    grades: GradeRecord[];
    journals: TeachingJournal[];
    school: SchoolProfile;
  }): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    const userId = user.uid;
    const batch = writeBatch(db);

    try {
      // Classes
      for (const cls of data.classes) {
        const ref = doc(db, 'users', userId, 'classes', cls.id);
        batch.set(ref, { ...cls, userId });
      }

      // Students
      for (const st of data.students) {
        const ref = doc(db, 'users', userId, 'students', st.id);
        batch.set(ref, { ...st, userId });
      }

      // Schedules
      for (const sc of data.schedules) {
        const ref = doc(db, 'users', userId, 'schedules', sc.id);
        batch.set(ref, { ...sc, userId });
      }

      // Journals
      for (const jn of data.journals) {
        const ref = doc(db, 'users', userId, 'journals', jn.id);
        batch.set(ref, { ...jn, userId });
      }

      // Grades (up to batch limit 500)
      for (const gr of data.grades.slice(0, 150)) {
        const ref = doc(db, 'users', userId, 'grades', gr.id);
        batch.set(ref, { ...gr, userId });
      }

      // Attendances
      for (const att of data.attendances.slice(0, 150)) {
        const ref = doc(db, 'users', userId, 'attendances', att.id);
        batch.set(ref, { ...att, userId });
      }

      // School Profile
      const schoolRef = doc(db, 'schools', 'default');
      batch.set(schoolRef, { ...data.school, updatedBy: userId }, { merge: true });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Batch sync to Firestore failed:', error);
      return false;
    }
  },

  // Save single grade
  async saveGrade(grade: GradeRecord): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    const path = `users/${user.uid}/grades/${grade.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'grades', grade.id), {
        ...grade,
        userId: user.uid,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Save single attendance
  async saveAttendance(att: AttendanceRecord): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    const path = `users/${user.uid}/attendances/${att.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'attendances', att.id), {
        ...att,
        userId: user.uid,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Save single journal
  async saveJournal(journal: TeachingJournal): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    const path = `users/${user.uid}/journals/${journal.id}`;
    try {
      await setDoc(doc(db, 'users', user.uid, 'journals', journal.id), {
        ...journal,
        userId: user.uid,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
};
