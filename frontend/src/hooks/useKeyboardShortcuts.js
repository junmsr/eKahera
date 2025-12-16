import { useEffect, useMemo } from "react";

const isTextInput = (target) => {
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  const editable =
    target.isContentEditable ||
    ["input", "textarea", "select"].includes(tag) ||
    target.getAttribute?.("role") === "textbox";
  return editable;
};

// Check if a key is a special key that should work even when typing
const isSpecialKey = (event, normalizedKey) => {
  const key = event.key?.toLowerCase() || "";
  
  // Function keys (F1-F12)
  if (/^f\d+$/.test(normalizedKey)) return true;
  // Escape key
  if (normalizedKey === "escape" || key === "escape") return true;
  // Backtick key
  if (normalizedKey === "`" || key === "`" || key === "backquote") return true;
  // Modifier key combinations (Ctrl, Alt, Meta + any key)
  if (event.ctrlKey || event.altKey || event.metaKey) return true;
  // Arrow keys (check both event.key and normalized key)
  if (key.startsWith("arrow") || normalizedKey === "up" || normalizedKey === "down" || normalizedKey === "left" || normalizedKey === "right") return true;
  return false;
};

const normalizeKeyString = (key = "") =>
  key
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace("arrow", "")
    .replace("backquote", "`") // Normalize Backquote to backtick
    .replace(/^`$/, "`"); // Ensure backtick stays as backtick

const buildKey = (event) => {
  const parts = [];
  if (event.ctrlKey) parts.push("ctrl");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  const key = event.key?.toLowerCase();
  if (key) parts.push(key);
  return parts.join("+");
};

/**
 * useKeyboardShortcuts
 * Centralized keyboard shortcut handler with cleanup and enable/disable support.
 *
 * @param {Array} shortcuts [{ key: 'f1', action: fn, enabled: true, preventDefault: true, allowWhileTyping: false }]
 * @param {Array} deps extra dependencies to re-register listener
 */
/**
 * useKeyboardShortcuts - A hook to handle keyboard shortcuts with proper event handling
 * @param {Array} shortcuts - Array of shortcut configurations
 * @param {string} shortcuts[].key - The key or key combination (e.g., 'esc', 'ctrl+s')
 * @param {Function} shortcuts[].action - The function to execute when the shortcut is triggered
 * @param {boolean} [shortcuts[].enabled=true] - Whether the shortcut is enabled
 * @param {boolean} [shortcuts[].preventDefault=true] - Whether to prevent default browser behavior
 * @param {boolean} [shortcuts[].stopPropagation=true] - Whether to stop event propagation
 * @param {boolean} [shortcuts[].allowWhileTyping=false] - Whether to allow the shortcut while typing in an input field
 * @param {Array} deps - Dependencies to re-register the shortcuts
 */
export function useKeyboardShortcuts(shortcuts = [], deps = []) {
  const prepared = useMemo(
    () =>
      shortcuts
        .filter(Boolean)
        .map((s) => ({
          ...s,
          key: normalizeKeyString(s.key),
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(shortcuts)]
  );

  useEffect(() => {
    const handler = (event) => {
      const currentKey = normalizeKeyString(buildKey(event));
      // Find exact match - only compare the normalized key string, not event.key directly
      const match = prepared.find(
        (s) =>
          s.enabled !== false &&
          currentKey === s.key
      );
      if (!match) return;

      // Skip if typing in an input field and not explicitly allowed
      // BUT allow special keys (function keys, modifiers, escape) to always work
      const isSpecial = isSpecialKey(event, currentKey);
      if (isTextInput(event.target) && match.allowWhileTyping !== true && !isSpecial) {
        return;
      }

      // Prevent default behavior if not explicitly disabled
      // Always prevent default for special keys when matched
      if (match.preventDefault !== false || isSpecial) {
        event.preventDefault();
      }

      // Stop propagation by default to prevent conflicts with other handlers
      // This can be overridden by setting stopPropagation: false
      if (match.stopPropagation !== false) {
        event.stopPropagation();
      }

      // Execute the action if provided
      match.action?.(event);
    };

    // Use capture phase for better priority handling
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared, ...deps]);
}

export default useKeyboardShortcuts;

