// src/utils/templateUtils.js
// Client-side mirror of the backend's variable substitution logic (routes/templates.js),
// used for instant preview without a network round-trip.

export const extractVariableNames = (content = '') => {
  const matches = [...content.matchAll(/{{\s*([\w.]+)\s*}}/g)];
  return [...new Set(matches.map(m => m[1]))];
};

// Returns [{ text, isVariable, resolved, name }] so callers can highlight substitutions distinctly.
export const renderTemplateSegments = (content = '', values = {}) => {
  const segments = [];
  const regex = /{{\s*([\w.]+)\s*}}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: content.slice(lastIndex, match.index), isVariable: false });
    }
    const name = match[1];
    const hasValue = values[name] !== undefined && values[name] !== '';
    segments.push({
      text: hasValue ? String(values[name]) : `{{${name}}}`,
      isVariable: true,
      resolved: hasValue,
      name,
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ text: content.slice(lastIndex), isVariable: false });
  }

  return segments;
};

export const renderTemplateText = (content = '', values = {}) =>
  renderTemplateSegments(content, values).map(s => s.text).join('');
