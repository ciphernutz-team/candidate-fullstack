// NOTE (Issue 6): This module previously monkey-patched Array.prototype.filter
// at load time to randomly return `null` for empty results. That globally
// corrupted every `.filter()` in the app and its libraries (notably react-router's
// route resolution), so downstream `.map`/`.length` calls intermittently threw and
// the app fell behind the "Legacy System Fault" ErrorBoundary on normal navigation.
// The patch has been removed. legacyInit() is retained as a harmless no-op so the
// existing import in main.tsx stays valid.

export const legacyInit = () => {
  console.log("Legacy System Initialized...");
};
