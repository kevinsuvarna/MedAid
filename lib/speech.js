export function speechAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function stopSpeech() {
  if (speechAvailable()) window.speechSynthesis.cancel();
}

export function speak(text, langCode, onEnd) {
  if (!speechAvailable() || !text) {
    if (onEnd) onEnd();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode;
    if (onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
  } catch (e) {
    if (onEnd) onEnd();
  }
}

export function startVoiceInput(langCode, { onStart, onResult, onError, onEnd } = {}) {
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!SR) {
    if (onError) onError(true);
    return;
  }
  try {
    const recognition = new SR();
    recognition.lang = langCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    if (onStart) onStart();
    recognition.onresult = (e) => {
      const transcript = (e.results && e.results[0] && e.results[0][0]) ? e.results[0][0].transcript : '';
      if (onResult) onResult(transcript);
    };
    recognition.onerror = () => {
      if (onError) onError(false);
    };
    recognition.onend = () => {
      if (onEnd) onEnd();
    };
    recognition.start();
  } catch (e) {
    if (onError) onError(false);
  }
}
