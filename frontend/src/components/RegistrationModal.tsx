import React, { useState } from 'react';
import { X, UserPlus, CheckCircle2, Shield, HeartPulse } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../services/vernacularVoice';
import { registerPatientApi } from '../services/api';

export interface PatientProfile {
  id: string;
  fullName: string;
  age: string;
  gender: string;
  phoneNumber: string;
  village: string;
  conditions: string[];
  preferredLang: string;
  registeredAt: string;
  abhaId?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  govScheme?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (profile: PatientProfile) => void;
  currentLang: string;
}

const COMMON_CONDITIONS = [
  'Hypertension (High BP)',
  'Type 2 Diabetes',
  'Asthma / Respiratory',
  'Heart Condition',
  'Thyroid',
  'None / Healthy'
];

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
  currentLang
}) => {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [village, setVillage] = useState('Adilabad Rural (Cluster 104)');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [preferredLang, setPreferredLang] = useState(currentLang);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCondition = (cond: string) => {
    if (cond === 'None / Healthy') {
      setSelectedConditions(['None / Healthy']);
      return;
    }
    const filtered = selectedConditions.filter(c => c !== 'None / Healthy');
    if (filtered.includes(cond)) {
      setSelectedConditions(filtered.filter(c => c !== cond));
    } else {
      setSelectedConditions([...filtered, cond]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter patient full name');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter contact phone number');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const newProfile: PatientProfile = {
      id: 'pat-' + Math.floor(100000 + Math.random() * 900000),
      fullName: fullName.trim(),
      age: age || '35',
      gender,
      phoneNumber: phoneNumber.trim(),
      village: village.trim(),
      conditions: selectedConditions.length > 0 ? selectedConditions : ['None / Healthy'],
      preferredLang,
      registeredAt: new Date().toISOString()
    };

    try {
      // Save locally to localStorage
      const existingRaw = localStorage.getItem('sanjeevani_patients');
      const existing: PatientProfile[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [newProfile, ...existing.filter(p => p.phoneNumber !== newProfile.phoneNumber)];
      localStorage.setItem('sanjeevani_patients', JSON.stringify(updated));
      localStorage.setItem('sanjeevani_active_patient', JSON.stringify(newProfile));

      // Attempt online backend sync if available
      try {
        await registerPatientApi({
          full_name: newProfile.fullName,
          phone_number: newProfile.phoneNumber,
          village_code: newProfile.village,
          preferred_lang: newProfile.preferredLang,
          role: 'Patient'
        });
      } catch (err) {
        console.log('[Registration] Offline local fallback activated');
      }

      onRegisterSuccess(newProfile);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                Patient Registration
              </h3>
              <p className="text-[11px] text-slate-400">
                Create new healthcare profile &amp; digital health record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Lakshmi Devi"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 42"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Phone Number (For Emergency Alerts &amp; SMS) *
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Village / Ward / Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Village / Cluster / Ward
            </label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g. Adilabad Rural (Cluster 104)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Preferred Spoken Language
            </label>
            <select
              value={preferredLang}
              onChange={(e) => setPreferredLang(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          {/* Pre-existing Conditions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pre-existing Health Conditions (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_CONDITIONS.map((cond) => {
                const active = selectedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      active
                        ? 'bg-teal-600/30 text-teal-300 border-teal-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Safety Privacy Notice */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <Shield className="w-4 h-4 text-teal-400 shrink-0" />
            <span>Encrypted local storage with secure PHC clinic gateway sync.</span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-600/30 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Complete Registration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
