/**
 * Owner accounts that may administer the app.
 *
 * Keep this list in sync with OWNER_EMAILS in firestore.rules: the rules decide
 * who may write admin-only collections, this module decides who sees the admin
 * UI and which role the app assigns on first sign-in.
 */
export const OWNER_EMAILS = ['abdelrhmanwaelbishr017@gmail.com'];

export const isOwnerEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return OWNER_EMAILS.includes(email.trim().toLowerCase());
};
