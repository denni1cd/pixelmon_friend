function validateSchema(schema, value, path = '$') {
  if (!schema || typeof schema !== 'object') {
    return [];
  }

  const errors = [];
  const type = schema.type;

  if (type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return [`${path} must be an object.`];
    }

    const properties = schema.properties || {};
    const required = schema.required || [];
    for (const key of required) {
      if (!(key in value)) {
        errors.push(`${path}.${key} is required.`);
      }
    }

    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) {
          errors.push(`${path}.${key} is not allowed.`);
        }
      }
    }

    for (const [key, propertySchema] of Object.entries(properties)) {
      if (!(key in value)) {
        continue;
      }

      errors.push(...validateSchema(propertySchema, value[key], `${path}.${key}`));
    }

    return errors;
  }

  if (type === 'array') {
    if (!Array.isArray(value)) {
      return [`${path} must be an array.`];
    }

    if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
      errors.push(`${path} must contain at least ${schema.minItems} items.`);
    }

    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateSchema(schema.items, item, `${path}[${index}]`));
      });
    }

    return errors;
  }

  if (type === 'integer') {
    if (!Number.isInteger(value)) {
      return [`${path} must be an integer.`];
    }

    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      errors.push(`${path} must be at least ${schema.minimum}.`);
    }

    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      errors.push(`${path} must be at most ${schema.maximum}.`);
    }

    return errors;
  }

  if (type === 'number') {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return [`${path} must be a number.`];
    }

    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      errors.push(`${path} must be at least ${schema.minimum}.`);
    }

    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      errors.push(`${path} must be at most ${schema.maximum}.`);
    }

    return errors;
  }

  if (type === 'string') {
    if (typeof value !== 'string') {
      return [`${path} must be a string.`];
    }

    if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
      errors.push(`${path} must be one of: ${schema.enum.join(', ')}.`);
    }

    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errors.push(`${path} must be at least ${schema.minLength} characters.`);
    }

    return errors;
  }

  if (type === 'boolean' && typeof value !== 'boolean') {
    return [`${path} must be a boolean.`];
  }

  return errors;
}

function validateToolArgs(schema, args) {
  return {
    ok: validateSchema(schema, args).length === 0,
    errors: validateSchema(schema, args)
  };
}

module.exports = {
  validateSchema,
  validateToolArgs
};
