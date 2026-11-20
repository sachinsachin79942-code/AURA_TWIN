const confidenceValue = document.querySelector("#confidence-value");
const confidenceBar = document.querySelector("#confidence-bar");
const confidenceTwin = document.querySelector("#twin-confidence");
const signalStatus = document.querySelector("#signal-status");
const signalMessage = document.querySelector("#signal-message");
const degradedToggle = document.querySelector("#degraded-toggle");
const toast = document.querySelector("#toast");
const loginScreen = document.querySelector("#login-screen");
const appShell = document.querySelector("#app-shell");
const crewIdInput = document.querySelector("#crew-id");
const passcodeInput = document.querySelector("#passcode");
const crewGreeting = document.querySelector("#crew-greeting");
const voiceWelcome = document.querySelector("#voice-welcome");
const voiceStatus = document.querySelector("#voice-status");
const voiceStatusPill = document.querySelector("#voice-status-pill");
const voiceTranscript = document.querySelector("#voice-transcript");
const voiceStartButton = document.querySelector("#voice-start");
const voiceStopButton = document.querySelector("#voice-stop");
const voiceConsentDialog = document.querySelector("#voice-consent-dialog");
const speakReplies = document.querySelector("#speak-replies");
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let voiceConsentAccepted = false;
let welcomeMessage = "";
let toastTimer;

try {
  const savedCrewId = window.localStorage.getItem("aura-twin-crew-id");
  if (savedCrewId) crewIdInput.value = savedCrewId;
} catch (error) {
  document.querySelector(".login-privacy").textContent = "DEMO SIGN-IN: NOTHING IS SENT OR SAVED. THIS BROWSER BLOCKED LOCAL STORAGE.";
}

document.querySelector("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const crewId = crewIdInput.value.trim();
  if (!crewId || !passcodeInput.value) return;
  crewGreeting.textContent = `${crewId}.`;
  loginScreen.hidden = true;
  appShell.hidden = false;
  passcodeInput.value = "";
  try {
    window.localStorage.setItem("aura-twin-crew-id", crewId);
  } catch (error) {
    showToast("Signed in for this visit; browser storage is unavailable.");
  }
  welcomeCrewMember();
  document.querySelector("#main").focus({ preventScroll: true });
  window.scrollTo(0, 0);
});

document.querySelector("#sign-out-button").addEventListener("click", () => {
  stopVoiceAssistant();
  voiceConsentAccepted = false;
  appShell.hidden = true;
  loginScreen.hidden = false;
  passcodeInput.value = "";
  passcodeInput.focus();
  window.scrollTo(0, 0);
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2800);
}

function setSignalQuality(degraded) {
  const confidence = degraded ? 62.4 : 94.8;
  confidenceValue.innerHTML = `${confidence}<span>%</span>`;
  confidenceBar.style.width = `${confidence}%`;
  confidenceTwin.textContent = `${confidence}%`;
  signalStatus.classList.toggle("degraded", degraded);
  signalStatus.innerHTML = `<i></i> ${degraded ? "DEGRADED INPUT" : "GOOD INPUT"}`;
  signalMessage.textContent = degraded
    ? "Signal quality is low. Treat projections as uncertain; reacquire a clean sample."
    : "All sample streams are nominal. Forecast confidence is high.";
}

degradedToggle.addEventListener("change", () => setSignalQuality(degradedToggle.checked));

const sleepSlider = document.querySelector("#sleep-slider");
const hydrationSlider = document.querySelector("#hydration-slider");
const sleepValue = document.querySelector("#sleep-value");
const hydrationValue = document.querySelector("#hydration-value");
const scenarioScore = document.querySelector("#scenario-score");
const scenarioMessage = document.querySelector("#scenario-message");

sleepSlider.addEventListener("input", () => { sleepValue.textContent = sleepSlider.value; });
hydrationSlider.addEventListener("input", () => { hydrationValue.textContent = hydrationSlider.value; });

document.querySelector("#run-scenario").addEventListener("click", () => {
  const sleepBenefit = (Number(sleepSlider.value) - 7) * 2.5;
  const hydrationBenefit = (Number(hydrationSlider.value) - 60) * 0.08;
  const score = Math.max(12, Math.min(72, Math.round(48 - sleepBenefit - hydrationBenefit)));
  scenarioScore.innerHTML = `${score}<span>%</span>`;
  scenarioMessage.textContent = `Sample projection: ${score}% risk at 72 hours. Baseline telemetry remains unchanged.`;
});

