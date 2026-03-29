function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, cloneValue(nested)])
    );
  }

  return value;
}

function validateType(expectedType, value) {
  if (expectedType === 'integer') {
    return Number.isInteger(value);
  }

  if (expectedType === 'number') {
    return Number.isFinite(value);
  }

  if (expectedType === 'boolean') {
    return typeof value === 'boolean';
  }

  if (expectedType === 'string') {
    return typeof value === 'string';
  }

  if (expectedType === 'array') {
    return Array.isArray(value);
  }

  if (expectedType === 'object') {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  return true;
}

function validateArray(schema, value, path) {
  if (!Array.isArray(value)) {
    return { ok: false, reason: 'invalid_type', path, expected: 'array' };
  }

  if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
    return { ok: false, reason: 'too_small', path, minimum: schema.minItems };
  }

  if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
    return { ok: false, reason: 'too_large', path, maximum: schema.maxItems };
  }

  if (!schema.items) {
    return { ok: true, value: cloneValue(value) };
  }

  const normalized = [];
  for (let index = 0; index < value.length; index += 1) {
    const itemResult = validateSchemaValue(schema.items, value[index], `${path}[${index}]`);
    if (!itemResult.ok) {
      return itemResult;
    }
    normalized.push(itemResult.value);
  }

  return { ok: true, value: normalized };
}

function validateObject(schema, value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, reason: 'invalid_type', path, expected: 'object' };
  }

  const properties = schema.properties || {};
  const required = new Set(schema.required || []);
  const normalized = {};

  for (const key of Object.keys(value)) {
    if (!properties[key]) {
      return { ok: false, reason: 'unsupported_property', path: `${path}.${key}` };
    }
  }

  for (const [key, propertySchema] of Object.entries(properties)) {
    const hasValue = Object.prototype.hasOwnProperty.call(value, key);
    if (!hasValue) {
      if (Object.prototype.hasOwnProperty.call(propertySchema, 'default')) {
        normalized[key] = cloneValue(propertySchema.default);
        continue;
      }

      if (required.has(key)) {
        return { ok: false, reason: 'missing_property', path: `${path}.${key}` };
      }

      continue;
    }

    const propertyResult = validateSchemaValue(propertySchema, value[key], `${path}.${key}`);
    if (!propertyResult.ok) {
      return propertyResult;
    }

    normalized[key] = propertyResult.value;
  }

  return { ok: true, value: normalized };
}

function validateScalar(schema, value, path) {
  if (schema.type && !validateType(schema.type, value)) {
    return {
      ok: false,
      reason: 'invalid_type',
      path,
      expected: schema.type
    };
  }

  if (schema.enum && !schema.enum.includes(value)) {
    return {
      ok: false,
      reason: 'invalid_enum',
      path,
      expected: cloneValue(schema.enum)
    };
  }

  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      return { ok: false, reason: 'too_small', path, minimum: schema.minimum };
    }

    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      return { ok: false, reason: 'too_large', path, maximum: schema.maximum };
    }
  }

  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      return { ok: false, reason: 'too_short', path, minimum: schema.minLength };
    }

    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
      return { ok: false, reason: 'too_long', path, maximum: schema.maxLength };
    }
  }

  return { ok: true, value: cloneValue(value) };
}

function validateSchemaValue(schema, value, path = '$') {
  if (!schema || typeof schema !== 'object') {
    return { ok: true, value: cloneValue(value) };
  }

  if (value === undefined || value === null) {
    if (Object.prototype.hasOwnProperty.call(schema, 'default')) {
      return { ok: true, value: cloneValue(schema.default) };
    }

    return { ok: true, value };
  }

  if (schema.type === 'object') {
    return validateObject(schema, value, path);
  }

  if (schema.type === 'array') {
    return validateArray(schema, value, path);
  }

  return validateScalar(schema, value, path);
}

function formatSchemaError(error) {
  const path = error.path || '$';

  switch (error.reason) {
    case 'missing_property':
      return `Missing required field ${path}.`;
    case 'unsupported_property':
      return `Unsupported field ${path}.`;
    case 'invalid_type':
      return `Invalid value for ${path}; expected ${error.expected}.`;
    case 'invalid_enum':
      return `Invalid option for ${path}.`;
    case 'too_small':
      return `Value for ${path} is below the minimum.`;
    case 'too_large':
      return `Value for ${path} is above the maximum.`;
    case 'too_short':
      return `Value for ${path} is too short.`;
    case 'too_long':
      return `Value for ${path} is too long.`;
    default:
      return `Invalid arguments at ${path}.`;
  }
}

module.exports = {
  formatSchemaError,
  validateSchemaValue
};
