import React, { useState, useEffect } from 'react';
import {
  LogIn,
  Phone,
  ShieldCheck,
  HeartPulse,
  KeyRound,
  UserCheck,
  UserPlus,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Building2,
  Smartphone,
  MapPin
} from 'lucide-react';
import { PatientProfile } from './RegistrationModal';
import { loginUserApi } from '../services/api';
import { detectCurrentLocation } from '../services/locationService';

interface LoginPageProps {
  onLoginSuccess: (patient: PatientProfile) => void;
  onNavigateToRegister: () => void;
  allPatients: PatientProfile[];
  isOnline: boolean;
  prefilledPhone?: string;
  registrationNotice?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  allPatients,
  isOnline,
  prefilledPhone = '',
  registrationNotice = null
}) => {
  const [loginMethod, setLoginMethod] = useState<'phone' | 'abha'>('phone');
  const [phoneNumber, setPhoneNumber] = useState(prefilledPhone);
  const [abhaId, setAbhaId] = useState('');
  const [otpCode, setOtpCode] = useState('8841');
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledPhone) {
      setPhoneNumber(prefilledPhone);
    }
  }, [prefilledPhone]);

  const handleSendOtp = () => {
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter your 10-digit registered phone number.');
      return;
    }
    setErrorMessage(null);
    setOtpSent(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      let matchedPatient: PatientProfile | undefined;

      if (loginMethod === 'phone') {
        const cleanPhone = phoneNumber.trim();
        if (!cleanPhone) {
          throw new Error('Please enter your mobile phone number.');
        }

        // Try finding registered patient in local roster
        matchedPatient = allPatients.find(
          (p) => p.phoneNumber.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
        );

        // Detect user location
        const detectedLoc = await detectCurrentLocation(matchedPatient?.village);

        // Call backend auth login if online
        if (isOnline) {
          try {
            await loginUserApi(cleanPhone, otpCode, {
              lat: detectedLoc.latitude,
              lng: detectedLoc.longitude,
              locationName: detectedLoc.locationName
            });
          } catch (apiErr) {
            console.warn('[LoginPage] Backend login fallback to local profile:', apiErr);
          }
        }
      } else {
        const cleanAbha = abhaId.trim().toLowerCase();
        if (!cleanAbha) {
          throw new Error('Please enter your Ayushman Bharat ABHA Health ID.');
        }
        matchedPatient = allPatients.find(
          (p) => p.abhaId?.toLowerCase() === cleanAbha
        );
      }

      // If patient not in local list, create on-the-fly valid profile
      if (!matchedPatient) {
        matchedPatient = {
          id: 'pat-' + Math.floor(100000 + Math.random() * 900000),
          fullName: loginMethod === 'phone' ? `Patient (${phoneNumber})` : 'Registered Patient',
          age: '40',
          gender: 'Female',
          phoneNumber: phoneNumber || '9876543210',
          village: 'Adilabad Rural (Cluster 104)',
          conditions: ['None / Healthy'],
          preferredLang: 'te-IN',
          registeredAt: new Date().toISOString(),
          abhaId: abhaId || `ABHA-91-${Math.floor(1000 + Math.random() * 9000)}-4412-9901`
        };
      }

      // Ensure location coordinates are recorded on patient profile
      const userLoc = await detectCurrentLocation(matchedPatient.village);
      matchedPatient.latitude = userLoc.latitude;
      matchedPatient.longitude = userLoc.longitude;
      matchedPatient.locationName = userLoc.locationName;

      onLoginSuccess(matchedPatient);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-click preset login with location detection
  const handleQuickLogin = async (patient: PatientProfile) => {
    const loc = await detectCurrentLocation(patient.village);
    onLoginSuccess({
      ...patient,
      latitude: loc.latitude,
      longitude: loc.longitude,
      locationName: loc.locationName
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in py-4">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-500 shadow-xl shadow-teal-500/20 ring-4 ring-teal-400/20 mb-2">
          <HeartPulse className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
          Patient &amp; Clinic Portal Login
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Access your digital health card, vernacular voice triage consultations, and hospital appointment records.
        </p>
      </div>

      {/* Registration notice banner if redirected from registration */}
      {registrationNotice && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-600 text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-3 shadow-md animate-scale-up">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-bold">Registration Successful!</p>
            <p className="text-[11px] opacity-90">{registrationNotice}</p>
          </div>
        </div>
      )}

      {/* Main Login Card */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Method Switcher: Phone OTP vs ABHA ID */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              loginMethod === 'phone'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile OTP Login</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('abha')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              loginMethod === 'abha'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>ABHA Health ID</span>
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {loginMethod === 'phone' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Registered Mobile Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-24 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="absolute right-2 top-1.5 px-2.5 py-1 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-600 dark:text-teal-300 text-xs font-semibold border border-teal-500/30 transition-all cursor-pointer"
                  >
                    {otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className="animate-fade-in space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">
                      4-Digit SMS OTP Code
                    </label>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 font-mono">
                      (Simulated: 8841)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="8841"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono tracking-widest text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Ayushman Bharat Health ID (ABHA)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  placeholder="e.g. ABHA-91-8841-2091-4412"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
          </button>
        </form>

        {/* Quick Demo Patients */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick 1-Click Patient Sign-In
            </span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">Demo Accounts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allPatients.slice(0, 2).map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => handleQuickLogin(patient)}
                className="p-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 text-left transition-all flex items-center space-x-2.5 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-600/20 text-teal-600 dark:text-teal-300 border border-teal-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                  {patient.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-100 truncate">{patient.fullName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{patient.phoneNumber}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation to Registration Page */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Don't have a registered patient health profile?
          </p>
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-teal-600 dark:text-teal-300 text-xs font-bold transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Go to Patient Registration Page &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
