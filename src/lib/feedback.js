// Confirmation sound for a saved entry.
//
// The chime is a bundled 400ms WAV (see assets/sounds/README.md), not a system
// sound: iOS and Android disagree about what their built-in "success" tone is,
// and half the time it is the one the OS uses for something else entirely.
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Quieter than the file's own peak. This is a confirmation, not an alert — it
// should sit under the toast rather than announce itself.
const VOLUME = 0.6;

let player = null;
let configured = false;

function ensurePlayer() {
  if (player) return player;
  // Built once and reused: re-creating it per save would re-decode the file on
  // every submit and leak a player each time, since createAudioPlayer hands
  // back something that is never released on its own.
  player = createAudioPlayer(require('../../assets/sounds/success.mp3'));
  player.volume = VOLUME;
  return player;
}

/**
 * Plays the success chime. Fire-and-forget: a failure here must never take down
 * the save that triggered it, so everything is swallowed.
 */
export function playSuccess() {
  try {
    if (!configured) {
      configured = true;
      // playsInSilentMode:false — a UI confirmation has no business overriding
      // the ringer switch; on Android this also suppresses it on vibrate.
      // mixWithOthers — never duck or stop whatever the user is listening to.
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' })
        .catch(() => {});
    }

    const p = ensurePlayer();
    // The previous play left the position at the end of the clip, so `play()`
    // alone would be a no-op on the second save. Rewind first.
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {
    // No audio route, codec refused, web autoplay blocked — the toast already
    // carries the message, so silence is an acceptable degradation.
  }
}
