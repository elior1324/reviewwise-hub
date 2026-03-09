// Common leaked/weak passwords list
const COMMON_PASSWORDS = new Set([
  "123456", "password", "123456789", "12345678", "12345", "1234567",
  "1234567890", "qwerty", "abc123", "111111", "123123", "admin",
  "letmein", "welcome", "monkey", "master", "dragon", "login",
  "princess", "football", "shadow", "sunshine", "trustno1",
  "iloveyou", "batman", "access", "hello", "charlie", "donald",
  "password1", "qwerty123", "654321", "555555", "lovely", "michael",
  "!@#$%^&*", "aa123456", "password123", "000000", "121212",
  "666666", "qwertyuiop", "1q2w3e4r", "987654321", "superman",
  "1qaz2wsx", "abcdef", "abcd1234", "passw0rd", "p@ssword",
]);

export interface PasswordValidationResult {
  valid: boolean;
  message: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  if (password.length < 8) {
    return { valid: false, message: "הסיסמה חייבת להכיל לפחות 8 תווים" };
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, message: "הסיסמה נפוצה מדי ואינה מאובטחת — בחרו סיסמה חזקה יותר" };
  }

  if (/^(.)\1+$/.test(password)) {
    return { valid: false, message: "הסיסמה לא יכולה להכיל תו חוזר בלבד" };
  }

  if (/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i.test(password)) {
    return { valid: false, message: "הסיסמה לא יכולה להיות רצף פשוט של תווים" };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: "הסיסמה חייבת להכיל לפחות אות אחת ומספר אחד" };
  }

  return { valid: true, message: "" };
}
