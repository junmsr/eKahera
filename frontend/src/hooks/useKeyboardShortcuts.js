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

const normalizeKeyString = (key = "") =>
  key
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace("arrow", "");

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
      const match = prepared.find(
        (s) =>
          s.enabled !== false &&
          (currentKey === s.key || event.key?.toLowerCase() === s.key)
      );
      if (!match) return;

      // Skip if typing in an input field and not explicitly allowed
      if (isTextInput(event.target) && match.allowWhileTyping !== true) {
        return;
      }

      // Prevent default behavior if not explicitly disabled
      if (match.preventDefault !== false) {
        event.preventDefault();
      }

      // Only stop propagation if explicitly requested
      // This allows other handlers in the modal to still work
      if (match.stopPropagation === true) {
        event.stopPropagation();
        event.stopImmediatePropagation();
      }

      // Execute the action if provided
      match.action?.(event);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepared, ...deps]);
}

export default useKeyboardShortcuts;

