export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.getRandomValues(new Uint8Array(8));
  const randomStr = Array.from(randomPart)
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 12);
  return `${timestamp}${randomStr}`;
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}
