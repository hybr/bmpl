/**
 * Form Generator Utility
 * Dynamically generates forms from process variable schemas
 */

/**
 * Generate form fields from process definition variables
 * @param {object} variablesSchema - Process variables schema
 * @param {object} initialValues - Initial field values
 * @returns {HTMLElement} Form element
 */
export function generateForm(variablesSchema, initialValues = {}) {
  const form = document.createElement('form');
  form.className = 'generated-form';

  // Generate field for each variable
  Object.keys(variablesSchema).forEach(fieldName => {
    const fieldSchema = variablesSchema[fieldName];
    const fieldValue = initialValues[fieldName] || fieldSchema.default;

    const fieldGroup = createFieldGroup(fieldName, fieldSchema, fieldValue);
    form.appendChild(fieldGroup);
  });

  return form;
}

/**
 * Create a field group (label + input + error)
 * @param {string} fieldName - Field name
 * @param {object} fieldSchema - Field schema
 * @param {any} value - Initial value
 * @returns {HTMLElement} Field group element
 */
function createFieldGroup(fieldName, fieldSchema, value) {
  const group = document.createElement('div');
  group.className = 'form-group';
  group.dataset.field = fieldName;

  // Create label
  const label = document.createElement('label');
  label.setAttribute('for', fieldName);
  label.textContent = formatLabel(fieldName);
  if (fieldSchema.required) {
    const required = document.createElement('span');
    required.className = 'required';
    required.textContent = ' *';
    required.style.color = 'red';
    label.appendChild(required);
  }
  group.appendChild(label);

  // Create input based on field type
  const input = createInput(fieldName, fieldSchema, value);
  group.appendChild(input);

  // Create error message container
  const error = document.createElement('div');
  error.className = 'form-error hidden';
  error.id = `${fieldName}-error`;
  group.appendChild(error);

  // Create help text if provided
  if (fieldSchema.description) {
    const help = document.createElement('small');
    help.className = 'form-help';
    help.textContent = fieldSchema.description;
    group.appendChild(help);
  }

  return group;
}

/**
 * Create input element based on field type
 * @param {string} fieldName - Field name
 * @param {object} fieldSchema - Field schema
 * @param {any} value - Initial value
 * @returns {HTMLElement} Input element
 */
function createInput(fieldName, fieldSchema, value) {
  const type = fieldSchema.type;

  switch (type) {
    case 'string':
      return createStringInput(fieldName, fieldSchema, value);

    case 'number':
      return createNumberInput(fieldName, fieldSchema, value);

    case 'boolean':
      return createBooleanInput(fieldName, fieldSchema, value);

    case 'date':
      return createDateInput(fieldName, fieldSchema, value);

    case 'array':
      return createArrayInput(fieldName, fieldSchema, value);

    case 'object':
      return createObjectInput(fieldName, fieldSchema, value);

    default:
      return createStringInput(fieldName, fieldSchema, value);
  }
}

/**
 * Create string input (text, textarea, select)
 */
function createStringInput(fieldName, fieldSchema, value) {
  // If enum values provided, create select
  if (fieldSchema.enum && fieldSchema.enum.length > 0) {
    return createSelectInput(fieldName, fieldSchema, value);
  }

  // If multiline, create textarea
  if (fieldSchema.multiline) {
    const textarea = document.createElement('ion-textarea');
    textarea.setAttribute('name', fieldName);
    textarea.setAttribute('id', fieldName);
    textarea.setAttribute('rows', fieldSchema.rows || 4);
    if (value) textarea.value = value;
    if (fieldSchema.placeholder) textarea.setAttribute('placeholder', fieldSchema.placeholder);
    if (fieldSchema.required) textarea.setAttribute('required', '');
    if (fieldSchema.maxLength) textarea.setAttribute('maxlength', fieldSchema.maxLength);
    return textarea;
  }

  // Default text input
  const input = document.createElement('ion-input');
  input.setAttribute('name', fieldName);
  input.setAttribute('id', fieldName);
  input.setAttribute('type', 'text');
  if (value) input.value = value;
  if (fieldSchema.placeholder) input.setAttribute('placeholder', fieldSchema.placeholder);
  if (fieldSchema.required) input.setAttribute('required', '');
  if (fieldSchema.pattern) input.setAttribute('pattern', fieldSchema.pattern);
  if (fieldSchema.minLength) input.setAttribute('minlength', fieldSchema.minLength);
  if (fieldSchema.maxLength) input.setAttribute('maxlength', fieldSchema.maxLength);

  return input;
}

/**
 * Create number input
 */
