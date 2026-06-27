import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  Activity,
  Users,
  Calendar,
  Send,
  Sliders,
  Sun,
  Moon,
  LogOut,
  Stethoscope,
  Clock,
  UserCheck,
  LayoutDashboard,
  Bell,
  RefreshCw
} from 'lucide-react';

import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Patient, Appointment, Visit, Vaccination, Milestone, Settings, Broadcast } from './types';
import { DEFAULT_TEMPLATES } from './data';
import { generatePatientId } from './utils';

// Import modular components
import DashboardStats from './components/DashboardStats';
import SmartSearch from './components/SmartSearch';
import ChronologicalEMR from './components/ChronologicalEMR';
import BroadcastCenter from './components/BroadcastCenter';
import AppointmentsList from './components/AppointmentsList';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Auth States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'Doctor' | 'Staff'>(() => {
    const saved = localStorage.getItem('userRole');
    if (saved === 'Doctor' || saved === 'Staff') return saved;
    return 'Doctor';
  }); // Role selection toggle
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Core Sync Lists (Global Patients & Appointments)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [settings, setSettings] = useState<Settings>({
    id: 'clinic-settings',
    smsWebhook: DEFAULT_TEMPLATES.smsWebhook,
    appointmentTemplate: DEFAULT_TEMPLATES.appointmentTemplate,
    vaccineDueTemplate: DEFAULT_TEMPLATES.vaccineDueTemplate,
    diwaliTemplate: DEFAULT_TEMPLATES.diwaliTemplate,
    eidTemplate: DEFAULT_TEMPLATES.eidTemplate,
    newYearTemplate: DEFAULT_TEMPLATES.newYearTemplate,
    updatedAt: new Date().toISOString(),
    updaterId: 'default'
  });

  // Selected Patient subcollection states (reactive EMR charts)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientVisits, setSelectedPatientVisits] = useState<Visit[]>([]);
  const [selectedPatientVaccinations, setSelectedPatientVaccinations] = useState<Vaccination[]>([]);
  const [selectedPatientMilestones, setSelectedPatientMilestones] = useState<Milestone[]>([]);

  // Navigation state
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'patients' | 'appointments' | 'broadcast'>('dashboard');

  // Save role updates
  useEffect(() => {
    localStorage.setItem('userRole', userRole);
  }, [userRole]);

  // Theme Sync effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Firebase Auth Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      
      // Auto assign role based on email if matched and not already saved
      if (user?.email === 'rensipatidar07@gmail.com' && !localStorage.getItem('userRole')) {
        setUserRole('Doctor');
      }
    });
    return unsubscribe;
  }, []);

  // Global Collection Listeners (Only active when logged in)
  useEffect(() => {
    if (!currentUser) {
      setPatients([]);
      setAppointments([]);
      setBroadcasts([]);
      return;
    }

    // 1. Listen to Patients
    const qPatients = collection(db, 'patients');
    const unsubPatients = onSnapshot(
      qPatients,
      (snapshot) => {
        const list: Patient[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Patient);
        });
        setPatients(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'patients');
      }
    );

    // 2. Listen to Appointments
    const qAppointments = collection(db, 'appointments');
    const unsubAppointments = onSnapshot(
      qAppointments,
      (snapshot) => {
        const list: Appointment[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Appointment);
        });
        setAppointments(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'appointments');
      }
    );

    // 3. Listen to Broadcast Campaigns
    const qBroadcasts = collection(db, 'broadcasts');
    const unsubBroadcasts = onSnapshot(
      qBroadcasts,
      (snapshot) => {
        const list: Broadcast[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Broadcast);
        });
        setBroadcasts(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'broadcasts');
      }
    );

    // 4. Listen to Clinic Settings
    const settingsDocRef = doc(db, 'settings', 'clinic-settings');
    const unsubSettings = onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings(snapshot.data() as Settings);
        } else {
          // Initialize settings document with defaults
          setDoc(settingsDocRef, {
            id: 'clinic-settings',
            smsWebhook: DEFAULT_TEMPLATES.smsWebhook,
            appointmentTemplate: DEFAULT_TEMPLATES.appointmentTemplate,
            vaccineDueTemplate: DEFAULT_TEMPLATES.vaccineDueTemplate,
            diwaliTemplate: DEFAULT_TEMPLATES.diwaliTemplate,
            eidTemplate: DEFAULT_TEMPLATES.eidTemplate,
            newYearTemplate: DEFAULT_TEMPLATES.newYearTemplate,
            updatedAt: new Date().toISOString(),
            updaterId: currentUser.uid
          }).catch(err => {
            console.error("Settings initialization failed", err);
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/clinic-settings');
      }
    );

    return () => {
      unsubPatients();
      unsubAppointments();
      unsubBroadcasts();
      unsubSettings();
    };
  }, [currentUser]);

  // Selected Patient Subcollections Listener (Reactive Chart Loader)
  useEffect(() => {
    if (!currentUser || !selectedPatientId) {
      setSelectedPatientVisits([]);
      setSelectedPatientVaccinations([]);
      setSelectedPatientMilestones([]);
      return;
    }

    // 1. Listen to selected patient's Visits
    const qVisits = collection(db, `patients/${selectedPatientId}/visits`);
    const unsubVisits = onSnapshot(
      qVisits,
      (snapshot) => {
        const list: Visit[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Visit);
        });
        setSelectedPatientVisits(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `patients/${selectedPatientId}/visits`);
      }
    );

    // 2. Listen to selected patient's Vaccinations Status
    const qVaccines = collection(db, `patients/${selectedPatientId}/vaccinations`);
    const unsubVaccines = onSnapshot(
      qVaccines,
      (snapshot) => {
        const list: Vaccination[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Vaccination);
        });
        setSelectedPatientVaccinations(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `patients/${selectedPatientId}/vaccinations`);
      }
    );

    // 3. Listen to selected patient's Milestones Checklist
    const qMilestones = collection(db, `patients/${selectedPatientId}/milestones`);
    const unsubMilestones = onSnapshot(
      qMilestones,
      (snapshot) => {
        const list: Milestone[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as Milestone);
        });
        setSelectedPatientMilestones(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `patients/${selectedPatientId}/milestones`);
      }
    );

    return () => {
      unsubVisits();
      unsubVaccines();
      unsubMilestones();
    };
  }, [currentUser, selectedPatientId]);

  // Auth login popup handler
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      alert("Sign-In failed. Please verify that the pop-up block permissions are allow-listed.");
    }
  };

  // Auth logout handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSelectedPatientId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Master patient register handler
  const handleRegisterPatient = async (patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'creatorId'>): Promise<string> => {
    if (!currentUser) throw new Error("Unauthenticated user session.");
    
    // Auto-compute next sequential Patient ID based on list count
    const uniqueId = generatePatientId(patients.length);
    const docRef = doc(db, 'patients', uniqueId);
    
    const timestamp = new Date().toISOString();
    const finalProfile: Patient = {
      ...patientData,
      id: uniqueId,
      createdAt: timestamp,
      updatedAt: timestamp,
      creatorId: currentUser.uid
    };

    try {
      await setDoc(docRef, finalProfile);
      return uniqueId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `patients/${uniqueId}`);
      throw err;
    }
  };

  // Clinic Schedule booking handler
  const handleScheduleAppointment = async (appData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'creatorId'>) => {
    if (!currentUser) return;
    
    const uniqueAppId = `app-${Date.now()}`;
    const docRef = doc(db, 'appointments', uniqueAppId);
    const timestamp = new Date().toISOString();

    const appointmentObj: Appointment = {
      ...appData,
      id: uniqueAppId,
      createdAt: timestamp,
      updatedAt: timestamp,
      creatorId: currentUser.uid
    };

    try {
      await setDoc(docRef, appointmentObj);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `appointments/${uniqueAppId}`);
    }
  };

  // Appointment Status modifiers
  const handleCheckIn = async (appId: string) => {
    const docRef = doc(db, 'appointments', appId);
    try {
      await updateDoc(docRef, {
        status: 'checked-in',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${appId}`);
    }
  };

  const handleCancelAppointment = async (appId: string) => {
    const docRef = doc(db, 'appointments', appId);
    try {
      await updateDoc(docRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${appId}`);
    }
  };

  const handleCompleteAppointment = async (appId: string) => {
    const docRef = doc(db, 'appointments', appId);
    try {
      await updateDoc(docRef, {
        status: 'completed',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${appId}`);
    }
  };

  // EMR Visit creation handler
  const handleAddVisit = async (visitData: Omit<Visit, 'id' | 'patientId' | 'createdAt' | 'updatedAt' | 'creatorId'>) => {
    if (!currentUser || !selectedPatientId) return;

    const uniqueVisitId = `visit-${Date.now()}`;
    const docRef = doc(db, `patients/${selectedPatientId}/visits`, uniqueVisitId);
    const timestamp = new Date().toISOString();

    const visitObj: Visit = {
      ...visitData,
      id: uniqueVisitId,
      patientId: selectedPatientId,
      createdAt: timestamp,
      updatedAt: timestamp,
      creatorId: currentUser.uid
    };

    try {
      await setDoc(docRef, visitObj);

      // Simultaneously, if there was a checked-in appointment for this patient today, auto-complete it!
      const todayStr = new Date().toISOString().split('T')[0];
      const activeApp = appointments.find(app => 
        app.patientId === selectedPatientId && 
        app.date.startsWith(todayStr) && 
        app.status === 'checked-in'
      );
      if (activeApp) {
        await handleCompleteAppointment(activeApp.id);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `patients/${selectedPatientId}/visits/${uniqueVisitId}`);
    }
  };

  // Vaccine Tracker Status Updater
  const handleUpdateVaccineStatus = async (vaccineId: string, status: Vaccination['status'], givenDate?: string) => {
    if (!currentUser || !selectedPatientId) return;
    const docRef = doc(db, `patients/${selectedPatientId}/vaccinations`, vaccineId);

    // Find if vaccine is already logged to retain details
    const existingVac = selectedPatientVaccinations.find(v => v.id === vaccineId);
    const vaccineName = existingVac ? existingVac.vaccineName : vaccineId.replace('vac-', '').replace(/-/g, ' ');

    const payload: Vaccination = {
      id: vaccineId,
      patientId: selectedPatientId,
      vaccineName,
      dueDate: existingVac ? existingVac.dueDate : new Date().toISOString().split('T')[0],
      status,
      givenDate: givenDate || existingVac?.givenDate,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(docRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `patients/${selectedPatientId}/vaccinations/${vaccineId}`);
    }
  };

  // Milestone Tracker Status Updater
  const handleUpdateMilestoneStatus = async (milestoneId: string, status: Milestone['status'], achievedDate?: string) => {
    if (!currentUser || !selectedPatientId) return;
    const docRef = doc(db, `patients/${selectedPatientId}/milestones`, milestoneId);

    const existingMil = selectedPatientMilestones.find(m => m.id === milestoneId);
    const milestoneName = existingMil ? existingMil.milestoneName : milestoneId.replace('mil-', '').replace(/-/g, ' ');

    const payload: Milestone = {
      id: milestoneId,
      patientId: selectedPatientId,
      milestoneName,
      ageCategory: existingMil ? existingMil.ageCategory : 'General',
      status,
      achievedDate: achievedDate || existingMil?.achievedDate,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(docRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `patients/${selectedPatientId}/milestones/${milestoneId}`);
    }
  };

  // Custom Notice send / Campaign dispatch
  const handleSendCampaign = async (campaignData: Omit<Broadcast, 'id' | 'createdAt' | 'senderId'>) => {
    if (!currentUser) return;
    const uniqueBcId = `campaign-${Date.now()}`;
    const docRef = doc(db, 'broadcasts', uniqueBcId);

    const campaign: Broadcast = {
      ...campaignData,
      id: uniqueBcId,
      createdAt: new Date().toISOString(),
      senderId: currentUser.uid
    };

    try {
      await setDoc(docRef, campaign);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `broadcasts/${uniqueBcId}`);
    }
  };

  // Settings modification
  const handleSaveCampaignSettings = async (settingsData: Partial<Settings>) => {
    if (!currentUser) return;
    const docRef = doc(db, 'settings', 'clinic-settings');

    const payload: Settings = {
      ...settings,
      ...settingsData,
      updatedAt: new Date().toISOString(),
      updaterId: currentUser.uid
    };

    try {
      await setDoc(docRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/clinic-settings');
    }
  };

  // Helper: Open a patient profile directly in EMR Tab
  const viewPatientProfile = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveMenu('patients');
  };

  // Render Login Splash if unauthenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200">
        <div className="text-center space-y-4">
          <RefreshCw className="h-10 w-10 animate-spin mx-auto text-teal-600" />
          <p className="font-semibold text-sm">Synchronizing Cloud Services...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 ${darkMode ? 'dark' : ''}`}>
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6">
          <div className="p-4 bg-teal-50 dark:bg-teal-950/40 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto text-teal-600 dark:text-teal-400">
            <Stethoscope className="h-12 w-12" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">Pediatric Clinic Portal</h1>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Secure, cloud-synchronized EMR workspace designed for 1 Doctor & Front-Desk Staff. Access clinical records from any laptop securely.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center space-x-3 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow transition-all duration-150 transform active:scale-95"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.5 1.8l2.4-2.4C17.3 1.8 14.9 1 12.24 1c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.8 0 9.7-4.1 9.7-9.9 0-.6-.1-1.2-.2-1.8H12.24z" />
              </svg>
              <span>Login with Google Secure SSO</span>
            </button>
            <p className="text-[10px] text-slate-400 leading-snug">
              Authorized access only. Logins are fully encrypted & verified against the verified clinic directory.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Selected Patient object
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-700 dark:text-slate-200 ${darkMode ? 'dark' : ''}`}>
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 text-slate-300">
        <div>
          {/* Clinic Brand branding */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">P</div>
              <div>
                <h1 className="font-bold text-white text-sm leading-tight tracking-tight">PediCare <span className="text-teal-400">Pro</span></h1>
                <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">MocDoc-EMR</p>
              </div>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* Connected User Profile summary */}
          <div className="p-4 bg-slate-800/30 border-b border-slate-800 text-xs">
            <div className="flex items-center space-x-2.5">
              <div className="bg-teal-600 text-white font-bold h-7 w-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 uppercase">
                {currentUser.displayName ? currentUser.displayName[0] : (currentUser.email ? currentUser.email[0] : 'U')}
              </div>
              <div className="truncate">
                <span className="font-bold text-white block truncate">{currentUser.displayName || "Clinic User"}</span>
                <span className="text-[10px] text-slate-400 block truncate font-mono">{currentUser.email}</span>
              </div>
            </div>

            {/* Quick Role Selection Switch */}
            <div className="mt-3 bg-slate-950 p-1 rounded-lg flex">
              <button
                onClick={() => setUserRole('Doctor')}
                className={`flex-1 text-center py-1 rounded font-bold transition-all text-[10px] ${
                  userRole === 'Doctor'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Doctor View
              </button>
              <button
                onClick={() => setUserRole('Staff')}
                className={`flex-1 text-center py-1 rounded font-bold transition-all text-[10px] ${
                  userRole === 'Staff'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Staff View
              </button>
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => {
                setActiveMenu('dashboard');
                setSelectedPatientId(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeMenu === 'dashboard' && !selectedPatientId
                  ? 'bg-teal-600 text-white font-black shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Clinic Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveMenu('patients');
                setSelectedPatientId(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeMenu === 'patients' && !selectedPatientId
                  ? 'bg-teal-600 text-white font-black shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Patients Directory</span>
            </button>

            <button
              onClick={() => {
                setActiveMenu('broadcast');
                setSelectedPatientId(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeMenu === 'broadcast'
                  ? 'bg-teal-600 text-white font-black shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Send className="h-4 w-4" />
              <span>Communication Hub</span>
            </button>
          </nav>
        </div>

        {/* Bottom sign-out button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-3 rounded-lg text-xs transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

        {/* Context Header */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {selectedPatientId && activeMenu === 'patients' ? "EMR Patient Encounter File" :
               activeMenu === 'dashboard' ? "Clinic Dashboard Overview" :
               activeMenu === 'patients' ? "Patient Registry & Smart Duplicate Check" :
               "Campaigns & Notification Broadcast Center"}
            </h1>
            <p className="text-xs text-slate-500">
              {selectedPatientId && activeMenu === 'patients' ? "Comprehensive pediatric clinical timeline, developmental tracking, and vaccination log" :
               activeMenu === 'dashboard' ? "Real-time statistics, shortcuts, and clinical indications" :
               activeMenu === 'patients' ? "Smart search algorithms with cross-matching name validation" :
               "Automated parent SMS reminders and customizable festival greetings copys"}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
              userRole === 'Doctor' 
                ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/60' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60'
            }`}>
              {userRole === 'Doctor' ? '⚕️ Doctor Mode' : '📋 Staff Mode'}
            </span>

            <div className="flex items-center space-x-1.5">
              {/* Status light */}
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Live Sync</span>
            </div>
          </div>
        </header>

        {/* COMPONENT VIEWS */}
        
        {/* VIEW A: SELECTED PATIENT EMR (Overrides directory list if selected) */}
        {selectedPatientId && selectedPatient && activeMenu === 'patients' ? (
          <ChronologicalEMR
            patient={selectedPatient}
            visits={selectedPatientVisits}
            vaccinations={selectedPatientVaccinations}
            milestones={selectedPatientMilestones}
            onAddVisit={handleAddVisit}
            onUpdateVaccineStatus={handleUpdateVaccineStatus}
            onUpdateMilestoneStatus={handleUpdateMilestoneStatus}
            onBack={() => setSelectedPatientId(null)}
            userRole={userRole}
          />
        ) : (
          <>
            {/* VIEW B: CLINIC DASHBOARD */}
            {activeMenu === 'dashboard' && (
              <DashboardStats
                patients={patients}
                userRole={userRole}
                setActiveMenu={setActiveMenu}
                currentUser={currentUser}
              />
            )}

            {/* VIEW C: PATIENT SMART SEARCH */}
            {activeMenu === 'patients' && (
              <SmartSearch
                patients={patients}
                onRegisterPatient={handleRegisterPatient}
                onSelectPatient={setSelectedPatientId}
              />
            )}

            {/* VIEW D: APPOINTMENTS LIST */}
            {activeMenu === 'appointments' && (
              <AppointmentsList
                patients={patients}
                appointments={appointments}
                onScheduleAppointment={handleScheduleAppointment}
                onCheckIn={handleCheckIn}
                onCancel={handleCancelAppointment}
                onComplete={handleCompleteAppointment}
              />
            )}

            {/* VIEW E: COMMUNICATION BROADCASTS */}
            {activeMenu === 'broadcast' && (
              <BroadcastCenter
                patients={patients}
                settings={settings}
                broadcasts={broadcasts}
                onSaveSettings={handleSaveCampaignSettings}
                onSendBroadcast={handleSendCampaign}
              />
            )}
          </>
        )}

      </main>
    </div>
  );
}
