// Croatian OIB validation using ISO 7064 MOD 11-10 checksum.
// Reference: https://www.regos.hr/oib

export function validateOIB(input: string): boolean {
  const digits = input.trim();
  if (!/^\d{11}$/.test(digits)) return false;

  let remainder = 10;
  for (let i = 0; i < 10; i++) {
    remainder += Number(digits[i]);
    remainder %= 10;
    if (remainder === 0) remainder = 10;
    remainder *= 2;
    remainder %= 11;
  }

  const checksum = (11 - remainder) % 10;
  return checksum === Number(digits[10]);
}
