import React, { useState, useRef, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Hospital,
  Smartphone,
  Sparkles,
  Globe,
  User,
  UserPlus,
  ChevronDown,
  HeartPulse,
  Palette,
  Check,
  Sun,
  Moon,
  LogIn,
  LogOut
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../services/vernacularVoice';
import { PatientProfile } from './RegistrationModal';
import { ThemeId, THEME_OPTIONS } from '../services/theme';

export type NavTab = 'register' | 'login' | 'patient' | 'registration' | 'hospital';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  selectedLang: string;
  onLangChange: (lang: string) => void;
  isOnline: boolean;
  onOpenSimulations: () => void;
  onOpenProfile: () => void;
  onOpenRegistrationModal: () => void;
  activePatient?: PatientProfile | null;
  currentTheme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  selectedLang,
  onLangChange,
  isOnline,
  onOpenSimulations,
  onOpenProfile,
  onOpenRegistrationModal,
  activePatient,
  currentTheme,
  onThemeChange,
  isAuthenticated = false,
  onLogout
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeThemeObj = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/80 px-4 py-3 text-slate-100 shadow-md transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand: AI Healthcare */}
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => onTabChange(isAuthenticated ? 'patient' : 'register')}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25 ring-2 ring-teal-400/30">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight brand-title-gradient">
                AI Healthcare
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-950 text-teal-600 dark:text-teal-300 border border-teal-800/80 hidden sm:inline-block">
                Clinical AI
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {activePatient && isAuthenticated
                ? `Active Patient: ${activePatient.fullName}`
                : 'Rural Preventive Healthcare Platform'}
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-sm">
          {!isAuthenticated ? (
            <>
              {/* Unauthenticated: Registration & Login tabs */}
              <button
                onClick={() => onTabChange('register')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'register' || currentTab === 'registration'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>1. Registration</span>
              </button>
              <button
                onClick={() => onTabChange('login')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'login'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>2. Login</span>
              </button>
            </>
          ) : (
            <>
              {/* Authenticated: Patient App | Registration | Hospital Services */}
              <button
                onClick={() => onTabChange('patient')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'patient'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Patient App</span>
              </button>

              <button
                onClick={() => onTabChange('registration')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'registration' || currentTab === 'register'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Registration</span>
              </button>

              <button
                onClick={() => onTabChange('hospital')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'hospital'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Hospital className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hospital Services</span>
                <span className="sm:hidden">Hospitals</span>
              </button>
            </>
          )}
        </div>

        {/* Right Controls: Theme Switcher, Language & Profile Menu */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Switcher Dropdown */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl px-2.5 py-1.5 transition-all text-xs font-medium text-slate-200 cursor-pointer shadow-sm"
              title={`Active Theme: ${activeThemeObj.name} (${activeThemeObj.badge})`}
            >
              <Palette className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="hidden md:inline text-xs font-semibold">{activeThemeObj.name}</span>
              <span
                className="w-2.5 h-2.5 rounded-full border border-slate-500 shrink-0"
                style={{ backgroundColor: activeThemeObj.accentColor }}
              />
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Theme Selection Menu */}
            {isThemeMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-scale-up backdrop-blur-xl">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Interface Theme</p>
                    <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">Multi-Theme</span>
                  </div>
                  <p className="text-xs font-bold text-slate-100">Select Clinical Palette</p>
                </div>

                <div className="space-y-1">
                  {THEME_OPTIONS.map((theme) => {
                    const isSelected = theme.id === currentTheme;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => {
                          onThemeChange(theme.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border border-teal-500/50 shadow-sm'
                            : 'hover:bg-slate-800/60 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-white/20 shadow-sm"
                            style={{ backgroundColor: theme.accentColor }}
                          >
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-slate-100">{theme.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                                {theme.badge}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                              {theme.description}
                            </p>
                          </div>
                        </div>
                        {theme.isDark ? (
                          <Moon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Choose Language Selector */}
          <div className="relative flex items-center">
            <label htmlFor="lang-select" className="sr-only">Choose Language</label>
            <div className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl px-2.5 py-1.5 transition-all text-xs font-medium text-slate-200">
              <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
              <select
                id="lang-select"
                value={selectedLang}
                onChange={(e) => onLangChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-100 focus:outline-none cursor-pointer pr-1"
                title="Choose Language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Top-Right Profile & Registration Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm cursor-pointer"
              title="Patient Profile & Authentication"
            >
              <div className="w-6 h-6 rounded-lg bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-600 dark:text-teal-300">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="hidden md:inline-block max-w-[100px] truncate">
                {isAuthenticated && activePatient ? activePatient.fullName : 'Account'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-scale-up backdrop-blur-xl">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {isAuthenticated ? 'Active Patient Session' : 'Portal Account'}
                  </p>
                  <p className="text-xs font-bold text-slate-100 truncate">
                    {isAuthenticated && activePatient ? activePatient.fullName : 'Guest Session'}
                  </p>
                </div>

                {isAuthenticated ? (
                  <>
                    {/* Profile Option */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-300 transition-all cursor-pointer text-left"
                    >
                      <div className="w-6 h-6 rounded-lg bg-teal-950 text-teal-600 dark:text-teal-400 border border-teal-800 flex items-center justify-center">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span>Profile Details</span>
                        <p className="text-[10px] text-slate-400 font-normal">View medical history &amp; vitals</p>
                      </div>
                    </button>

                    {/* Registration Page Option */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onTabChange('registration');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-300 transition-all cursor-pointer text-left"
                    >
                      <div className="w-6 h-6 rounded-lg bg-teal-950 text-teal-600 dark:text-teal-400 border border-teal-800 flex items-center justify-center">
                        <UserPlus className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span>Enroll New Patient</span>
                        <p className="text-[10px] text-slate-400 font-normal">Register additional patient</p>
                      </div>
                    </button>

                    {/* Logout Option */}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all cursor-pointer text-left border-t border-slate-800/80 mt-1"
                      >
                        <div className="w-6 h-6 rounded-lg bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center">
                          <LogOut className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span>Sign Out / Switch</span>
                          <p className="text-[10px] text-slate-400 font-normal">Back to Registration / Login</p>
                        </div>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onTabChange('register');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-300 transition-all cursor-pointer text-left"
                    >
                      <div className="w-6 h-6 rounded-lg bg-teal-950 text-teal-600 dark:text-teal-400 border border-teal-800 flex items-center justify-center">
                        <UserPlus className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span>Registration Page</span>
                        <p className="text-[10px] text-slate-400 font-normal">Create patient account</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onTabChange('login');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-300 transition-all cursor-pointer text-left"
                    >
                      <div className="w-6 h-6 rounded-lg bg-teal-950 text-teal-600 dark:text-teal-400 border border-teal-800 flex items-center justify-center">
                        <LogIn className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span>Login Page</span>
                        <p className="text-[10px] text-slate-400 font-normal">Sign in to existing account</p>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Simulation Presets */}
          <button
            onClick={onOpenSimulations}
            className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-500 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all cursor-pointer"
            title="Scenario Presets"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>

          {/* Network status badge */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOnline
                ? 'bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-800'
                : 'bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-800 animate-pulse'
            }`}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-500" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