function createNumberInput(fieldName, fieldSchema, value) {
  const input = document.createElement('ion-input');
  input.setAttribute('name', fieldName);
  input.setAttribute('id', fieldName);
  input.setAttribute('type', 'number');
  if (value !== undefined && value !== null) input.value = value;
  if (fieldSchema.placeholder) input.setAttribute('placeholder', fieldSchema.placeholder);
  if (fieldSchema.required) input.setAttribute('required', '');
  if (fieldSchema.min !== undefined) input.setAttribute('min', fieldSchema.min);
  if (fieldSchema.max !== undefined) input.setAttribute('max', fieldSchema.max);
  if (fieldSchema.step) input.setAttribute('step', fieldSchema.step);

  return input;
}

/**
 * Create boolean input (toggle/checkbox)
 */
function createBooleanInput(fieldName, fieldSchema, value) {
  const toggle = document.createElement('ion-toggle');
  toggle.setAttribute('name', fieldName);
  toggle.setAttribute('id', fieldName);
  if (value === true) toggle.setAttribute('checked', '');

  const label = document.createElement('ion-label');
  label.textContent = fieldSchema.toggleLabel || 'Enabled';

  const item = document.createElement('ion-item');
  item.appendChild(label);
  item.appendChild(toggle);

  return item;
}

/**
 * Create date input
 */
function createDateInput(fieldName, fieldSchema, value) {
  const datetime = document.createElement('ion-datetime');
  datetime.setAttribute('name', fieldName);
  datetime.setAttribute('id', fieldName);
  if (value) datetime.value = value;
  if (fieldSchema.min) datetime.setAttribute('min', fieldSchema.min);
  if (fieldSchema.max) datetime.setAttribute('max', fieldSchema.max);
  if (fieldSchema.displayFormat) datetime.setAttribute('display-format', fieldSchema.displayFormat);

  return datetime;
}

/**
 * Create select input
 */
function createSelectInput(fieldName, fieldSchema, value) {
  const select = document.createElement('ion-select');
  select.setAttribute('name', fieldName);
  select.setAttribute('id', fieldName);
  if (value) select.value = value;
  if (fieldSchema.placeholder) select.setAttribute('placeholder', fieldSchema.placeholder);
  if (fieldSchema.required) select.setAttribute('required', '');

  // Add options
  fieldSchema.enum.forEach(option => {
    const optionEl = document.createElement('ion-select-option');
    optionEl.setAttribute('value', option);
    optionEl.textContent = formatOptionLabel(option);
    select.appendChild(optionEl);
  });

  return select;
}

/**
 * Create array input (list of items)
 */
function createArrayInput(fieldName, fieldSchema, value) {
  const container = document.createElement('div');
  container.className = 'array-input-container';
  container.id = `${fieldName}-container`;

  // Create list to hold items
  const list = document.createElement('ion-list');
  list.id = `${fieldName}-list`;

  // Add existing items
  const items = value || [];
  items.forEach((item, index) => {
    const itemEl = createArrayItem(fieldName, index, item, fieldSchema.items);
    list.appendChild(itemEl);
  });

  container.appendChild(list);

  // Add button to add new items
  const addButton = document.createElement('ion-button');
  addButton.setAttribute('fill', 'outline');
  addButton.setAttribute('size', 'small');
  addButton.textContent = `Add ${formatLabel(fieldName)}`;
  addButton.onclick = () => {
    const index = list.children.length;
    const itemEl = createArrayItem(fieldName, index, null, fieldSchema.items);
    list.appendChild(itemEl);
  };

  container.appendChild(addButton);

  return container;
}

/**
 * Create array item element
 */
function createArrayItem(fieldName, index, value, itemSchema) {
  const item = document.createElement('ion-item');

  const input = document.createElement('ion-input');
  input.setAttribute('name', `${fieldName}[${index}]`);
  input.setAttribute('type', 'text');
  if (value) input.value = value;

  const removeButton = document.createElement('ion-button');
  removeButton.setAttribute('slot', 'end');
  removeButton.setAttribute('fill', 'clear');
  removeButton.setAttribute('color', 'danger');
  removeButton.setAttribute('size', 'small');

  const icon = document.createElement('ion-icon');
  icon.setAttribute('name', 'trash');
  removeButton.appendChild(icon);

  removeButton.onclick = () => {
    item.remove();
  };

  item.appendChild(input);
  item.appendChild(removeButton);

  return item;
}

/**
 * Create object input (nested fields)
 */
