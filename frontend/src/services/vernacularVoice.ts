// Vernacular Voice Service (Section 1, 2, 5)
// HTML5 MediaRecorder + Web Speech API + SpeechSynthesis in Telugu, Hindi, Tamil, English

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  samplePhrase: string;
  emergencyWarning: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en-IN',
    name: 'English',
    nativeName: 'English',
    samplePhrase: 'Severe crushing chest pain radiating to left arm and dizziness',
    emergencyWarning: 'Critical emergency! Dial 108 immediately'
  },
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    samplePhrase: 'सीने में तेज़ दर्द और तीन दिनों से तेज़ बुखार है',
    emergencyWarning: 'आपातकालीन चेतावनी! तुरंत 108 पर कॉल करें'
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    samplePhrase: 'రెండు రోజులుగా ఛాతీలో ఒత్తిడి మరియు తీవ్రమైన శ్వాస ఆడకపోవడం ఉంది',
    emergencyWarning: 'అత్యవసర హెచ్చరిక! తక్షణమే 108 కి కాల్ చేయండి'
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    samplePhrase: 'நெஞ்சு வலி மற்றும் இரண்டு வாரமாக தொடர் இருமல் உள்ளது',
    emergencyWarning: 'அவசர எச்சரிக்கை! உடனடியாக 108 ஐ அழைக்கவும்'
  },
  {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    samplePhrase: 'ಎದೆಯಲ್ಲಿ ತೀವ್ರವಾದ ನೋವು ಮತ್ತು ತಲೆತಿರುಗುವಿಕೆ ಇದೆ',
    emergencyWarning: 'ತುರ್ತು ಎಚ್ಚರಿಕೆ! ತಕ್ಷಣವೇ 108 ಗೆ ಕರೆ ಮಾಡಿ'
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    samplePhrase: 'छातीत तीव्र वेदना आणि दोन दिवसांपासून ताप आहे',
    emergencyWarning: 'तातडीचा इशारा! ताबडतोब 108 वर कॉल करा'
  },
  {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    samplePhrase: 'বুকে তীব্র ব্যথা এবং শ্বাস নিতে কষ্ট হচ্ছে',
    emergencyWarning: 'জরুরি সতর্কতা! অবিলম্বে 108 নম্বরে কল করুন'
  }
];

export class VernacularVoiceEngine {
  private activeRecognition: any = null;

  isSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  startListening(
    langCode: string,
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd?: () => void
  ): () => void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onError(new Error('Speech recognition not supported in this browser.'));
      return () => {};
    }

    // Safely stop any ongoing instance
    try {
      if (this.activeRecognition) {
        this.activeRecognition.abort();
      }
    } catch (e) {}

    const recognition = new SpeechRecognition();
    this.activeRecognition = recognition;
    recognition.lang = langCode;
    recognition.continuous = false;
    recognition.interimResults = true; // Stream live words so the UI never appears blank while speaking

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item && item[0]) {
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }
      }

      if (finalTranscript.trim()) {
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript.trim()) {
        onResult(interimTranscript.trim(), false);
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore normal no-speech timeouts gracefully
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        onError(event.error);
      }
    };

    recognition.onend = () => {
      if (this.activeRecognition === recognition) {
        this.activeRecognition = null;
      }
      onEnd?.();
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn('[Speech] Start error:', e);
      onError(e);
    }

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }

  speakGuidance(text: string, langCode: string) {
    if (!('speechSynthesis' in window)) return;
    if (!text || typeof text !== 'string' || !text.trim()) return;

    // Sanitize any corrupted chars from text
    const cleanText = text.replace(/[\u0080-\u009F\uFFFD]/g, '').trim();
    if (!cleanText) return;

    try {
      window.speechSynthesis.cancel(); // Cancel any existing speech
    } catch (e) {}

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = langCode;
      utterance.rate = 0.9; // Slightly slower for clarity in rural environments

      // Attempt to pick a matching regional voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const match = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langCode.slice(0, 2).toLowerCase()));
        if (match) {
          utterance.voice = match;
        }
      }

      utterance.onerror = (e) => {
        console.warn('[SpeechSynthesis] Utterance error:', e);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[SpeechSynthesis] Failed to speak guidance:', e);
    }
  }

  stopSpeaking() {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }
}

export const vernacularVoice = new VernacularVoiceEngine();
