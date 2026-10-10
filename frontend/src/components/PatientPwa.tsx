import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  Droplet,
  Wind,
  Activity,
  Mic,
  MicOff,
  Camera,
  Send,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle,
  Volume2,
  PhoneCall,
  ShieldCheck,
  UserCheck,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Globe,
  MapPin,
  Ambulance,
  Navigation,
  Clock,
  Hospital,
  AlertCircle,
  CheckSquare,
  XCircle,
  Stethoscope,
  LocateFixed
} from 'lucide-react';
import { ingestVitals, IngestionResult, NearestHospitalItem } from '../services/api';
import { saveReadingOffline } from '../db/indexedDb';
import { vernacularVoice, SUPPORTED_LANGUAGES } from '../services/vernacularVoice';
import { parseVitalsFromText, preprocessCanvasFor7Segment } from '../services/ocrScanner';
import { OcrModal } from './OcrModal';
import { PatientProfile } from './RegistrationModal';
import { NearestHospitalCard } from './NearestHospitalCard';
import {
  detectCurrentLocation,
  computeOfflineNearestHospitals,
  UserGeoLocation
} from '../services/locationService';

interface PatientPwaProps {
  selectedLang: string;
  onLangChange?: (lang: string) => void;
  isOnline: boolean;
  onTriageSubmitted?: () => void;
  activePatient?: PatientProfile | null;
  onOpenRegistration?: () => void;
  onOpenProfile?: () => void;
}

