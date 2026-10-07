import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { PatientPwa } from './components/PatientPwa';
import { RegistrationPage } from './components/RegistrationPage';
import { LoginPage } from './components/LoginPage';
import { HospitalServices } from './components/HospitalServices';
import { OfflineSyncBadge } from './components/OfflineSyncBadge';
import { SimulationsModal } from './components/SimulationsModal';
import { RegistrationModal, PatientProfile } from './components/RegistrationModal';
import { ProfileModal } from './components/ProfileModal';
import { connectTelemetryWebSocket } from './services/api';
import { ThemeId, getInitialTheme, applyTheme } from './services/theme';

const DEFAULT_PROFILE: PatientProfile = {
  id: 'pat-884120',
  fullName: 'Lakshmi Devi',
  age: '42',
  gender: 'Female',
  phoneNumber: '9876543210',
  village: 'Adilabad Rural (Cluster 104)',
  conditions: ['Hypertension (High BP)'],
  preferredLang: 'te-IN',
  registeredAt: new Date().toISOString(),
  abhaId: 'ABHA-91-8841-2091-4412',
  bloodGroup: 'B+',
  govScheme: 'Ayushman Bharat (PM-JAY)'
};

export function App() {
  // Authentication & Flow: Starts with Registration page, then goes to Login page!
  const [currentTab, setCurrentTab] = useState<NavTab>('register');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [registrationNotice, setRegistrationNotice] = useState<string | null>(null);
  const [prefilledPhone, setPrefilledPhone] = useState<string>('');

  const [selectedLang, setSelectedLang] = useState<string>('te-IN'); // Telugu default per specs
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsAlerts, setWsAlerts] = useState<any[]>([]);

  // Theme Management
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  // Profile and Registration states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [activePatient, setActivePatient] = useState<PatientProfile>(() => {
    try {
      const stored = localStorage.getItem('sanjeevani_active_patient');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_PROFILE;
  });

  const [allPatients, setAllPatients] = useState<PatientProfile[]>(() => {
    try {
      const stored = localStorage.getItem('sanjeevani_patients');
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.length > 0) return list;
      }
    } catch (e) {}
    return [
      DEFAULT_PROFILE,
      {
        id: 'pat-104928',
        fullName: 'Ramesh Kumar',
        age: '56',
        gender: 'Male',
        phoneNumber: '9440123456',
        village: 'Asifabad Sector 2',
        conditions: ['Type 2 Diabetes'],
        preferredLang: 'hi-IN',
        registeredAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        abhaId: 'ABHA-91-1049-2811-9952',
        bloodGroup: 'O+',
        govScheme: 'Arogyasri State Health Scheme'
      }
    ];
  });

  // Keep preferred language synced with active patient
  useEffect(() => {
    if (activePatient?.preferredLang) {
      setSelectedLang(activePatient.preferredLang);
    }
  }, [activePatient]);

  // Track network connectivity
  useEffect(() => {
    const handleOnline = () => {
      if (!isSimulatedOffline) setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSimulatedOffline]);

  // Connect to live hospital WebSocket feed
  useEffect(() => {
    const disconnectWs = connectTelemetryWebSocket(
      (data) => {
        if (data.event === 'CRITICAL_TRIAGE_ALERT') {
          setWsAlerts((prev) => [data.data, ...prev]);
          // Audio tone for doctor workstation
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz beep
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
          } catch (e) {}
        }
      },
      (connected) => setWsConnected(connected)
    );

    return () => {
      disconnectWs();
    };
  }, []);

  const handleSimulateOfflineDrop = () => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      setIsOnline(!next);
      return next;
    });
  };

  const handleSelectPreset = (preset: any) => {
    setIsAuthenticated(true);
    setCurrentTab('patient');
    window.dispatchEvent(
      new CustomEvent('load-scenario-preset', {
        detail: preset
      })
    );
  };

  const handleRegisterSuccess = (profile: PatientProfile) => {
    setActivePatient(profile);
    setSelectedLang(profile.preferredLang);
    setAllPatients((prev) => [profile, ...prev.filter((p) => p.id !== profile.id)]);
  };

  // Step 1 -> Step 2: From Registration to Login page
  const handleNavigateToLogin = (newPatient?: PatientProfile) => {
    if (newPatient) {
      setPrefilledPhone(newPatient.phoneNumber);
      setRegistrationNotice(
        `Registration complete for ${newPatient.fullName}! Please log in with your mobile number to access your records.`
      );
    }
    setCurrentTab('login');
  };

  // Step 2 -> Step 3: From Login to Authenticated Patient App
  const handleLoginSuccess = (patient: PatientProfile) => {
    setActivePatient(patient);
    setSelectedLang(patient.preferredLang);
    setIsAuthenticated(true);
    setRegistrationNotice(null);
    setCurrentTab('patient');
  };

  // Logout back to starting Registration page
  const handleLogout = () => {
    setIsAuthenticated(false);
    setRegistrationNotice(null);
    setPrefilledPhone('');
    setCurrentTab('register');
  };

  const effectiveOnline = isOnline && !isSimulatedOffline;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'patient' || tab === 'hospital') {
            setIsAuthenticated(true);
          }
          setCurrentTab(tab);
        }}
        selectedLang={selectedLang}
        onLangChange={setSelectedLang}
        isOnline={effectiveOnline}
        onOpenSimulations={() => setIsSimModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenRegistrationModal={() => setIsRegistrationModalOpen(true)}
        activePatient={activePatient}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Offline Buffer & Auto-Sync Notification */}
        <OfflineSyncBadge isOnline={effectiveOnline} />

        {/* 1. Starting Screen: Registration Page */}
        {(currentTab === 'register' || currentTab === 'registration') && (
          <RegistrationPage
            activePatient={activePatient}
            allPatients={allPatients}
            onSelectPatient={(profile) => {
              setActivePatient(profile);
              setSelectedLang(profile.preferredLang);
            }}
            onRegisterSuccess={handleRegisterSuccess}
            onNavigateToPatientApp={() => {
              setIsAuthenticated(true);
              setCurrentTab('patient');
            }}
            onNavigateToLogin={handleNavigateToLogin}
            isOnline={effectiveOnline}
            selectedLang={selectedLang}
          />
        )}

        {/* 2. Then: Login Page */}
        {currentTab === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setCurrentTab('register')}
            allPatients={allPatients}
            isOnline={effectiveOnline}
            prefilledPhone={prefilledPhone}
            registrationNotice={registrationNotice}
          />
        )}

        {/* 3. Patient PWA Portal */}
        {currentTab === 'patient' && (
          <PatientPwa
            selectedLang={selectedLang}
            onLangChange={setSelectedLang}
            isOnline={effectiveOnline}
            activePatient={activePatient}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenRegistration={() => setCurrentTab('registration')}
            onTriageSubmitted={() => {
              // Notification / refresh hooks
            }}
          />
        )}

        {/* 4. Hospital Services */}
        {currentTab === 'hospital' && (
          <HospitalServices
            wsAlerts={wsAlerts}
            isWsConnected={wsConnected}
            activePatient={activePatient}
          />
        )}
      </main>

      {/* Patient Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        activeProfile={activePatient}
        allProfiles={allPatients}
        onSelectProfile={(profile) => {
          setActivePatient(profile);
          setSelectedLang(profile.preferredLang);
          setIsProfileModalOpen(false);
        }}
        onOpenRegister={() => {
          setIsProfileModalOpen(false);
          setCurrentTab('registration');
        }}
      />

      {/* Patient Registration Modal (Quick Modal Fallback) */}
      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        onRegisterSuccess={handleRegisterSuccess}
        currentLang={selectedLang}
      />

      {/* Scenario Presets & Offline Simulator Modal */}
      <SimulationsModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        onSelectPreset={handleSelectPreset}
        onSimulateOfflineDrop={handleSimulateOfflineDrop}
      />

      {/* Footer */}
      <footer className="border-t border-slate-700/80 bg-slate-900/80 px-4 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            AI Healthcare &bull; Vernacular Voice AI, Medical Report Scanner &amp; Clinical Safety Triage
          </span>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>FastAPI Core &bull; Pydantic v2 &bull; Dexie.js &bull; Web Speech &bull; WASM-OCR</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