function createObjectInput(fieldName, fieldSchema, value) {
  const container = document.createElement('div');
  container.className = 'object-input-container';

  // Create nested form
  if (fieldSchema.properties) {
    const nestedForm = generateForm(fieldSchema.properties, value || {});
    nestedForm.className = 'nested-form';
    container.appendChild(nestedForm);
  } else {
    // Fallback to JSON textarea
    const textarea = document.createElement('ion-textarea');
    textarea.setAttribute('name', fieldName);
    textarea.setAttribute('id', fieldName);
    textarea.setAttribute('placeholder', 'Enter JSON object');
    textarea.setAttribute('rows', 4);
    if (value) textarea.value = JSON.stringify(value, null, 2);
    container.appendChild(textarea);
  }

  return container;
}

/**
 * Format field name to label
 */
function formatLabel(fieldName) {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capitals
    .replace(/[_-]/g, ' ') // Replace underscores and dashes with spaces
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format option value to label
 */
function formatOptionLabel(value) {
  return String(value)
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get form values
 * @param {HTMLElement} form - Form element
 * @returns {object} Form values
 */
export function getFormValues(form) {
  const formData = new FormData(form);
  const values = {};

  // Get simple values
  for (const [key, value] of formData.entries()) {
    // Handle array notation
    if (key.includes('[')) {
      const match = key.match(/^(.+?)\[(\d+)\]$/);
      if (match) {
        const [, fieldName, index] = match;
        if (!values[fieldName]) values[fieldName] = [];
        values[fieldName][parseInt(index)] = value;
      }
    } else {
      values[key] = value;
    }
  }

  // Handle toggles and checkboxes
  form.querySelectorAll('ion-toggle').forEach(toggle => {
    const name = toggle.getAttribute('name');
    if (name) {
      values[name] = toggle.hasAttribute('checked') || toggle.checked;
    }
  });

  return values;
}

/**
 * Validate form
 * @param {HTMLElement} form - Form element
 * @param {object} schema - Variable schema
 * @returns {object} Validation result { valid: boolean, errors: {} }
 */
export function validateForm(form, schema) {
  const values = getFormValues(form);
  const errors = {};
  let valid = true;

  Object.keys(schema).forEach(fieldName => {
    const fieldSchema = schema[fieldName];
    const value = values[fieldName];

    // Required validation
    if (fieldSchema.required && (value === undefined || value === null || value === '')) {
      errors[fieldName] = `${formatLabel(fieldName)} is required`;
      valid = false;
    }

    // Type validation
    if (value !== undefined && value !== null && value !== '') {
      switch (fieldSchema.type) {
        case 'number':
          if (isNaN(value)) {
            errors[fieldName] = `${formatLabel(fieldName)} must be a number`;
            valid = false;
          } else {
            const num = parseFloat(value);
            if (fieldSchema.min !== undefined && num < fieldSchema.min) {
              errors[fieldName] = `${formatLabel(fieldName)} must be at least ${fieldSchema.min}`;
              valid = false;
            }
            if (fieldSchema.max !== undefined && num > fieldSchema.max) {
              errors[fieldName] = `${formatLabel(fieldName)} must be at most ${fieldSchema.max}`;
              valid = false;
            }
          }
          break;

        case 'string':
          if (fieldSchema.pattern) {
            const regex = new RegExp(fieldSchema.pattern);
            if (!regex.test(value)) {
              errors[fieldName] = `${formatLabel(fieldName)} format is invalid`;
              valid = false;
            }
          }
          if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
            errors[fieldName] = `${formatLabel(fieldName)} must be at least ${fieldSchema.minLength} characters`;
            valid = false;
          }
          if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
            errors[fieldName] = `${formatLabel(fieldName)} must be at most ${fieldSchema.maxLength} characters`;
            valid = false;
          }
          break;
      }
    }
  });

  return { valid, errors };
}

/**
 * Display validation errors
 * @param {HTMLElement} form - Form element
 * @param {object} errors - Validation errors
 */
export function displayErrors(form, errors) {
  // Clear all errors first
  form.querySelectorAll('.form-error').forEach(el => {
    el.classList.add('hidden');
    el.textContent = '';
  });

  // Display new errors
  Object.keys(errors).forEach(fieldName => {
    const errorEl = form.querySelector(`#${fieldName}-error`);
    if (errorEl) {
      errorEl.textContent = errors[fieldName];
      errorEl.classList.remove('hidden');
    }
  });
}

/**
 * Clear form errors
 * @param {HTMLElement} form - Form element
 */
export function clearErrors(form) {
  form.querySelectorAll('.form-error').forEach(el => {
    el.classList.add('hidden');
    el.textContent = '';
  });
}

export default {
  generateForm,
  getFormValues,
  validateForm,
  displayErrors,
  clearErrors
};
