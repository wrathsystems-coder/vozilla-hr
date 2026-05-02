// Hrvatski format helpers. CLAUDE.md "Hrvatski specifikum".

const PRICE_FORMATTER = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PRICE_FORMATTER_NO_DECIMALS = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number, options?: { decimals?: number }): string {
  const decimals = options?.decimals ?? 2;
  if (decimals === 0) return PRICE_FORMATTER_NO_DECIMALS.format(amount);
  return PRICE_FORMATTER.format(amount);
}

export function formatDate(input: Date | string, format: "short" | "long" = "short"): string {
  let date: Date;
  if (typeof input === "string") {
    // Parse YYYY-MM-DD without time as local-date to avoid timezone shift.
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
    if (dateOnly) {
      const [, y, m, d] = dateOnly;
      date = new Date(Number(y), Number(m) - 1, Number(d));
    } else {
      date = new Date(input);
    }
  } else {
    date = input;
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${String(input)}`);
  }

  if (format === "long") {
    return new Intl.DateTimeFormat("hr-HR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}.`;
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s()-]/g, "");
  let national: string;
  if (cleaned.startsWith("+385")) {
    national = cleaned.slice(4);
  } else if (cleaned.startsWith("00385")) {
    national = cleaned.slice(5);
  } else if (cleaned.startsWith("0")) {
    national = cleaned.slice(1);
  } else {
    national = cleaned;
  }

  if (!/^\d{8,9}$/.test(national)) return phone;

  const part1 = national.slice(0, 2);
  const part2 = national.slice(2, 5);
  const part3 = national.slice(5);
  return `+385 ${part1} ${part2} ${part3}`;
}

export function formatPostcode(postcode: string): string {
  const trimmed = postcode.trim();
  if (!/^\d{5}$/.test(trimmed)) {
    throw new Error(`Invalid HR postcode: ${postcode}`);
  }
  return trimmed;
}
