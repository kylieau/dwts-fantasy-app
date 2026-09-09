// Custom URL scheme Google/Supabase redirect back to once native OAuth
// finishes in the system browser. Must match the CFBundleURLSchemes entry
// added to ios/App/App/Info.plist and the Supabase Auth redirect allowlist.
export const NATIVE_AUTH_SCHEME = "com.kylieau.mirrorballmadness";
export const NATIVE_AUTH_CALLBACK_URL = `${NATIVE_AUTH_SCHEME}://auth/callback`;
