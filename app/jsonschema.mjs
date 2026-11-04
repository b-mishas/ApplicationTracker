// Minimal JSON Schema validator (the subset batch.schema.json uses). No dependencies.
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const typeOk = (t, v) => t === 'null' ? v === null : t === 'array' ? Array.isArray(v) : t === 'object' ? isObj(v) : t === 'integer' ? Number.isInteger(v) : t === 'number' ? typeof v === 'number' && Number.isFinite(v) : typeof v === t;
const formats = {
  'date-time-utc': v => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(v) && !Number.isNaN(Date.parse(v)),
  'http-url': v => { try { const u = new URL(v); return ['http:', 'https:'].includes(u.protocol) && !!u.hostname; } catch { return false; } }
};
export function validate(schema, value, root = schema, at = '$', errors = []) {
  if (schema.$ref) { const target = schema.$ref.replace(/^#\//, '').split('/').reduce((o, k) => o?.[k], root); if (!target) { errors.push(`${at}: unresolved schema reference ${schema.$ref}`); return errors; } return validate(target, value, root, at, errors); }
  if (schema.const !== undefined && value !== schema.const) errors.push(`${at}: must be ${JSON.stringify(schema.const)}`);
  if (schema.type) { const types = [].concat(schema.type); if (!types.some(t => typeOk(t, value))) { errors.push(`${at}: must be ${types.join(' or ')}`); return errors; } }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${at}: must be one of ${schema.enum.map(v => JSON.stringify(v)).join(', ')} (got ${JSON.stringify(value)})`);
  if (typeof value === 'string') {
    if (schema.minLength && value.trim().length < schema.minLength) errors.push(`${at}: must not be empty`);
    if (schema.maxLength && value.length > schema.maxLength) errors.push(`${at}: longer than ${schema.maxLength} characters`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${at}: does not match ${schema.pattern}`);
    if (schema.format && formats[schema.format] && !formats[schema.format](value)) errors.push(`${at}: invalid ${schema.format} (${JSON.stringify(value.slice(0, 60))})`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${at}: must be >= ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${at}: must be <= ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems && value.length < schema.minItems) errors.push(`${at}: needs at least ${schema.minItems} item(s)`);
    if (schema.maxItems && value.length > schema.maxItems) errors.push(`${at}: at most ${schema.maxItems} items`);
    if (schema.uniqueItems && new Set(value.map(v => JSON.stringify(v))).size !== value.length) errors.push(`${at}: items must be unique`);
    if (schema.items) value.forEach((v, i) => validate(schema.items, v, root, `${at}[${i}]`, errors));
  }
  if (isObj(value)) {
    for (const k of schema.required || []) if (!(k in value)) errors.push(`${at}: missing required field "${k}"`);
    for (const [k, v] of Object.entries(value)) {
      if (schema.properties?.[k]) validate(schema.properties[k], v, root, `${at}.${k}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${at}: unexpected field "${k}"${schema.$comment_forbidden?.includes(k) ? ' (user-owned, not allowed in discovery batches)' : ''}`);
      else if (isObj(schema.additionalProperties)) validate(schema.additionalProperties, v, root, `${at}.${k}`, errors);
    }
  }
  return errors;
}