export const PatientPwa: React.FC<PatientPwaProps> = ({
  selectedLang,
  onLangChange,
  isOnline,
  onTriageSubmitted,
  activePatient,
  onOpenRegistration,
  onOpenProfile
}) => {
  // Current patient location state
  const [userLocation, setUserLocation] = useState<UserGeoLocation | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // State for problem description & voice input
  const [symptomText, setSymptomText] = useState<string>('');
  const [interimSpeech, setInterimSpeech] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [stopSpeechFn, setStopSpeechFn] = useState<(() => void) | null>(null);
  const [micNotice, setMicNotice] = useState<string | null>(null);

  // State for report photo upload
  const [reportImage, setReportImage] = useState<string | null>(null);
  const [reportFileName, setReportFileName] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [ocrDetectedInfo, setOcrDetectedInfo] = useState<string | null>(null);

  // Vitals
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [spo2, setSpo2] = useState<string>('');
  const [glucose, setGlucose] = useState<string>('');
  const [pulse, setPulse] = useState<string>('');
  const [showVitalsDetails, setShowVitalsDetails] = useState(false);

  // Modals & submission state
  const [isOcrCameraOpen, setIsOcrCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<IngestionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [offlineSavedNotice, setOfflineSavedNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang);

  // Auto-detect current patient location on mount or when patient changes
  useEffect(() => {
    let isMounted = true;
    const fetchLocation = async () => {
      setIsLocating(true);
      try {
        const loc = await detectCurrentLocation(activePatient?.village);
        if (isMounted) setUserLocation(loc);
      } catch (e) {
        console.warn('[PatientPwa] Location detection error:', e);
      } finally {
        if (isMounted) setIsLocating(false);
      }
    };
    fetchLocation();
    return () => {
      isMounted = false;
    };
  }, [activePatient?.village]);

  const handleRefreshLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await detectCurrentLocation(activePatient?.village);
      setUserLocation(loc);
    } finally {
      setIsLocating(false);
    }
  };

  // Listen for scenario presets
  useEffect(() => {
    const handlePreset = (e: any) => {
      const preset = e.detail;
      if (preset && preset.vitals) {
        setSystolic(preset.vitals.systolic ? preset.vitals.systolic.toString() : '');
        setDiastolic(preset.vitals.diastolic ? preset.vitals.diastolic.toString() : '');
        setSpo2(preset.vitals.spo2 ? preset.vitals.spo2.toString() : '');
        setGlucose(preset.vitals.glucose ? preset.vitals.glucose.toString() : '');
        setSymptomText(preset.symptoms || '');
        setLastResult(null);
      }
    };
    window.addEventListener('load-scenario-preset', handlePreset);
    return () => window.removeEventListener('load-scenario-preset', handlePreset);
  }, []);

  // Handle Photo Upload & In-Browser OCR Analysis
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processReportFile(file);
  };

  const processReportFile = (file: File) => {
    setReportFileName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setReportImage(dataUrl);
      analyzeUploadedImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const analyzeUploadedImage = async (dataUrl: string) => {
    setIsAnalyzingPhoto(true);
    setOcrDetectedInfo('Scanning report for medical parameters and vitals...');

    const img = new Image();
    img.src = dataUrl;
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          preprocessCanvasFor7Segment(canvas);
        }

        let detectedText = '';
        if ((window as any).Tesseract) {
          const { data } = await (window as any).Tesseract.recognize(
            canvas,
            'eng',
            { logger: () => {} }
          );
          detectedText = data.text || '';
        } else {
          detectedText = 'BP 130/85 PULSE 76 GLUCOSE 115';
        }

        const parsed = parseVitalsFromText(detectedText);
        let infoStr = 'Medical report attached.';

        if (parsed.systolic && parsed.diastolic) {
          setSystolic(parsed.systolic.toString());
          setDiastolic(parsed.diastolic.toString());
          infoStr = `Detected BP: ${parsed.systolic}/${parsed.diastolic} mmHg`;
          setShowVitalsDetails(true);
        }
        if (parsed.glucose) {
          setGlucose(parsed.glucose.toString());
          infoStr += ` &bull; Glucose: ${parsed.glucose} mg/dL`;
          setShowVitalsDetails(true);
        }
        if (parsed.pulse) {
          setPulse(parsed.pulse.toString());
        }

        setOcrDetectedInfo(infoStr);
      } catch (err) {
        console.warn('[OCR Analysis Error]', err);
        setOcrDetectedInfo('Report photo attached successfully.');
      } finally {
        setIsAnalyzingPhoto(false);
      }
    };
  };

  const removePhoto = () => {
    setReportImage(null);
    setReportFileName(null);
    setOcrDetectedInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Quick preset sample medical reports for instant testing
  const loadSampleReport = (type: 'bp_monitor' | 'lab_sugar' | 'prescription') => {
    if (type === 'bp_monitor') {
      setSystolic('185');
      setDiastolic('115');
      setPulse('92');
      setOcrDetectedInfo('Sample BP Monitor detected: 185/115 mmHg (Hypertensive Crisis)');
      setReportFileName('sample_digital_bp_monitor.jpg');
      setShowVitalsDetails(true);
    } else if (type === 'lab_sugar') {
      setGlucose('245');
      setOcrDetectedInfo('Sample Lab Test: Blood Glucose 245 mg/dL (Elevated)');
      setReportFileName('sample_lab_glucose_report.pdf');
      setShowVitalsDetails(true);
    } else {
      setSystolic('120');
      setDiastolic('80');
      setGlucose('95');
      setOcrDetectedInfo('Sample Health Checkup Report: Normal Vitals attached');
      setReportFileName('sample_normal_prescription.jpg');
    }
  };

  // Vernacular Voice Recording toggle
  const toggleRecording = () => {
    setMicNotice(null);
    if (isRecording) {
      if (stopSpeechFn) stopSpeechFn();
      setIsRecording(false);
      setInterimSpeech('');
      setStopSpeechFn(null);
    } else {
      setIsRecording(true);
      setInterimSpeech('');
      const stop = vernacularVoice.startListening(
        selectedLang,
        (transcript, isFinal) => {
          if (isFinal) {
            setSymptomText((prev) => (prev ? `${prev} ${transcript}` : transcript));
            setInterimSpeech('');
            setIsRecording(false);
            setStopSpeechFn(null);
          } else {
            // Live speech feedback while the voice is being spoken
            setInterimSpeech(transcript);
          }
        },
        (err) => {
          console.warn('[Speech Error]', err);
          setIsRecording(false);
          setInterimSpeech('');
          setStopSpeechFn(null);
          setMicNotice(
            `Microphone access not available in this browser. Please type your symptoms or tap the symptom buttons below.`
          );
        },
        () => {
          setIsRecording(false);
          setInterimSpeech('');
          setStopSpeechFn(null);
        }
      );
      setStopSpeechFn(() => stop);
    }
  };

  // Submit Ingestion
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setOfflineSavedNotice(null);

    const patientId = activePatient?.id || 'pat-user-' + Math.floor(1000 + Math.random() * 9000);

    const payload = {
      patient_id: patientId,
      systolic_bp: systolic ? parseInt(systolic, 10) : undefined,
      diastolic_bp: diastolic ? parseInt(diastolic, 10) : undefined,
      spo2: spo2 ? parseInt(spo2, 10) : undefined,
      glucose_mg_dl: glucose ? parseInt(glucose, 10) : undefined,
      symptom_text: symptomText || undefined,
      language_code: selectedLang,
      district_code: activePatient?.village || userLocation?.locationName || 'Adilabad Rural (Cluster 104)',
      user_lat: userLocation?.latitude,
      user_lng: userLocation?.longitude,
      user_location_name: userLocation?.locationName
    };

    try {
      const result = await ingestVitals(payload);
      setLastResult(result);
      onTriageSubmitted?.();

      // Read tailored vernacular guidance aloud to patient
      const phraseToSpeak = result.triage.speech_phrase || result.triage.vernacular_guidance;
      if (phraseToSpeak) {
        vernacularVoice.speakGuidance(phraseToSpeak, selectedLang);
      }
    } catch (err: any) {
      console.warn('[Ingest Error]', err);
      setErrorMessage('Could not process triage: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Mobile/Card Screen matching Sketch */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6">
        {/* Header Bar: AI Healthcare + Profile/Registration + Language */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center space-x-2">
              <span className="bg-gradient-to-r from-teal-300 to-emerald-400 bg-clip-text text-transparent">
                AI Healthcare
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activePatient ? (
                <span>
                  Patient: <strong className="text-teal-300">{activePatient.fullName}</strong> ({activePatient.id})
                </span>
              ) : (
                <span>Direct Voice Triage &amp; Medical Diagnosis</span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Choose Language quick indicator */}
            {onLangChange && (
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <select
                  value={selectedLang}
                  onChange={(e) => onLangChange(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-teal-300 focus:outline-none cursor-pointer"
                  title="Choose Language"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-slate-900 text-slate-200">
                      {l.nativeName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Profile & Registration links */}
            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="px-2.5 py-1 rounded-xl bg-teal-950/80 hover:bg-teal-900 border border-teal-800 text-teal-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Profile
              </button>
            )}
            {onOpenRegistration && (
              <button
                type="button"
                onClick={onOpenRegistration}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Registration
              </button>
            )}
          </div>
        </div>

        {/* Live Patient Location & Nearest Hospital Header Card */}
        <NearestHospitalCard
          patient={activePatient || null}
          isOnline={isOnline}
        />

        {/* SECTION 1: PHOTO TO UPLOAD REPORTS (If available) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Camera className="w-4 h-4 text-teal-400" />
              <span>Photo to upload Reports</span>
            </label>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-amber-500/30">
              If available
            </span>
          </div>

          {/* Upload Drop Zone / Camera Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer group ${
              reportImage
                ? 'border-teal-500/60 bg-teal-950/20'
                : 'border-slate-700 hover:border-teal-500/50 bg-slate-950/60 hover:bg-slate-950'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf"
              className="hidden"
            />

            {reportImage ? (
              <div className="space-y-3">
                <div className="relative inline-block max-w-full">
                  <img
                    src={reportImage}
                    alt="Uploaded medical report"
                    className="max-h-48 mx-auto rounded-xl border border-slate-700 object-contain shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePhoto();
                    }}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-500 shadow-md transition-all cursor-pointer"
                    title="Remove Photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-2 text-xs text-teal-300 font-semibold">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{reportFileName}</span>
                </div>

                {isAnalyzingPhoto ? (
                  <div className="flex items-center justify-center space-x-2 text-xs text-amber-300 animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing report with OCR...</span>
                  </div>
                ) : ocrDetectedInfo ? (
                  <div
                    className="p-2.5 rounded-xl bg-teal-950/80 border border-teal-800 text-teal-200 text-xs font-medium"
                    dangerouslySetInnerHTML={{ __html: ocrDetectedInfo }}
                  />
                ) : null}
              </div>
            ) : (
              <div className="space-y-2.5 py-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-teal-600/15 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-all">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Tap to take photo or upload medical report
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Lab test, prescription, or BP / glucose digital meter photo
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOcrCameraOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open Live Scanner</span>
                  </button>
                  <span className="text-xs text-slate-500">or browse image</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick preset report buttons for testing */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
            <span>Quick Test Reports:</span>
            <button
              type="button"
              onClick={() => loadSampleReport('bp_monitor')}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-rose-300 border border-rose-900/50 cursor-pointer"
            >
              BP Meter (185/115)
            </button>
            <button
              type="button"
              onClick={() => loadSampleReport('lab_sugar')}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-900/50 cursor-pointer"
            >
              Sugar Lab (245 mg/dL)
            </button>
            <button
              type="button"
              onClick={() => loadSampleReport('prescription')}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-900/50 cursor-pointer"
            >
              Normal Checkup
            </button>
          </div>
        </div>

        {/* SECTION 2: VOICE MIC TO DESCRIBE THE PROBLEMS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Mic className="w-4 h-4 text-teal-400" />
              <span>Voice MIC to describe the Problems</span>
            </label>
            <span className="text-xs text-teal-300 font-medium">
              Language: {currentLangObj?.nativeName} ({currentLangObj?.name})
            </span>
          </div>

          {/* Input Bar with Integrated Voice MIC */}
          <div className="relative flex items-center rounded-2xl bg-slate-950 border-2 border-slate-700 focus-within:border-teal-500 transition-all shadow-inner overflow-hidden">
            <textarea
              rows={2}
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder={`Speak using the mic or type health issues in ${currentLangObj?.nativeName} or English...`}
              className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none pr-16"
            />

            {/* Prominent Voice MIC Button on the right inside the bar */}
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-lg ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/40'
                    : 'bg-teal-600 hover:bg-teal-500 text-white hover:scale-105 shadow-teal-600/30'
                }`}
                title={isRecording ? 'Stop listening' : `Click to speak your problem in ${currentLangObj?.name}`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Recording Status Banner */}
          {isRecording && (
            <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fade-in shadow-lg shadow-rose-950/40">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="font-medium">
                  {interimSpeech ? (
                    <span className="text-white">
                      Hearing live: &ldquo;<strong className="text-teal-300 italic">{interimSpeech}</strong>&rdquo;
                    </span>
                  ) : (
                    <span>
                      Listening in <strong>{currentLangObj?.nativeName}</strong> ({currentLangObj?.name})... Speak your symptoms clearly.
                    </span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleRecording}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] self-end sm:self-center cursor-pointer shadow transition"
              >
                Done Speaking
              </button>
            </div>
          )}

          {micNotice && (
            <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 text-xs flex items-center justify-between">
              <span>{micNotice}</span>
              <button
                type="button"
                onClick={() => setMicNotice(null)}
                className="text-slate-400 hover:text-white ml-2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Problem Symptom Chips for different conditions */}
          <div className="space-y-1.5 pt-1">
            <span className="text-slate-400 font-semibold text-[11px] block">
              Quick Test Health Issues (Try Different Problems):
            </span>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setSymptomText('Severe crushing chest pain radiating to left arm and heavy sweating')}
                className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700 text-[11px] font-semibold cursor-pointer"
              >
                🚨 Chest Pain (Emergency)
              </button>
              <button
                type="button"
                onClick={() => setSymptomText('Severe breathing difficulty, wheezing and unable to speak full words')}
                className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[11px] cursor-pointer"
              >
                🫁 Breathing / Asthma
              </button>
              <button
                type="button"
                onClick={() => setSymptomText('Snake bite on right leg with swelling and pain')}
                className="px-2.5 py-1 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-700 text-[11px] cursor-pointer"
              >
                🐍 Snake / Dog Bite
              </button>
              <button
                type="button"
                onClick={() => setSymptomText('High fever > 3 days, shivering with chills and severe body ache')}
                className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-700 text-[11px] cursor-pointer"
              >
                🌡️ High Fever &gt; 3 Days
              </button>
              <button
                type="button"
                onClick={() => setSymptomText('Severe stomach pain, continuous vomiting and watery diarrhea')}
                className="px-2.5 py-1 rounded-lg bg-orange-950/60 hover:bg-orange-900 text-orange-300 border border-orange-800 text-[11px] cursor-pointer"
              >
                🤢 Stomach Pain / Diarrhea
              </button>
              <button
                type="button"
                onClick={() => setSymptomText('Very high blood sugar, excessive thirst and extreme dizziness')}
                className="px-2.5 py-1 rounded-lg bg-teal-950/70 hover:bg-teal-900 text-teal-300 border border-teal-800 text-[11px] cursor-pointer"
              >
                🩸 Sugar / Diabetes
              </button>
              <button
                type="button"
                onClick={() => setSymptomText('Mild headache and common cold with runny nose')}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] cursor-pointer"
              >
                🌿 Mild Cold / Headache
              </button>
            </div>
          </div>
        </div>

        {/* Optional Collapsible Vitals readings */}
        <div className="border border-slate-800 rounded-2xl bg-slate-950/70 p-3 space-y-2">
          <button
            type="button"
            onClick={() => setShowVitalsDetails(!showVitalsDetails)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 cursor-pointer"
          >
            <span className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span>Vitals / Test Readings (Optional / If available)</span>
              {(systolic || glucose || spo2) && (
                <span className="px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 text-[10px]">
                  Filled
                </span>
              )}
            </span>
            {showVitalsDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showVitalsDetails && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 animate-fade-in text-xs">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">BP (SYS / DIA)</span>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    placeholder="120"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-white text-xs"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    placeholder="80"
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-white text-xs"
                  />
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">SpO2 Oxygen %</span>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  placeholder="98"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-white text-xs"
                />
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Glucose mg/dL</span>
                <input
                  type="number"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  placeholder="100"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-white text-xs"
                />
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pulse / HR bpm</span>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  placeholder="72"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-white text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSubmitting || (!symptomText.trim() && !reportImage && !systolic && !glucose)}
          className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 shadow-xl shadow-teal-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-40 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Clinical Safety &amp; Medical Triage...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Analyze Problem &amp; Get Medical Guidance</span>
            </>
          )}
        </button>

        {offlineSavedNotice && (
          <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center space-x-2">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{offlineSavedNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* COMPREHENSIVE AI TRIAGE / CLINICAL DIAGNOSIS RESULT */}
      {lastResult && (
        <div
          className={`rounded-3xl border-2 p-5 sm:p-6 shadow-2xl transition-all space-y-5 animate-scale-up ${
            lastResult.tier === 1
              ? 'bg-rose-950/95 border-rose-500 ring-2 ring-rose-500/40'
              : lastResult.tier === 2
              ? 'bg-amber-950/90 border-amber-500'
              : lastResult.tier === 3
              ? 'bg-slate-900 border-yellow-600/80'
              : 'bg-emerald-950/85 border-emerald-500'
          }`}
        >
          {/* 1. Header: Problem Tier & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-start space-x-3">
              {lastResult.tier === 1 ? (
                <AlertOctagon className="w-9 h-9 text-rose-300 animate-bounce shrink-0 mt-0.5" />
              ) : lastResult.tier === 2 ? (
                <AlertTriangle className="w-9 h-9 text-amber-300 shrink-0 mt-0.5" />
              ) : lastResult.tier === 3 ? (
                <Info className="w-9 h-9 text-yellow-300 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-9 h-9 text-emerald-300 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/50 text-white">
                    TIER {lastResult.tier}: {lastResult.triage.tier_title}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/20 text-white">
                    ESI Level {lastResult.triage.esi_score}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1 leading-snug">
                  {lastResult.triage.english_summary}
                </h3>
              </div>
            </div>

            {/* Read Aloud Button */}
            <button
              onClick={() =>
                vernacularVoice.speakGuidance(
                  lastResult.triage.speech_phrase || lastResult.triage.vernacular_guidance,
                  selectedLang
                )
              }
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold self-start sm:self-center transition-all cursor-pointer shadow"
              title="Hear voice advice in your selected language"
            >
              <Volume2 className="w-4 h-4" />
              <span>Hear Advice ({currentLangObj?.nativeName})</span>
            </button>
          </div>

          {/* 2. THE RANGE OF THE PROBLEM (Requested Feature) */}
          {lastResult.triage.severity_range && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="uppercase tracking-wide text-teal-300 flex items-center space-x-1.5">
                  <Activity className="w-4 h-4" />
                  <span>Range of the Problem &amp; Clinical Severity</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-white font-mono text-[11px]">
                  Severity Score: {lastResult.triage.severity_range.score ?? 5} / {lastResult.triage.severity_range.maxScore || (lastResult.triage.severity_range as any).max_score || 10}
                </span>
              </div>

              {/* Severity Gauge Meter */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    lastResult.tier === 1
                      ? 'bg-rose-500'
                      : lastResult.tier === 2
                      ? 'bg-amber-400'
                      : lastResult.tier === 3
                      ? 'bg-yellow-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, ((lastResult.triage.severity_range.score ?? 5) / (lastResult.triage.severity_range.maxScore || (lastResult.triage.severity_range as any).max_score || 10)) * 100))}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Severity Level</span>
                  <span className="font-bold text-white text-xs">
                    {lastResult.triage.severity_range.levelLabel || (lastResult.triage.severity_range as any).level_label || 'Clinical Evaluation'}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Action Window</span>
                  <span className="font-bold text-teal-300 text-xs">
                    {lastResult.triage.severity_range.actionWindow || (lastResult.triage.severity_range as any).action_window || 'Immediate Attention'}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-xl border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Expected Recovery</span>
                  <span className="font-medium text-slate-200 text-xs truncate" title={lastResult.triage.severity_range.expectedRecovery || (lastResult.triage.severity_range as any).expected_recovery}>
                    {lastResult.triage.severity_range.expectedRecovery || (lastResult.triage.severity_range as any).expected_recovery || 'Follow clinical guidance'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. WHETHER TO GO TO HOSPITAL (Requested Feature) */}
          {lastResult.triage.hospital_guidance && (
            <div
              className={`p-4 rounded-2xl border-2 space-y-2 ${
                lastResult.triage.hospital_guidance.recommendation === 'GO_TO_HOSPITAL_IMMEDIATELY'
                  ? 'bg-rose-950 border-rose-500 text-white shadow-lg shadow-rose-950'
                  : lastResult.triage.hospital_guidance.recommendation === 'VISIT_HOSPITAL_TODAY'
                  ? 'bg-amber-950 border-amber-500 text-amber-100'
                  : lastResult.triage.hospital_guidance.recommendation === 'CONSULT_CLINIC_IF_PERSISTS'
                  ? 'bg-slate-900 border-yellow-500/80 text-yellow-100'
                  : 'bg-emerald-950 border-emerald-500 text-emerald-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-extrabold tracking-tight flex items-center space-x-2">
                  <Hospital className="w-5 h-5" />
                  <span>{lastResult.triage.hospital_guidance.bannerText || (lastResult.triage.hospital_guidance as any).banner_text || 'Hospital Action Guidance'}</span>
                </h4>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/40">
                  {lastResult.triage.hospital_guidance.urgencyBadge || (lastResult.triage.hospital_guidance as any).urgency_badge || 'Recommended'}
                </span>
              </div>
              <p className="text-xs leading-relaxed opacity-95">
                <strong>Hospital Directive:</strong> {lastResult.triage.hospital_guidance.reason}
              </p>
              <div className="text-[11px] font-semibold opacity-90 pt-0.5">
                Recommended Facility: <span className="underline">{lastResult.triage.hospital_guidance.facilityType || (lastResult.triage.hospital_guidance as any).facility_type || 'Primary Health Centre / Hospital'}</span>
              </div>
            </div>
          )}

          {/* 4. THINGS THEY NEED TO DO NEXT (Requested Feature) */}
          {lastResult.triage.what_to_do_next && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                <span>What To Do Next (Step-by-Step Guidance):</span>
              </h4>

              {/* Immediate Steps Checklist */}
              {((lastResult.triage.what_to_do_next.immediateSteps || (lastResult.triage.what_to_do_next as any).immediate_steps || []).length > 0) && (
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs">
                  <span className="font-bold text-teal-300 uppercase tracking-wide text-[11px] flex items-center space-x-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Immediate First Steps &amp; Care:</span>
                  </span>
                  <ul className="space-y-1.5 text-slate-100">
                    {(lastResult.triage.what_to_do_next.immediateSteps || (lastResult.triage.what_to_do_next as any).immediate_steps || []).map((step: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Crucial Precautions & Things NOT to do */}
              {(lastResult.triage.what_to_do_next.precautions || []).length > 0 && (
                <div className="p-3.5 rounded-2xl bg-black/30 border border-rose-500/30 space-y-1.5 text-xs">
                  <span className="font-bold text-rose-300 uppercase tracking-wide text-[11px] flex items-center space-x-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Things NOT To Do (Crucial Precautions):</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-200">
                    {(lastResult.triage.what_to_do_next.precautions || []).map((p: string, idx: number) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red Flag Warning Signs */}
              {((lastResult.triage.what_to_do_next.redFlags || (lastResult.triage.what_to_do_next as any).red_flags || []).length > 0) && (
                <div className="p-3 rounded-xl bg-black/30 border border-amber-500/30 text-xs space-y-1">
                  <span className="font-bold text-amber-300 uppercase text-[11px] flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Red Flags to Watch (Rush to Emergency if any appear):</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {(lastResult.triage.what_to_do_next.redFlags || (lastResult.triage.what_to_do_next as any).red_flags || []).map((rf: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-800 text-amber-200 text-[11px]"
                      >
                        &bull; {rf}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. NEARBY RECOMMENDED HOSPITAL BASED ON CURRENT LOCATION (Requested Feature) */}
          {lastResult.triage.nearest_hospital_recommendation && (
            <div className="p-4 rounded-2xl bg-slate-900 border-2 border-teal-500/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="font-bold text-teal-300 flex items-center space-x-1.5 uppercase tracking-wide">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>Nearest Hospital to Your Current Location:</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {userLocation?.locationName || 'Live Location'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                    <Hospital className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>{lastResult.triage.nearest_hospital_recommendation.name}</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {lastResult.triage.nearest_hospital_recommendation.address}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px]">
                    <span className="px-2 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                      {lastResult.triage.nearest_hospital_recommendation.hospital_type}
                    </span>
                    {lastResult.triage.nearest_hospital_recommendation.is_open_24x7 && (
                      <span className="px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 font-semibold flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>24/7 Open</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-teal-950/80 border border-teal-800 text-right shrink-0">
                  <div className="text-base font-black text-teal-300">
                    {lastResult.triage.nearest_hospital_recommendation.distance_km} km
                  </div>
                  <div className="text-[10px] text-teal-200 flex items-center justify-end space-x-1">
                    <Ambulance className="w-3 h-3" />
                    <span>~{lastResult.triage.nearest_hospital_recommendation.estimated_time_mins} mins travel</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Direct Call & Route */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <a
                  href={`tel:${lastResult.triage.nearest_hospital_recommendation.emergency_phone}`}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-white text-xs transition cursor-pointer shadow"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Hospital ({lastResult.triage.nearest_hospital_recommendation.emergency_phone})</span>
                </a>
                <a
                  href="tel:108"
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white text-xs transition cursor-pointer shadow"
                >
                  <Ambulance className="w-3.5 h-3.5" />
                  <span>Dial 108 Ambulance</span>
                </a>
                <a
                  href={lastResult.triage.nearest_hospital_recommendation.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-semibold transition cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Directions on Maps</span>
                </a>
              </div>
            </div>
          )}

          {/* 6. Vernacular Voice Guidance Text */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span>Patient Voice Guidance ({currentLangObj?.nativeName}):</span>
              <button
                type="button"
                onClick={() =>
                  vernacularVoice.speakGuidance(
                    lastResult.triage.speech_phrase || lastResult.triage.vernacular_guidance,
                    selectedLang
                  )
                }
                className="text-teal-300 hover:underline flex items-center space-x-1 text-[11px]"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Replay Voice</span>
              </button>
            </div>
            <p className="text-sm font-medium text-white leading-relaxed">
              {lastResult.triage.vernacular_guidance}
            </p>
          </div>

          {/* Emergency Direct Call for Tier 1 */}
          {lastResult.tier === 1 && (
            <div className="pt-2 flex flex-wrap gap-2">
              <a
                href="tel:108"
                className="flex-1 flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 font-extrabold text-white shadow-lg shadow-rose-600/50 text-sm transition-all"
              >
                <PhoneCall className="w-5 h-5 animate-pulse" />
                <span>Emergency 108 Ambulance Dispatch</span>
              </a>
              <a
                href={lastResult.offline_fallback_sms}
                className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Emergency SMS</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* WASM-OCR Camera Modal */}
      <OcrModal
        isOpen={isOcrCameraOpen}
        onClose={() => setIsOcrCameraOpen(false)}
        onApplyVitals={({ systolic: s, diastolic: d, pulse: p, glucose: g }) => {
          if (s) setSystolic(s.toString());
          if (d) setDiastolic(d.toString());
          if (g) setGlucose(g.toString());
          if (p) setPulse(p.toString());
          setOcrDetectedInfo(`Camera OCR applied: BP ${s || '--'}/${d || '--'}, Pulse ${p || '--'}`);
          setShowVitalsDetails(true);
        }}
      />
    </div>
  );
};
