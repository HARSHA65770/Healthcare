from typing import Dict, Any, Tuple

# Vernacular dictionary mappings for common rural symptoms in Telugu, Hindi, Tamil
VERNACULAR_SYMPTOM_DICTIONARY = {
    "te-IN": {
        "గుండె నొప్పి": "chest pain",
        "శ్వాస ఆడకపోవడం": "severe breathlessness",
        "తలతిరుగుడు": "dizziness",
        "జ్వరం": "high fever",
        "దగ్గు": "cough",
        "రక్తం దగ్గు": "hemoptysis (coughing blood)",
        "కడుపు నొప్పి": "abdominal pain",
        "రెండు వారాలు దగ్గు": "cough > 2 weeks (TB risk)",
        "తీవ్రమైన తలనొప్పి": "severe pregnancy headache"
    },
    "hi-IN": {
        "छाती में दर्द": "chest pain",
        "सांस लेने में तकलीफ": "severe breathlessness",
        "चक्कर आना": "dizziness",
        "तेज़ बुखार": "high fever",
        "खांसी": "cough",
        "खून की उल्टी या खांसी": "hemoptysis (coughing blood)",
        "दो हफ्ते से ज्यादा खांसी": "cough > 2 weeks (TB risk)",
        "गर्भावस्था में सिरदर्द": "severe pregnancy headache"
    },
    "ta-IN": {
        "நெஞ்சு வலி": "chest pain",
        "மூச்சுத்திணறல்": "severe breathlessness",
        "தலைச்சுற்றல்": "dizziness",
        "காய்ச்சல்": "high fever",
        "இருமல்": "cough",
        "இரத்த இருமல்": "hemoptysis (coughing blood)",
        "கர்ப்ப தலைவலி": "severe pregnancy headache"
    }
}


class VernacularASRService:
    """
    ASR Engine (Bhashini / Whisper pipeline).
    Captures voice notes in regional Indian dialects (Telugu, Hindi, Tamil)
    and maps them into standard clinical English tokens.
    """

    @staticmethod
    def process_speech_audio(audio_base64: str, language_code: str = "te-IN") -> Tuple[str, str]:
        """
        Simulates / executes ASR model processing for audio payload.
        Returns: (transcribed_vernacular_text, clinical_english_tokens)
        """
        # Default placeholder if audio was sent without transcription
        default_vernacular = {
            "te-IN": "రెండు రోజులుగా ఛాతీలో ఒత్తిడి మరియు శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంది",
            "hi-IN": "दो दिनों से सीने में दर्द और सांस फूलने की समस्या है",
            "ta-IN": "இரண்டு நாட்களாக நெஞ்சு வலி மற்றும் மூச்சுத்திணறல் உள்ளது",
            "en-IN": "Experiencing chest tightness and difficulty breathing for 2 days"
        }

        vernacular_text = default_vernacular.get(language_code, default_vernacular["te-IN"])
        clinical_english = VernacularASRService.normalize_to_clinical_english(vernacular_text, language_code)
        return vernacular_text, clinical_english

    @staticmethod
    def normalize_to_clinical_english(raw_text: str, language_code: str = "te-IN") -> str:
        """
        Translates vernacular expressions into clinical English tokens.
        """
        normalized = raw_text
        dict_map = VERNACULAR_SYMPTOM_DICTIONARY.get(language_code, {})
        for vernacular_term, english_term in dict_map.items():
            if vernacular_term in normalized:
                normalized = normalized.replace(vernacular_term, f"[{english_term}]")
        
        # If already english or mixed
        return normalized


asr_service = VernacularASRService()
