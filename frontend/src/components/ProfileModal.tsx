import React from 'react';
import { X, User, Phone, MapPin, Globe, Activity, UserPlus, CheckCircle2, History, ChevronRight, AlertCircle } from 'lucide-react';
import { PatientProfile } from './RegistrationModal';
import { SUPPORTED_LANGUAGES } from '../services/vernacularVoice';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: PatientProfile;
  allProfiles: PatientProfile[];
  onSelectProfile: (profile: PatientProfile) => void;
  onOpenRegister: () => void;
  recentRecords?: any[];
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  allProfiles,
  onSelectProfile,
  onOpenRegister,
  recentRecords = []
}) => {
  if (!isOpen) return null;

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === activeProfile.preferredLang);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                Patient Profile &amp; Records
              </h3>
              <p className="text-[11px] text-slate-400">
                Active ID: <span className="font-mono text-teal-300 font-semibold">{activeProfile.id}</span>
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Active Card */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-teal-800/40 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-28 h-28 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-teal-600/30">
                  {activeProfile.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-base text-white flex items-center space-x-2">
                    <span>{activeProfile.fullName}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-700">
                      Active
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    {activeProfile.age} yrs &bull; {activeProfile.gender}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{activeProfile.phoneNumber}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="truncate">{activeProfile.village}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{currentLangObj?.nativeName || activeProfile.preferredLang} ({currentLangObj?.name})</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <Activity className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>Registered: {new Date(activeProfile.registeredAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Conditions pills */}
            {activeProfile.conditions && activeProfile.conditions.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                  Pre-existing Conditions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeProfile.conditions.map((cond, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-teal-950/70 text-teal-300 border border-teal-800 text-[11px]"
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Switch / Registered Profiles */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span>Saved Profiles ({allProfiles.length})</span>
              </h5>
              <button
                onClick={() => {
                  onClose();
                  onOpenRegister();
                }}
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center space-x-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Register New</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {allProfiles.map((prof) => {
                const isActive = prof.id === activeProfile.id;
                return (
                  <button
                    key={prof.id}
                    onClick={() => onSelectProfile(prof)}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-950/40 border-teal-600/60 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-teal-300 flex items-center justify-center font-bold text-xs">
                        {prof.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{prof.fullName}</p>
                        <p className="text-[10px] text-slate-400">
                          {prof.phoneNumber} &bull; {prof.village}
                        </p>
                      </div>
                    </div>
                    {isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Info & Action */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <History className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Offline &amp; online screenings are stored securely in browser database.</span>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all cursor-pointer whitespace-nowrap"
            >
              Add Family Member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
