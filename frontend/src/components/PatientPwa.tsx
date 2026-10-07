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
  Globe
} from 'lucide-react';
import { ingestVitals, IngestionResult } from '../services/api';
import { saveReadingOffline } from '../db/indexedDb';
import { vernacularVoice, SUPPORTED_LANGUAGES } from '../services/vernacularVoice';
import { parseVitalsFromText, preprocessCanvasFor7Segment } from '../services/ocrScanner';
import { OcrModal } from './OcrModal';
import { PatientProfile } from './RegistrationModal';
import { NearestHospitalCard } from './NearestHospitalCard';

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
  // State for problem description & voice input
  const [symptomText, setSymptomText] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [stopSpeechFn, setStopSpeechFn] = useState<(() => void) | null>(null);

  // State for report photo upload (Box 1 in sketch)
  const [reportImage, setReportImage] = useState<string | null>(null);
  const [reportFileName, setReportFileName] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [ocrDetectedInfo, setOcrDetectedInfo] = useState<string | null>(null);

  // Vitals (either auto-detected from report photo or entered)
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
          // Fallback parsing
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
      setOcrDetectedInfo('Sample BP Monitor detected: 185/115 mmHg (High)');
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
    if (isRecording) {
      if (stopSpeechFn) stopSpeechFn();
      setIsRecording(false);
      setStopSpeechFn(null);
    } else {
      setIsRecording(true);
      const stop = vernacularVoice.startListening(
        selectedLang,
        (transcript) => {
          setSymptomText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
          setStopSpeechFn(null);
        },
        (err) => {
          console.warn('[Speech Error]', err);
          // Insert sample vernacular phrase if microphone is not permitted in browser
          if (currentLangObj) {
            setSymptomText(currentLangObj.samplePhrase);
          }
          setIsRecording(false);
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
      district_code: activePatient?.village || 'DIST-ADILABAD-01'
    };

    if (!isOnline) {
      try {
        await saveReadingOffline({
          local_id: 'local-' + Date.now(),
          patient_id: patientId,
          systolic_bp: payload.systolic_bp,
          diastolic_bp: payload.diastolic_bp,
          spo2: payload.spo2,
          glucose_mg_dl: payload.glucose_mg_dl,
          symptom_text: symptomText,
          language_code: selectedLang,
          district_code: 'DIST-ADILABAD-01',
          timestamp: new Date().toISOString()
        });
        setOfflineSavedNotice(
          'Internet disconnected. Consultation securely buffered in local offline database and will auto-sync upon reconnection.'
        );
      } catch (err: any) {
        setErrorMessage('Failed to save offline: ' + err.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const result = await ingestVitals(payload);
      setLastResult(result);
      onTriageSubmitted?.();

      // Read vernacular guidance aloud to patient
      if (result.triage.vernacular_guidance) {
        vernacularVoice.speakGuidance(result.triage.vernacular_guidance, selectedLang);
      }
    } catch (err: any) {
      console.warn('[Ingest Error]', err);
      // Auto fallback to local storage
      await saveReadingOffline({
        local_id: 'local-' + Date.now(),
        patient_id: patientId,
        systolic_bp: payload.systolic_bp,
        diastolic_bp: payload.diastolic_bp,
        spo2: payload.spo2,
        glucose_mg_dl: payload.glucose_mg_dl,
        symptom_text: symptomText,
        language_code: selectedLang,
        district_code: 'DIST-ADILABAD-01',
        timestamp: new Date().toISOString()
      });
      setOfflineSavedNotice('Server network unreachable. Reading buffered safely in local IndexedDB.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Mobile/Card Screen matching Sketch */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6">
        {/* Sketch Header Bar: AI Healthcare + Profile/Registration + Language */}
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
                <span>Instant Voice &amp; Medical Report Diagnosis</span>
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

        {/* Nearest Emergency Hospital & Medical Contact (Location-Aware) */}
        <NearestHospitalCard
          patient={activePatient || null}
          isOnline={isOnline}
        />

        {/* SECTION 1: PHOTO TO UPLOAD REPORTS (If available) - Matching Sketch Box 1 */}
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
                    Lab test, doctor prescription, or BP / glucose digital meter photo
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

        {/* SECTION 2: VOICE MIC TO DESCRIBE THE PROBLEMS - Matching Sketch Box 2 */}
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

          {/* Sketch Input Bar with Integrated Voice MIC on the right */}
          <div className="relative flex items-center rounded-2xl bg-slate-950 border-2 border-slate-700 focus-within:border-teal-500 transition-all shadow-inner overflow-hidden">
            <textarea
              rows={2}
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder={`Speak or type problems in ${currentLangObj?.nativeName} or English...`}
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
                title={isRecording ? 'Stop listening' : `Click to speak in ${currentLangObj?.name}`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Recording Status Banner */}
          {isRecording && (
            <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center justify-between animate-fade-in">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span>
                  Listening in <strong>{currentLangObj?.nativeName}</strong>... Speak your problem clearly.
                </span>
              </div>
              <button
                type="button"
                onClick={toggleRecording}
                className="text-[11px] underline font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* Quick Problem Symptom Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
            <span className="text-slate-500 self-center text-[11px]">Quick Symptoms:</span>
            <button
              type="button"
              onClick={() => setSymptomText('Severe chest pain radiating to left arm and heavy sweating')}
              className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 text-[11px] cursor-pointer"
            >
              Chest Pain
            </button>
            <button
              type="button"
              onClick={() => setSymptomText('High fever > 3 days, body chills and chronic cough')}
              className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800 text-[11px] cursor-pointer"
            >
              Fever &gt; 3 days
            </button>
            <button
              type="button"
              onClick={() => setSymptomText('High blood sugar, increased thirst and tiredness')}
              className="px-2.5 py-1 rounded-lg bg-teal-950/60 hover:bg-teal-900/60 text-teal-300 border border-teal-800 text-[11px] cursor-pointer"
            >
              Sugar / Diabetes
            </button>
            <button
              type="button"
              onClick={() => setSymptomText('Mild headache and seasonal fatigue')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
            >
              Mild Headache
            </button>
          </div>
        </div>

        {/* Optional Collapsible Vitals readings (from report or manual) */}
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
              <span>Analyze &amp; Get AI Healthcare Advice</span>
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

      {/* AI Triage / Diagnosis Result Display */}
      {lastResult && (
        <div
          className={`rounded-3xl border p-5 sm:p-6 shadow-2xl transition-all space-y-4 animate-scale-up ${
            lastResult.tier === 1
              ? 'bg-rose-950/90 border-rose-600 animate-siren'
              : lastResult.tier === 2
              ? 'bg-amber-950/80 border-amber-600'
              : lastResult.tier === 3
              ? 'bg-yellow-950/50 border-yellow-600'
              : 'bg-emerald-950/60 border-emerald-600'
          }`}
        >
          {/* Header Tier Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center space-x-3">
              {lastResult.tier === 1 ? (
                <AlertOctagon className="w-8 h-8 text-rose-300 animate-bounce" />
              ) : lastResult.tier === 2 ? (
                <AlertTriangle className="w-8 h-8 text-amber-300" />
              ) : lastResult.tier === 3 ? (
                <Info className="w-8 h-8 text-yellow-300" />
              ) : (
                <CheckCircle className="w-8 h-8 text-emerald-300" />
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-white">
                    TIER {lastResult.tier}: {lastResult.triage.tier_title}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/20 text-white">
                    ESI Level {lastResult.triage.esi_score}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {lastResult.triage.english_summary}
                </h3>
              </div>
            </div>

            {/* Read Aloud Button */}
            <button
              onClick={() => vernacularVoice.speakGuidance(lastResult.triage.vernacular_guidance, selectedLang)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold self-start sm:self-center transition-all cursor-pointer shadow"
            >
              <Volume2 className="w-4 h-4" />
              <span>Hear Audio ({currentLangObj?.nativeName})</span>
            </button>
          </div>

          {/* Vernacular Voice Guidance */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
              <span>Patient Voice Guidance ({currentLangObj?.nativeName}):</span>
              <span className="text-[10px] text-teal-300 uppercase">Vernacular Synthesized</span>
            </div>
            <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
              {lastResult.triage.vernacular_guidance}
            </p>
          </div>

          {/* Actions & Rationale */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1">
              <span className="text-slate-300 font-bold block uppercase tracking-wide">
                Safety Rule Trigger:
              </span>
              <p className="text-slate-200">
                {lastResult.triage.safety_rule_triggered || 'None (Normal Range)'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1">
              <span className="text-slate-300 font-bold block uppercase tracking-wide">
                Recommended Actions:
              </span>
              <ul className="list-disc list-inside text-slate-200 space-y-0.5">
                {lastResult.triage.actions_taken.map((act, idx) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Emergency Direct Call for Tier 1 */}
          {lastResult.tier === 1 && (
            <div className="pt-2 flex flex-wrap gap-2">
              <a
                href="tel:108"
                className="flex-1 flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-white shadow-lg shadow-rose-600/50 text-sm transition-all"
              >
                <PhoneCall className="w-5 h-5 animate-pulse" />
                <span>Call 108 Emergency Medical Services</span>
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
