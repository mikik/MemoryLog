// Detect if text starts with RTL characters (Hebrew, Arabic)
export const isRTL = (text) =>
  /^[\u0590-\u05FF\u0600-\u06FF\uFE70-\uFEFF]/.test(text?.trim());

// Get textAlign value based on content — use for TextInput style
export const getTextAlign = (text) => (isRTL(text) ? 'right' : 'left');
