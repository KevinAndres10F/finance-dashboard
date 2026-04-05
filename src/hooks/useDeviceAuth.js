import { useState, useEffect } from 'react';

const CREDENTIAL_KEY = 'finance-auth-credential';
const SESSION_KEY    = 'finance-auth-unlocked';
const SETUP_KEY      = 'finance-auth-setup';

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function randomChallenge() {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function useDeviceAuth() {
  const isSetupDone   = !!localStorage.getItem(SETUP_KEY);
  const isSessionOpen = !!sessionStorage.getItem(SESSION_KEY);

  const [status, setStatus] = useState(
    isSetupDone
      ? isSessionOpen ? 'unlocked' : 'locked'
      : 'setup-required'
  );
  const [error, setError] = useState(null);

  const supportsWebAuthn = typeof PublicKeyCredential !== 'undefined';

  // ── Setup: register a platform biometric credential ───────────────────
  async function setupBiometric() {
    if (!supportsWebAuthn) {
      setupFallbackPin();
      return;
    }
    try {
      setError(null);
      const userId = crypto.getRandomValues(new Uint8Array(16));
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: randomChallenge(),
          rp: { name: 'Finanzas Personal', id: window.location.hostname },
          user: { id: userId, name: 'usuario', displayName: 'Usuario' },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },   // ES256
            { alg: -257, type: 'public-key' },  // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
        },
      });
      localStorage.setItem(CREDENTIAL_KEY, bufferToBase64(credential.rawId));
      localStorage.setItem(SETUP_KEY, 'webauthn');
      sessionStorage.setItem(SESSION_KEY, 'true');
      setStatus('unlocked');
    } catch (err) {
      setError(err.message || 'Error al configurar biometría');
    }
  }

  // ── Verify: assert existing credential ────────────────────────────────
  async function unlock() {
    if (!supportsWebAuthn) {
      unlockWithPin();
      return;
    }
    const rawId = localStorage.getItem(CREDENTIAL_KEY);
    if (!rawId) { setStatus('setup-required'); return; }
    try {
      setError(null);
      await navigator.credentials.get({
        publicKey: {
          challenge: randomChallenge(),
          allowCredentials: [{
            id: base64ToBuffer(rawId),
            type: 'public-key',
            transports: ['internal'],
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      });
      sessionStorage.setItem(SESSION_KEY, 'true');
      setStatus('unlocked');
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Autenticación cancelada o no permitida');
      } else {
        setError(err.message || 'Error de verificación');
      }
    }
  }

  // ── Fallback: 6-digit PIN (when WebAuthn unavailable) ─────────────────
  function setupFallbackPin(pin) {
    if (!pin || pin.length < 4) { setError('PIN debe tener al menos 4 dígitos'); return; }
    // Store a simple hash (SHA-256 via Web Crypto)
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin)).then(hash => {
      localStorage.setItem(CREDENTIAL_KEY, bufferToBase64(hash));
      localStorage.setItem(SETUP_KEY, 'pin');
      sessionStorage.setItem(SESSION_KEY, 'true');
      setStatus('unlocked');
    });
  }

  function unlockWithPin(pin) {
    if (!pin) return;
    const stored = localStorage.getItem(CREDENTIAL_KEY);
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin)).then(hash => {
      if (bufferToBase64(hash) === stored) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        setStatus('unlocked');
      } else {
        setError('PIN incorrecto');
      }
    });
  }

  // ── Lock app manually ─────────────────────────────────────────────────
  function lock() {
    sessionStorage.removeItem(SESSION_KEY);
    setStatus('locked');
  }

  // ── Reset (forget credentials) ────────────────────────────────────────
  function resetAuth() {
    localStorage.removeItem(CREDENTIAL_KEY);
    localStorage.removeItem(SETUP_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setStatus('setup-required');
    setError(null);
  }

  const authType = localStorage.getItem(SETUP_KEY) || null; // 'webauthn' | 'pin' | null

  return {
    status,           // 'setup-required' | 'locked' | 'unlocked'
    error,
    authType,
    supportsWebAuthn,
    setupBiometric,
    setupFallbackPin,
    unlock,
    unlockWithPin,
    lock,
    resetAuth,
  };
}
