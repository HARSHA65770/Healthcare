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
  private recognition: any = null;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  startListening(
    langCode: string,
    onResult: (text: string) => void,
    onError: (err: any) => void
  ): () => void {
    if (!this.recognition) {
      onError(new Error('Speech recognition not supported in this browser.'));
      return () => {};
    }

    this.recognition.lang = langCode;

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      onError(event.error);
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('[Speech] Start error:', e);
    }

    return () => {
      try {
        this.recognition.stop();
      } catch (e) {}
    };
  }

  speakGuidance(text: string, langCode: string) {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Cancel any existing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9; // Slightly slower for clarity in rural environments

    // Attempt to pick a matching regional voice if available
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => v.lang.startsWith(langCode.slice(0, 2)));
    if (match) {
      utterance.voice = match;
    }

    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const vernacularVoice = new VernacularVoiceEngine();
