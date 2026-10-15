export class InvalidDzPhoneError extends Error {
  constructor(public readonly rawPhone: string) {
    super(
      `Invalid Algerian mobile phone number "${rawPhone}". Expected 05/06/07XXXXXXXX or +213[567]XXXXXXXX.`
    );
    this.name = "InvalidDzPhoneError";
  }
}

/**
 * Normalizes messy Algerian mobile phone inputs:
 * - "05 50 12 34 56" -> "0550123456" (local) or "+213550123456" (e164)
 * - "+213 (0) 661-23-45-67" -> "0661234567" (local) or "+213661234567" (e164)
 * - "00213770998877" -> "0770998877" (local) or "+213770998877" (e164)
 */
export function normalizeDzPhone(
  rawPhone: string,
  targetFormat: "local" | "e164" = "local"
): string {
  const digitsAndPlus = rawPhone.replace(/[^\d+]/g, "");

  let subscriber = digitsAndPlus;
  if (subscriber.startsWith("+213")) {
    subscriber = subscriber.slice(4);
  } else if (subscriber.startsWith("00213")) {
    subscriber = subscriber.slice(5);
  } else if (subscriber.startsWith("213") && subscriber.length >= 12) {
    subscriber = subscriber.slice(3);
  }

  // Strip optional trunk '0' (e.g., +2130550123456 or 0550123456)
  if (subscriber.startsWith("0")) {
    subscriber = subscriber.slice(1);
  }

  if (!/^[567]\d{8}$/.test(subscriber)) {
    throw new InvalidDzPhoneError(rawPhone);
  }

  return targetFormat === "e164" ? `+213${subscriber}` : `0${subscriber}`;
}
