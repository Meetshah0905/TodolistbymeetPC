// Cloud sync settings. Fill these in after creating your free Supabase project
// (see DEPLOY_GUIDE.md, step 2). Both values are public by design: the database is
// protected by the row-level security rules in supabase/schema.sql, not by hiding the key.
//
// Leave them empty and the app still works fully offline/on-device; the account
// screen will then only offer backup download/restore.
window.FL_SUPABASE = {
  url: '',      // e.g. 'https://abcdefghijklm.supabase.co'
  anonKey: '',  // Project Settings -> API -> "anon public" key
  // Sign-in methods to show. Google needs the Google provider enabled in Supabase.
  enableGoogle: true,
  enableEmail: true,
  enableUsername: true
};
