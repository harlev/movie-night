export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password must be at most 128 characters' };
  }
  return { valid: true };
}

export function isValidDisplayName(name: string): { valid: boolean; error?: string } {
  if (name.length < 2) {
    return { valid: false, error: 'Display name must be at least 2 characters' };
  }
  if (name.length > 50) {
    return { valid: false, error: 'Display name must be at most 50 characters' };
  }
  if (!/^[a-zA-Z0-9_\- ]+$/.test(name)) {
    return {
      valid: false,
      error: 'Display name can only contain letters, numbers, spaces, underscores, and hyphens'
    };
  }
  return { valid: true };
}

export function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