document.querySelector("#export-button").addEventListener("click", () => {
  const report = [
    "AURA-TWIN | Sample health report",
    `Generated: ${new Date().toISOString()}`,
    "Notice: illustrative simulated values only; not medical advice.",
    "",
    "Heart rate: 68 BPM",
    "SpO2 estimate: 98.4%",
    "Voice fatigue: 0.18 index",
    "Cognitive load: 0.31 quotient",
    `Model confidence: ${degradedToggle.checked ? "62.4%" : "94.8%"}`,
    `72-hour sample risk projection: ${scenarioScore.textContent}`,
    "No biometric sensor data is included; voice audio is not part of this report."
  ].join("\n");
  const file = new Blob([report], { type: "text/plain;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "aura-twin-sample-report.txt";
  link.click();
  URL.revokeObjectURL(downloadUrl);
  showToast("Sample report downloaded.");
});

const astrodocForm = document.querySelector("#astrodoc-form");
const astrodocInput = document.querySelector("#astrodoc-input");
const astrodocMessage = document.querySelector("#astrodoc-message");

function getAstroDocResponse(question) {
  const normalized = question.toLowerCase();
  if (normalized.includes("how are you") || normalized.includes("how do you feel")) {
    return "I’m here and ready to listen. How are you feeling today? I can summarize the sample sleep, fluid-shift, or fatigue indicators, but I can’t diagnose or provide medical advice.";
  }
  if (normalized.includes("hello") || normalized.includes("hi aura") || normalized.includes("welcome")) {
    return `Welcome, ${crewIdInput.value.trim()}. I’m AURA. Tell me how you’re feeling, or ask about the sample health indicators.`;
  }
  if (normalized.includes("sleep") || normalized.includes("rest")) {
    return "The sample shows 3.2 hours of sleep debt. Consider reviewing the recovery plan with your crew medical officer. This is a demo response, not medical advice.";
  }
  if (normalized.includes("fluid") || normalized.includes("hydration")) {
    return "The illustrative forecast lists fluid shift as its leading driver. Check signal quality and review the trend with your crew medical officer; no diagnosis is made here.";
  }
  if (normalized.includes("risk") || normalized.includes("prepare") || normalized.includes("why")) {
    return "The sample PREPARE signal is driven by fluid shift, with sleep debt and voice fatigue as supporting indicators. Forecasts are uncertain and should be reviewed by a qualified professional.";
  }
  if (normalized.includes("health") || normalized.includes("vital") || normalized.includes("feel") || normalized.includes("tired") || normalized.includes("fatigue")) {
    return "This demo shows sample values of 68 BPM, 98.4% SpO₂, and 0.18 voice fatigue index. They are fictional and do not describe your health. If you feel unwell, contact your crew medical officer.";
  }
  return "I can summarize the sample sleep, fluid-shift, or risk indicators. This offline demo does not diagnose, and it cannot provide medical advice.";
}

function speakReply(text, force) {
  if (!("speechSynthesis" in window)) {
    voiceStatus.textContent = "Spoken replies are not supported by this browser.";
    return;
  }
  if (!force && !speakReplies.checked) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.onerror = () => {
    voiceStatus.textContent = "AURA could not play a spoken reply. You can still read the response on screen.";
  };
  window.speechSynthesis.speak(utterance);
}

function welcomeCrewMember() {
  const crewId = crewIdInput.value.trim();
  welcomeMessage = `Welcome, ${crewId}. How are you feeling today? You can start a voice check-in whenever you’re ready.`;
  voiceWelcome.textContent = `AURA: “${welcomeMessage}”`;
  voiceTranscript.textContent = "";
  voiceStatus.textContent = "AURA is welcoming you. Microphone is off.";
  speakReply(welcomeMessage, true);
}

function setListeningState(listening) {
  voiceStartButton.disabled = listening;
  voiceStopButton.hidden = !listening;
  voiceStatusPill.classList.toggle("listening", listening);
  voiceStatusPill.innerHTML = `<i></i> ${listening ? "LISTENING" : "MIC OFF"}`;
}

function startVoiceCheckIn() {
  if (!SpeechRecognitionAPI) {
    voiceStatus.textContent = "Voice input is not supported in this browser. You can still use the text assistant.";
    return;
  }
  if (recognition) return;

  const currentRecognition = new SpeechRecognitionAPI();
  let receivedSpeech = false;
  let stopRequested = false;
  let recognitionError = "";
  currentRecognition.lang = navigator.language || "en-US";
  currentRecognition.continuous = false;
  currentRecognition.interimResults = false;
  currentRecognition.maxAlternatives = 1;
  recognition = currentRecognition;
  voiceStatus.textContent = "Requesting microphone access…";

  currentRecognition.onstart = () => {
    setListeningState(true);
    voiceStatus.textContent = "Listening now. Tell AURA how you’re feeling.";
  };
  currentRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    if (!transcript || receivedSpeech) return;
    receivedSpeech = true;
    currentRecognition.stop();
    voiceTranscript.textContent = `You: “${transcript}”`;
    const reply = getAstroDocResponse(transcript);
    astrodocMessage.textContent = reply;
    voiceWelcome.textContent = `AURA: “${reply}”`;
    voiceStatus.textContent = "AURA replied. Microphone is off.";
    speakReply(reply, false);
  };
  currentRecognition.onerror = (event) => {
    const messages = {
      "not-allowed": "Microphone access was denied. Allow it in your browser settings to try again.",
      "service-not-allowed": "The browser’s speech service is unavailable or not permitted.",
      "no-speech": "No speech was detected. The microphone is off; try again when ready.",
      "audio-capture": "No microphone was found. Check your device and try again.",
      network: "The browser speech service could not be reached. The microphone is off."
    };
    recognitionError = messages[event.error] || "Voice input ended unexpectedly. The microphone is off.";
    voiceStatus.textContent = recognitionError;
  };
  currentRecognition.onend = () => {
    recognition = null;
    setListeningState(false);
    if (recognitionError) {
      voiceStatus.textContent = recognitionError;
    } else if (stopRequested && !receivedSpeech) {
      voiceStatus.textContent = "Voice check-in stopped. Microphone is off.";
    } else if (!receivedSpeech) {
      voiceStatus.textContent = "No speech was detected. The microphone is off; try again when ready.";
    } else {
      voiceStatus.textContent = "AURA replied. Microphone is off.";
    }
  };

  try {
    currentRecognition.start();
  } catch (error) {
    recognition = null;
    setListeningState(false);
    voiceStatus.textContent = error.name === "InvalidStateError"
      ? "Voice input is already active. Wait for it to finish before starting again."
      : "Could not start voice input. Check microphone permissions and try again.";
  }
}

function stopVoiceAssistant() {
  if (recognition) {
    recognition.stop();
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  voiceTranscript.textContent = "";
}

if (!SpeechRecognitionAPI) {
  voiceStartButton.disabled = true;
  voiceStatus.textContent = "This browser does not support voice input. You can still use the text assistant.";
} else {
  voiceStartButton.addEventListener("click", () => {
    if (voiceConsentAccepted) {
      startVoiceCheckIn();
    } else {
      voiceConsentDialog.showModal();
    }
  });
}

document.querySelector("#allow-voice-consent").addEventListener("click", () => {
  voiceConsentAccepted = true;
  voiceConsentDialog.close();
  startVoiceCheckIn();
});
document.querySelector("#cancel-voice-consent").addEventListener("click", () => voiceConsentDialog.close());
document.querySelector("#close-voice-consent").addEventListener("click", () => voiceConsentDialog.close());
voiceStopButton.addEventListener("click", () => {
  if (recognition) recognition.stop();
});
document.querySelector("#voice-repeat").addEventListener("click", () => {
  if (welcomeMessage) speakReply(welcomeMessage, true);
});

astrodocForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = astrodocInput.value.trim();
  if (!question) {
    astrodocInput.focus();
    return;
  }
  const reply = getAstroDocResponse(question);
  astrodocMessage.textContent = reply;
  voiceWelcome.textContent = `AURA: “${reply}”`;
  speakReply(reply, false);
  astrodocInput.value = "";
});

const aboutDialog = document.querySelector("#about-dialog");
document.querySelector("#about-button").addEventListener("click", () => aboutDialog.showModal());
document.querySelector("#close-about").addEventListener("click", () => aboutDialog.close());
document.querySelector("#done-about").addEventListener("click", () => aboutDialog.close());

const clock = document.querySelector("#clock");
function updateClock() {
  clock.textContent = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short"
  }).format(new Date());
}
updateClock();
window.setInterval(updateClock, 1000);
