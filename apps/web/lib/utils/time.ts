// Mockable time wrapper. CLAUDE.md "ne koristi Date.now() / new Date() direktno za business logiku".
// Tests can vi.spyOn(time, "now") to control time.

export function now(): Date {
  return new Date();
}

export function nowMs(): number {
  return now().getTime();
}
