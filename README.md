# AURA-TWIN

AURA-TWIN is a simulated, privacy-first astronaut health intelligence dashboard. It presents illustrative telemetry, explainable 72-hour risk projections, a counterfactual scenario simulator, an SBAR handoff, and a local AstroDoc demo.

## Run locally

Open `index.html` in a browser. The app is static and has no build step or runtime dependencies. The demo sign-in accepts any non-empty passcode; it does not authenticate users or send credentials to a server. Only the Crew ID is saved in browser storage. AURA speaks a greeting after sign-in. Voice input is off until the user starts a check-in and confirms the notice; browser speech recognition may process live microphone audio with its provider. This demo does not save audio or transcripts. The dashboard uses fictional health values, does not connect to biometric sensors, and does not provide medical advice.

## Deploy

The project can be deployed as a static site from the repository root on Vercel. No build command or output directory is required.

Live preview: https://aura-twin-olive.vercel.app
