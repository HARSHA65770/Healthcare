import React, { useState } from 'react';
import {
  UserPlus,
  User,
  Phone,
  MapPin,
  Calendar,
  HeartPulse,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Search,
  Activity,
  ArrowRight,
  QrCode,
  Printer,
  Trash2,
  FileBadge2,
  AlertCircle,
  Check,
  Layers,
  HeartHandshake,
  CreditCard,
  LogIn
} from 'lucide-react';
import { PatientProfile } from './RegistrationModal';
import { SUPPORTED_LANGUAGES } from '../services/vernacularVoice';
import { registerPatientApi } from '../services/api';
import { getVillageFallback } from '../services/locationService';

interface RegistrationPageProps {
  activePatient: PatientProfile;
  allPatients: PatientProfile[];
  onSelectPatient: (patient: PatientProfile) => void;
  onRegisterSuccess: (patient: PatientProfile) => void;
  onNavigateToPatientApp: () => void;
  onNavigateToLogin?: (registeredPatient?: PatientProfile) => void;
  isOnline: boolean;
  selectedLang: string;
}

const COMMON_CONDITIONS = [
  'Hypertension (High BP)',
  'Type 2 Diabetes',
  'Asthma / Respiratory',
  'Heart Condition',
  'Chronic Kidney Disease',
  'Thyroid',
  'Anaemia',
  'None / Healthy'
];

