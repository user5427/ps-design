export interface PasswordStrengthResult {
  isValid: boolean;
  score: 0 | 1 | 2 | 3;
  feedback: string[];
}

/**
 * Validates password strength based on criteria:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one special character
 *
 * Score:
 * 0 (Red) - Does not meet requirements
 * 1 (Yellow) - Meets basic requirements
 * 2 (Green) - Good password
 * 3 (Lime Green) - Excellent password
 */
export function checkPasswordStrength(
  password: string,
): PasswordStrengthResult {
  const feedback: string[] = [];
  let score: 0 | 1 | 2 | 3 = 0;
  let metRequirements = 0;

  // Check minimum length
  if (password.length < 8) {
    feedback.push("Password must be at least 8 characters");
  } else {
    metRequirements++;
  }

  // Check for uppercase
  if (!/[A-Z]/.test(password)) {
    feedback.push("Password must contain at least one uppercase letter");
  } else {
    metRequirements++;
  }

  // Check for lowercase
  if (!/[a-z]/.test(password)) {
    feedback.push("Password must contain at least one lowercase letter");
  } else {
    metRequirements++;
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    feedback.push(
      "Password must contain at least one special character (!@#$%^&* etc.)",
    );
  } else {
    metRequirements++;
  }

  // Calculate score based on met requirements
  if (metRequirements === 4) {
    // All requirements met, check for extra strength
    if (password.length >= 12) {
      score = 3; // Lime green - excellent
    } else if (password.length >= 10) {
      score = 2; // Green - good
    } else {
      score = 1; // Yellow - meets requirements
    }
  } else if (metRequirements >= 3) {
    score = 1; // Yellow - mostly meets requirements
  } else {
    score = 0; // Red - does not meet requirements
  }

  return {
    isValid: score > 0 && feedback.length === 0,
    score,
    feedback,
  };
}

/**
 * Get color for password strength score
 */
export function getPasswordStrengthColor(score: 0 | 1 | 2 | 3): string {
  switch (score) {
    case 0:
      return "#d32f2f"; // Red
    case 1:
      return "#f57c00"; // Orange/Yellow
    case 2:
      return "#388e3c"; // Green
    case 3:
      return "#7cb342"; // Lime green
    default:
      return "#999"; // Gray
  }
}

/**
 * Get label for password strength score
 */
export function getPasswordStrengthLabel(score: 0 | 1 | 2 | 3): string {
  switch (score) {
    case 0:
      return "Weak";
    case 1:
      return "Fair";
    case 2:
      return "Good";
    case 3:
      return "Strong";
    default:
      return "Unknown";
  }
}
