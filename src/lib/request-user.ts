export const DEMO_USER_ID = 'public-guest';

export function getCurrentUserId(_request: Request): string {
  return DEMO_USER_ID;
}
