// src/utils/useSpeechRecognition.js
// Thin wrapper around the browser's Web Speech API (SpeechRecognition / webkitSpeechRecognition)
import { useEffect, useRef, useState } from 'react';

const ERROR_MESSAGES = {
  'not-allowed': 'Microphone access was denied. Allow microphone access for this site in your browser settings.',
  'service-not-allowed': 'Microphone access was denied. Allow microphone access for this site in your browser settings.',
  'no-speech': 'No speech was detected. Try again.',
  'audio-capture': 'No microphone was found. Check that one is connected and not in use by another app.',
  network: 'A network error interrupted speech recognition. Try again.',
  aborted: null, // user-initiated stop, not a real error
};

export default function useSpeechRecognition({ onFinalResult, onError } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');

  const hasApi = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;
  const isSupported = hasApi && isSecureContext;

  const unsupportedReason = !hasApi
    ? 'Voice input is not supported in this browser. Use Chrome or Edge.'
    : !isSecureContext
      ? 'Voice input requires a secure connection. Open this app via http://localhost:3000, not a network IP.'
      : null;

  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isSupported) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          onFinalResult?.(transcript.trim());
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimText('');
      const message = ERROR_MESSAGES[event.error] ?? `Voice input error: ${event.error}`;
      if (message) onError?.(message);
    };

    recognitionRef.current = recognition;
    return () => recognition.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  const start = () => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      onError?.(err.message || 'Could not start voice input.');
    }
  };

  const stop = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // no-op: recognition wasn't running
    }
  };

  const toggle = () => (isListening ? stop() : start());

  return { isSupported, unsupportedReason, isListening, interimText, start, stop, toggle };
}