const VILLAGE_PRESETS = [
  'Adilabad Rural (Cluster 104)',
  'Asifabad Sector 2 (Komaram Bheem)',
  'Utnoor Tribal Cluster (ITDA)',
  'Nirmal Town Mandal',
  'Bela Border Hamlet'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'];

const GOV_SCHEMES = [
  'Ayushman Bharat (PM-JAY)',
  'Arogyasri State Health Scheme',
  'Tribal Welfare Health Cover',
  'None / Self-Pay'
];

export const RegistrationPage: React.FC<RegistrationPageProps> = ({
  activePatient,
  allPatients,
  onSelectPatient,
  onRegisterSuccess,
  onNavigateToPatientApp,
  onNavigateToLogin,
  isOnline,
  selectedLang
}) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [village, setVillage] = useState('Adilabad Rural (Cluster 104)');
  const [abhaId, setAbhaId] = useState('');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [preferredLang, setPreferredLang] = useState(selectedLang);
  const [govScheme, setGovScheme] = useState('Ayushman Bharat (PM-JAY)');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle Conditions
  const toggleCondition = (cond: string) => {
    if (cond === 'None / Healthy') {
      setSelectedConditions(['None / Healthy']);
      return;
    }
    const filtered = selectedConditions.filter((c) => c !== 'None / Healthy');
    if (filtered.includes(cond)) {
      setSelectedConditions(filtered.filter((c) => c !== cond));
    } else {
      setSelectedConditions([...filtered, cond]);
    }
  };

  // Generate simulated 14-digit ABHA ID
  const handleGenerateAbhaId = () => {
    const p1 = Math.floor(10 + Math.random() * 90);
    const p2 = Math.floor(1000 + Math.random() * 9000);
    const p3 = Math.floor(1000 + Math.random() * 9000);
    const p4 = Math.floor(1000 + Math.random() * 9000);
    setAbhaId(`ABHA-${p1}-${p2}-${p3}-${p4}`);
  };

  const handleResetForm = () => {
    setFullName('');
    setAge('');
    setGender('Female');
    setPhoneNumber('');
    setVillage('Adilabad Rural (Cluster 104)');
    setAbhaId('');
    setBloodGroup('B+');
    setSelectedConditions([]);
    setPreferredLang(selectedLang);
    setGovScheme('Ayushman Bharat (PM-JAY)');
    setEmergencyContact('');
    setEmergencyPhone('');
    setErrorMessage(null);
  };

  // Submit Handler
  const handleSubmit = async (target: 'login' | 'consultation' | 'stay' = 'login') => {
    if (!fullName.trim()) {
      setErrorMessage('Please enter the patient full name.');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter a contact phone number for clinical alerts.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const generatedId = 'pat-' + Math.floor(100000 + Math.random() * 900000);
    const resolvedAbha = abhaId.trim() || `ABHA-91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newProfile: PatientProfile = {
      id: generatedId,
      fullName: fullName.trim(),
      age: age.trim() || '38',
      gender,
      phoneNumber: phoneNumber.trim(),
      village: village.trim(),
      conditions: selectedConditions.length > 0 ? selectedConditions : ['None / Healthy'],
      preferredLang,
      registeredAt: new Date().toISOString(),
      abhaId: resolvedAbha,
      bloodGroup,
      emergencyContact: emergencyContact.trim() || undefined,
      emergencyPhone: emergencyPhone.trim() || undefined,
      govScheme,
      latitude: getVillageFallback(village.trim()).latitude,
      longitude: getVillageFallback(village.trim()).longitude,
      locationName: getVillageFallback(village.trim()).locationName
    };

    try {
      // 1. Sync with backend API
      if (isOnline) {
        try {
          await registerPatientApi({
            full_name: newProfile.fullName,
            phone_number: newProfile.phoneNumber,
            village_code: newProfile.village,
            preferred_lang: newProfile.preferredLang,
            role: 'Patient'
          });
        } catch (apiErr) {
          console.warn('[RegistrationPage] Online sync fallback:', apiErr);
        }
      }

      // 2. Persist locally to localStorage
      const existingRaw = localStorage.getItem('sanjeevani_patients');
      const existing: PatientProfile[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updatedList = [newProfile, ...existing.filter((p) => p.phoneNumber !== newProfile.phoneNumber)];
      localStorage.setItem('sanjeevani_patients', JSON.stringify(updatedList));
      localStorage.setItem('sanjeevani_active_patient', JSON.stringify(newProfile));

      // 3. Notify parent app
      onRegisterSuccess(newProfile);
      setSuccessMessage(`Patient "${newProfile.fullName}" successfully enrolled! Digital Health Card created.`);

      if (target === 'login' && onNavigateToLogin) {
        setTimeout(() => {
          onNavigateToLogin(newProfile);
        }, 500);
      } else if (target === 'consultation') {
        setTimeout(() => {
          onNavigateToPatientApp();
        }, 600);
      } else {
        handleResetForm();
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter patients for directory
  const filteredPatients = allPatients.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.phoneNumber.includes(q) ||
      p.village.toLowerCase().includes(q)
    );
  });

  // Printable card
  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header Banner */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-950 text-teal-600 dark:text-teal-300 border border-teal-800/60 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>National Rural Health Mission &bull; ABHA Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
              Patient Registration &amp; Digital Health ID
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Enroll village residents, generate Ayushman Bharat Virtual Health IDs, record chronic baseline vitals, and synchronize with PHC clinical telemetry.
            </p>
          </div>

          {/* Quick Info & Active Patient Card */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-850 p-3 sm:p-4 rounded-2xl border border-slate-700/70 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {activePatient?.fullName ? activePatient.fullName.charAt(0) : 'P'}
            </div>
            <div className="pr-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400">
                Currently Active Patient
              </span>
              <p className="text-sm font-bold text-slate-100">{activePatient?.fullName}</p>
              <p className="text-xs text-slate-400 truncate max-w-[160px]">{activePatient?.village}</p>
            </div>
            <button
              onClick={onNavigateToPatientApp}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Open Triage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Status Pills */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Enrolled Patients: <strong className="text-slate-200">{allPatients.length}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-teal-500' : 'bg-amber-500'}`} />
            <span>Gateway: <strong className="text-slate-200">{isOnline ? 'Live PHC Cloud Sync' : 'Local Offline IndexedDB'}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <FileBadge2 className="w-3.5 h-3.5 text-teal-500" />
            <span>Standard: <strong className="text-slate-200">Ayushman Bharat Digital Mission (ABDM)</strong></span>
          </div>
          {onNavigateToLogin && (
            <button
              type="button"
              onClick={() => onNavigateToLogin()}
              className="sm:ml-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-teal-600 dark:text-teal-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Already Registered? Log In &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Form on Left, Live Card & Directory on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Comprehensive Registration Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Patient Intake Form</h2>
                  <p className="text-xs text-slate-400">Fill in patient demographics &amp; medical history</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Clear Form
              </button>
            </div>

            {/* Success / Error Messages */}
            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2.5 animate-scale-up">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2.5 animate-scale-up">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit('login');
              }}
              className="space-y-6"
            >
              {/* Section 1: Demographics */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5" />
                  <span>1. Personal &amp; Demographic Profile</span>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Lakshmi Devi"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  />
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="125"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 42"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Contact Phone & Village */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Phone Number (Emergency SMS) *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Village / Ward / Cluster
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        placeholder="e.g. Adilabad Rural"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Village Quick Selector Presets */}
                <div>
                  <span className="text-[11px] text-slate-400 mb-1 block">Quick Village Clusters:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {VILLAGE_PRESETS.map((vp) => (
                      <button
                        key={vp}
                        type="button"
                        onClick={() => setVillage(vp)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          village === vp
                            ? 'bg-teal-600/20 text-teal-600 dark:text-teal-300 border-teal-500 font-semibold'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {vp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Virtual ABHA ID */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      Ayushman Bharat Health ID (ABHA)
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateAbhaId}
                      className="text-[11px] font-semibold text-teal-600 dark:text-teal-300 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Generate ABHA</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={abhaId}
                    onChange={(e) => setAbhaId(e.target.value)}
                    placeholder="e.g. ABHA-91-8421-9923-4102"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Section 2: Clinical Baseline */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>2. Clinical Baseline &amp; Language Preferences</span>
                </div>

                {/* Blood Group & Preferred Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Preferred Voice Language
                    </label>
                    <select
                      value={preferredLang}
                      onChange={(e) => setPreferredLang(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.nativeName} ({lang.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Known Pre-Existing Conditions */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-2">
                    Pre-Existing Health Conditions (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_CONDITIONS.map((cond) => {
                      const isSelected = selectedConditions.includes(cond);
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => toggleCondition(cond)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center space-x-1.5 ${
                            isSelected
                              ? 'bg-teal-600/30 text-teal-600 dark:text-teal-300 border-teal-500 font-bold shadow-sm'
                              : 'bg-slate-950 text-slate-400 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : <span>+</span>}
                          <span>{cond}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Government Health Scheme Coverage */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Government Health Insurance / Scheme
                  </label>
                  <select
                    value={govScheme}
                    onChange={(e) => setGovScheme(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    {GOV_SCHEMES.map((scheme) => (
                      <option key={scheme} value={scheme}>
                        {scheme}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 3: Emergency Contact */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>3. Emergency Kin / Secondary Contact</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Contact Person &amp; Relation
                    </label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. Ramesh Devi (Husband)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Emergency Kin Phone Number
                    </label>
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="e.g. 9440123456"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
                {onNavigateToLogin && (
                  <button
                    type="button"
                    onClick={() => handleSubmit('login')}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isSubmitting ? 'Registering...' : 'Register & Proceed to Login →'}</span>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Record Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('consultation')}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Direct Consultation</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Digital Card Preview & Patient Roster (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Virtual Health Card (Real-Time Interactive Preview) */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-slate-100">Live Health Card Preview</h3>
              </div>
              <button
                onClick={handlePrintCard}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                title="Print or Save Card"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>

            {/* Virtual Card Canvas */}
            <div className="relative rounded-2xl p-5 overflow-hidden text-white shadow-xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 border border-teal-500/40">
              {/* Background watermark hologram */}
              <div className="absolute top-2 right-2 opacity-10 pointer-events-none">
                <HeartPulse className="w-40 h-40" />
              </div>

              {/* Card Header */}
              <div className="flex items-start justify-between relative z-10 mb-4">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] uppercase font-extrabold tracking-widest text-teal-300">
                      National Health Mission
                    </span>
                  </div>
                  <p className="text-xs font-black tracking-tight text-white">
                    Sanjeevani Swasthya Card
                  </p>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-[10px] font-bold text-teal-200">
                  {govScheme.split(' ')[0]}
                </div>
              </div>

              {/* Chip & ABHA ID */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="w-9 h-7 rounded bg-amber-400/80 border border-amber-300/90 flex items-center justify-center shadow-inner">
                  <div className="w-6 h-4 border-t border-b border-amber-700/60" />
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-wider text-teal-300/80">Digital ABHA ID</p>
                  <p className="font-mono text-xs font-bold tracking-wider text-teal-100">
                    {abhaId || 'ABHA-91-8421-9923-4102'}
                  </p>
                </div>
              </div>

              {/* Patient Core Info */}
              <div className="space-y-1 relative z-10 mb-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-white tracking-wide truncate max-w-[200px]">
                    {fullName.trim() || 'Lakshmi Devi'}
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-rose-500/30 border border-rose-400/40 text-[10px] font-bold text-rose-200">
                    {bloodGroup}
                  </span>
                </div>
                <p className="text-[11px] text-teal-100/90 truncate">
                  {village || 'Adilabad Rural (Cluster 104)'}
                </p>
              </div>

              {/* Card Footer: Age, Gender, Conditions */}
              <div className="pt-3 border-t border-teal-500/30 flex items-center justify-between text-[10px] text-teal-200/80 relative z-10">
                <div>
                  <span>Age: </span>
                  <strong className="text-white">{age || '42'}</strong> &bull; <span>Gender: </span>
                  <strong className="text-white">{gender}</strong>
                </div>
                <div className="flex items-center space-x-1">
                  <QrCode className="w-4 h-4 text-teal-300" />
                  <span className="font-mono text-[9px]">SECURE-ID</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Generated cards sync automatically with Primary Health Centre (PHC) doctors and offline field tablets.
            </p>
          </div>

          {/* Registered Patients Directory */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-slate-100">Registered Directory</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {filteredPatients.length} record{filteredPatients.length === 1 ? '' : 's'}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone or village..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* List of Patients */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No matching patients found.
                </div>
              ) : (
                filteredPatients.map((patient) => {
                  const isActive = activePatient?.id === patient.id;
                  return (
                    <div
                      key={patient.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-teal-600/15 border-teal-500/60 shadow-md ring-1 ring-teal-500/30'
                          : 'bg-slate-850 hover:bg-slate-800 border-slate-700/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isActive
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {patient.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-slate-100 truncate">
                              {patient.fullName}
                            </span>
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded-full bg-teal-950 text-teal-600 dark:text-teal-300 border border-teal-700 text-[9px] font-bold">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {patient.age}y &bull; {patient.gender} &bull; {patient.phoneNumber}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{patient.village}</p>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        {!isActive ? (
                          <button
                            onClick={() => onSelectPatient(patient)}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-600/20 hover:bg-teal-600 text-teal-600 dark:text-teal-300 hover:text-white border border-teal-500/40 text-xs font-semibold transition-all cursor-pointer"
                          >
                            Set Active
                          </button>
                        ) : (
                          <button
                            onClick={onNavigateToPatientApp}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold shadow-sm flex items-center space-x-1 cursor-pointer"
                          >
                            <span>Consult</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
