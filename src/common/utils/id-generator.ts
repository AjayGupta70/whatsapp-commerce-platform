import { randomBytes } from 'crypto';

/**
 * Generates a collision-resistant, URL-safe random ID with a prefix.
 * Similar to how Stripe and other modern SaaS platforms generate IDs.
 * 
 * @param prefix The prefix for the ID (e.g., 'COMP', 'USR', 'ORD')
 * @param length The length of the random part of the ID (default 8)
 * @returns A formatted ID string (e.g., 'COMP_a1B2c3D4')
 */
export function generateId(prefix: string, length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return `${prefix}_${result}`;
}
