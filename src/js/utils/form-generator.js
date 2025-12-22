/**
 * Form Generator Utility
 * Dynamically generates forms from process variable schemas
 *
 * Features:
 * - Step-based field filtering (show only fields for current step)
 * - Smart FK field rendering based on option count:
 *   - ≤7 options: Radio buttons (single) or Checkboxes (multiple)
 *   - ≤50 options: Dropdown
 *   - >50 options: Autocomplete/searchable
 */

import { userLookupService } from '../components/user-lookup-input.js';

// Cache for FK options (loaded from services)
const fkOptionsCache = new Map();

// CSS class constants (Bootstrap 5)
const CSS = {
  FORM: 'generated-form',
  FORM_GROUP: 'mb-3',
  FORM_LABEL: 'form-label',
  FORM_INPUT: 'form-control',
  FORM_SELECT: 'form-select',
  FORM_ERROR: 'invalid-feedback d-none',
  FORM_HELP: 'form-text text-muted',
  REQUIRED: 'text-danger',
  HIDDEN: 'd-none',
};

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
 * Generate form fields for a specific step/state
 * @param {object} variablesSchema - Process variables schema
 * @param {string} step - Current step ('create', state name, or 'all')
 * @param {object} initialValues - Initial field values
 * @returns {HTMLElement} Form element
 */
export function generateStepForm(variablesSchema, step = 'create', initialValues = {}) {
  const form = document.createElement('form');
  form.className = 'generated-form step-form';
  form.dataset.step = step;

  // Filter fields by step
  Object.keys(variablesSchema).forEach(fieldName => {
    const fieldSchema = variablesSchema[fieldName];

    // Determine if field should be shown for this step
    const fieldStep = fieldSchema.step || 'create'; // Default to create step
    const showForStep = (
      step === 'all' ||
      fieldStep === step ||
      fieldStep === 'all' ||
      (step === 'create' && fieldStep === 'create') ||
      (Array.isArray(fieldStep) && fieldStep.includes(step))
    );

    if (showForStep) {
      const fieldValue = initialValues[fieldName] || fieldSchema.default;
      const fieldGroup = createFieldGroup(fieldName, fieldSchema, fieldValue);
      form.appendChild(fieldGroup);
    }
  });

  return form;
}

/**
 * Set FK options for a field (for autocomplete/search)
 * @param {string} fieldName - Field name
 * @param {Array} options - Options array [{value, label}] or ['value1', 'value2']
 */
export function setFKOptions(fieldName, options) {
  fkOptionsCache.set(fieldName, options);
}

/**
 * Get FK options for a field
 * @param {string} fieldName - Field name
 * @returns {Array} Options array
 */
export function getFKOptions(fieldName) {
  return fkOptionsCache.get(fieldName) || [];
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
  group.className = CSS.FORM_GROUP;
  group.dataset.field = fieldName;

  // Create label
  const label = document.createElement('label');
  label.className = CSS.FORM_LABEL;
  label.setAttribute('for', fieldName);
  label.textContent = formatLabel(fieldName);
  if (fieldSchema.required) {
    const required = document.createElement('span');
    required.className = CSS.REQUIRED;
    required.textContent = ' *';
    label.appendChild(required);
  }
  group.appendChild(label);

  // Create input based on field type
  const input = createInput(fieldName, fieldSchema, value);
  group.appendChild(input);

  // Create error message container
  const error = document.createElement('div');
  error.className = CSS.FORM_ERROR;
  error.id = `${fieldName}-error`;
  group.appendChild(error);

  // Create help text if provided
  if (fieldSchema.description) {
    const help = document.createElement('small');
    help.className = CSS.FORM_HELP;
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

  // Check for special input types first
  if (fieldSchema.inputType === 'userLookup') {
    return createUserLookupInput(fieldName, fieldSchema, value);
  }

  if (fieldSchema.inputType === 'entityLookup') {
    return createEntityLookupInput(fieldName, fieldSchema, value);
  }

  // Check if this is a foreign key field
  if (fieldSchema.foreignKey) {
    return createForeignKeyInput(fieldName, fieldSchema, value);
  }

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
 * Create foreign key input based on option count
 * - ≤7 options: Radio buttons (single select) or Checkboxes (multi select)
 * - ≤50 options: Dropdown
 * - >50 options: Autocomplete/searchable
 * @param {string} fieldName - Field name
 * @param {object} fieldSchema - Field schema with foreignKey config
 * @param {any} value - Initial value
 * @returns {HTMLElement} Input element
 */
function createForeignKeyInput(fieldName, fieldSchema, value) {
  const fkConfig = fieldSchema.foreignKey;
  let options = fkConfig.options || [];

  // If options is a string, try to get from cache
  if (typeof options === 'string') {
    options = getFKOptions(options) || [];
  }

  // Also check for inline enum
  if (options.length === 0 && fieldSchema.enum) {
    options = fieldSchema.enum.map(val => ({
      value: val,
      label: formatOptionLabel(val)
    }));
  }

  const optionCount = options.length;
  const isMultiple = fkConfig.multiple || false;

  // Normalize options to {value, label} format
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt.value !== undefined) {
      return { value: opt.value, label: opt.label || opt.value };
    }
    return { value: opt, label: formatOptionLabel(opt) };
  });

  // Choose input type based on option count
  if (optionCount <= 7) {
    // Radio buttons or checkboxes
    return isMultiple
      ? createCheckboxGroup(fieldName, fieldSchema, normalizedOptions, value)
      : createRadioGroup(fieldName, fieldSchema, normalizedOptions, value);
  } else if (optionCount <= 50) {
    // Dropdown
    return createDropdownInput(fieldName, fieldSchema, normalizedOptions, value, isMultiple);
  } else {
    // Autocomplete
    return createAutocompleteInput(fieldName, fieldSchema, normalizedOptions, value, isMultiple);
  }
}

/**
 * Create radio button group (for ≤7 options, single select)
 */
function createRadioGroup(fieldName, fieldSchema, options, value) {
  const container = document.createElement('ion-radio-group');
  container.setAttribute('name', fieldName);
  container.setAttribute('id', fieldName);
  if (value) container.value = value;

  options.forEach(opt => {
    const item = document.createElement('ion-item');
    item.className = 'radio-item';

    const label = document.createElement('ion-label');
    label.textContent = opt.label;

    const radio = document.createElement('ion-radio');
    radio.setAttribute('slot', 'start');
    radio.setAttribute('value', opt.value);

    item.appendChild(label);
    item.appendChild(radio);
    container.appendChild(item);
  });

  return container;
}

/**
 * Create checkbox group (for ≤7 options, multi select)
 */
function createCheckboxGroup(fieldName, fieldSchema, options, value) {
  const container = document.createElement('div');
  container.className = 'checkbox-group';
  container.dataset.name = fieldName;

  const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);

  options.forEach((opt, index) => {
    const item = document.createElement('ion-item');
    item.className = 'checkbox-item';

    const label = document.createElement('ion-label');
    label.textContent = opt.label;

    const checkbox = document.createElement('ion-checkbox');
    checkbox.setAttribute('slot', 'start');
    checkbox.setAttribute('name', `${fieldName}[${index}]`);
    checkbox.setAttribute('value', opt.value);
    if (selectedValues.includes(opt.value)) {
      checkbox.setAttribute('checked', '');
    }

    item.appendChild(label);
    item.appendChild(checkbox);
    container.appendChild(item);
  });

  return container;
}

/**
 * Create dropdown input (for ≤50 options)
 */
function createDropdownInput(fieldName, fieldSchema, options, value, isMultiple) {
  const select = document.createElement('ion-select');
  select.setAttribute('name', fieldName);
  select.setAttribute('id', fieldName);
  select.setAttribute('interface', 'popover');

  if (isMultiple) {
    select.setAttribute('multiple', 'true');
    if (Array.isArray(value)) select.value = value;
  } else {
    if (value) select.value = value;
  }

  if (fieldSchema.placeholder) {
    select.setAttribute('placeholder', fieldSchema.placeholder);
  } else {
    select.setAttribute('placeholder', `Select ${formatLabel(fieldName)}`);
  }

  if (fieldSchema.required) select.setAttribute('required', '');

  options.forEach(opt => {
    const optionEl = document.createElement('ion-select-option');
    optionEl.setAttribute('value', opt.value);
    optionEl.textContent = opt.label;
    select.appendChild(optionEl);
  });

  return select;
}

/**
 * Create autocomplete input (for >50 options)
 */
function createAutocompleteInput(fieldName, fieldSchema, options, value, isMultiple) {
  const container = document.createElement('div');
  container.className = 'autocomplete-container';
  container.dataset.name = fieldName;
  container.dataset.options = JSON.stringify(options);

  // Search input
  const searchbar = document.createElement('ion-searchbar');
  searchbar.setAttribute('placeholder', `Search ${formatLabel(fieldName)}...`);
  searchbar.setAttribute('debounce', '300');
  searchbar.className = 'autocomplete-search';

  // Selected value display
  const selectedDisplay = document.createElement('div');
  selectedDisplay.className = 'autocomplete-selected';

  if (value) {
    const selectedOption = options.find(o => o.value === value);
    if (selectedOption) {
      selectedDisplay.innerHTML = `
        <ion-chip>
          <ion-label>${selectedOption.label}</ion-label>
          <ion-icon name="close-circle" class="remove-selected"></ion-icon>
        </ion-chip>
      `;
    }
  }

  // Hidden input to store value
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.name = fieldName;
  hiddenInput.id = fieldName;
  if (value) hiddenInput.value = value;

  // Options list (hidden by default)
  const optionsList = document.createElement('div');
  optionsList.className = 'autocomplete-options d-none';

  // Add search functionality
  searchbar.addEventListener('ionInput', (e) => {
    const query = (e.detail.value || '').toLowerCase();

    if (query.length < 1) {
      optionsList.classList.add('d-none');
      return;
    }

    const filtered = options.filter(opt =>
      opt.label.toLowerCase().includes(query) ||
      String(opt.value).toLowerCase().includes(query)
    ).slice(0, 20); // Limit to 20 results

    if (filtered.length === 0) {
      optionsList.innerHTML = '<div class="no-results">No results found</div>';
    } else {
      optionsList.innerHTML = filtered.map(opt => `
        <div class="autocomplete-option" data-value="${opt.value}">
          ${opt.label}
        </div>
      `).join('');
    }

    optionsList.classList.remove('d-none');
  });

  // Handle option selection
  optionsList.addEventListener('click', (e) => {
    const optionEl = e.target.closest('.autocomplete-option');
    if (!optionEl) return;

    const selectedValue = optionEl.dataset.value;
    const selectedLabel = optionEl.textContent.trim();

    hiddenInput.value = selectedValue;
    selectedDisplay.innerHTML = `
      <ion-chip>
        <ion-label>${selectedLabel}</ion-label>
        <ion-icon name="close-circle" class="remove-selected"></ion-icon>
      </ion-chip>
    `;
    searchbar.value = '';
    optionsList.classList.add('d-none');

    // Dispatch change event
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Handle remove selected
  selectedDisplay.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-selected')) {
      hiddenInput.value = '';
      selectedDisplay.innerHTML = '';
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Close options when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      optionsList.classList.add('d-none');
    }
  });

  container.appendChild(selectedDisplay);
  container.appendChild(searchbar);
  container.appendChild(optionsList);
  container.appendChild(hiddenInput);

  return container;
}

/**
 * Create user lookup input with verify button
 * Searches users by email/username/phone and stores the userId
 * @param {string} fieldName - Field name (e.g., 'applicantId')
 * @param {object} fieldSchema - Field schema with lookup config
 * @param {any} value - Initial value (userId if already verified)
 * @returns {HTMLElement} User lookup container
 *
 * Schema config:
 * {
 *   inputType: 'userLookup',
 *   lookup: {
 *     service: 'users', // or 'employees', 'members'
 *     searchFields: ['email', 'username', 'phone'], // Fields to search
 *     displayFields: ['name', 'email', 'department'], // Fields to display after verification
 *     placeholder: 'Enter email or username'
 *   }
 * }
 */
function createUserLookupInput(fieldName, fieldSchema, value) {
  const container = document.createElement('div');
  container.className = 'user-lookup-container';
  container.dataset.name = fieldName;

  const lookupConfig = fieldSchema.lookup || {};
  const placeholder = lookupConfig.placeholder || 'Enter email, username, or phone';
  const displayFields = lookupConfig.displayFields || ['name', 'email'];

  // Search input row
  const searchRow = document.createElement('div');
  searchRow.className = 'user-lookup-search-row';

  const searchInput = document.createElement('ion-input');
  searchInput.setAttribute('type', 'text');
  searchInput.setAttribute('placeholder', placeholder);
  searchInput.className = 'user-lookup-input';

  const verifyBtn = document.createElement('ion-button');
  verifyBtn.setAttribute('size', 'default');
  verifyBtn.setAttribute('color', 'primary');
  verifyBtn.className = 'user-lookup-verify-btn';
  verifyBtn.innerHTML = '<ion-icon name="search"></ion-icon> Verify';

  searchRow.appendChild(searchInput);
  searchRow.appendChild(verifyBtn);

  // Hidden input to store the verified userId
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.name = fieldName;
  hiddenInput.id = fieldName;
  if (value) hiddenInput.value = value;

  // Verified user display
  const verifiedDisplay = document.createElement('div');
  verifiedDisplay.className = 'user-lookup-verified d-none';

  // Status/error message
  const statusMessage = document.createElement('div');
  statusMessage.className = 'user-lookup-status d-none';

  // Handle verify button click
  verifyBtn.addEventListener('click', async () => {
    const searchValue = searchInput.value?.trim();

    if (!searchValue) {
      statusMessage.textContent = 'Please enter a value to search';
      statusMessage.className = 'user-lookup-status error';
      return;
    }

    // Show loading state
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<ion-spinner name="crescent"></ion-spinner>';
    statusMessage.className = 'user-lookup-status d-none';

    try {
      // Use userLookupService to verify the user
      const result = await userLookupService.verify(searchValue);

      verifyBtn.disabled = false;
      verifyBtn.innerHTML = '<ion-icon name="search"></ion-icon> Verify';

      if (result.success && result.user) {
        // Store userId
        hiddenInput.value = result.user.id || result.user._id;
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Display verified user info
        const displayInfo = displayFields.map(field => {
          const val = result.user[field];
          return val ? `<span class="user-field-${field}">${val}</span>` : '';
        }).filter(Boolean).join(' • ');

        verifiedDisplay.innerHTML = `
          <div class="verified-user-info">
            <ion-icon name="checkmark-circle" color="success"></ion-icon>
            <div class="verified-user-details">${displayInfo}</div>
            <ion-button fill="clear" size="small" class="clear-user-btn">
              <ion-icon name="close-circle"></ion-icon>
            </ion-button>
          </div>
        `;
        verifiedDisplay.classList.remove('d-none');
        searchRow.classList.add('d-none');
        statusMessage.className = 'user-lookup-status d-none';

        // Handle clear button
        const clearBtn = verifiedDisplay.querySelector('.clear-user-btn');
        if (clearBtn) {
          clearBtn.addEventListener('click', () => {
            hiddenInput.value = '';
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
            verifiedDisplay.classList.add('d-none');
            searchRow.classList.remove('d-none');
            searchInput.value = '';
          });
        }
      } else {
        statusMessage.textContent = result.message || 'User not found';
        statusMessage.className = 'user-lookup-status error';
      }

    } catch (error) {
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = '<ion-icon name="search"></ion-icon> Verify';
      statusMessage.textContent = 'Error verifying user: ' + error.message;
      statusMessage.className = 'user-lookup-status error';
    }
  });

  // Allow Enter key to trigger verify
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyBtn.click();
    }
  });

  container.appendChild(verifiedDisplay);
  container.appendChild(searchRow);
  container.appendChild(statusMessage);
  container.appendChild(hiddenInput);

  // If value exists, try to display it
  if (value) {
    verifiedDisplay.innerHTML = `
      <div class="verified-user-info">
        <ion-icon name="checkmark-circle" color="success"></ion-icon>
        <div class="verified-user-details">User ID: ${value}</div>
        <ion-button fill="clear" size="small" class="clear-user-btn">
          <ion-icon name="close-circle"></ion-icon>
        </ion-button>
      </div>
    `;
    verifiedDisplay.classList.remove('d-none');
    searchRow.classList.add('d-none');

    const clearBtn = verifiedDisplay.querySelector('.clear-user-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        hiddenInput.value = '';
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
        verifiedDisplay.classList.add('d-none');
        searchRow.classList.remove('d-none');
        searchInput.value = '';
      });
    }
  }

  return container;
}

/**
 * Create entity lookup input with search
 * Searches entities (jobs, vendors, projects, etc.) and stores the entityId
 * @param {string} fieldName - Field name (e.g., 'jobId', 'vendorId')
 * @param {object} fieldSchema - Field schema with lookup config
 * @param {any} value - Initial value (entityId if already selected)
 * @returns {HTMLElement} Entity lookup container
 *
 * Schema config:
 * {
 *   inputType: 'entityLookup',
 *   lookup: {
 *     entity: 'jobs', // Entity type
 *     searchFields: ['title', 'department'], // Fields to search
 *     displayTemplate: '{title} - {department}', // How to display selected entity
 *     placeholder: 'Search for a job position'
 *   }
 * }
 */
function createEntityLookupInput(fieldName, fieldSchema, value) {
  const container = document.createElement('div');
  container.className = 'entity-lookup-container';
  container.dataset.name = fieldName;

  const lookupConfig = fieldSchema.lookup || {};
  const placeholder = lookupConfig.placeholder || `Search ${lookupConfig.entity || 'entity'}...`;
  const displayTemplate = lookupConfig.displayTemplate || '{name}';

  // Search bar
  const searchbar = document.createElement('ion-searchbar');
  searchbar.setAttribute('placeholder', placeholder);
  searchbar.setAttribute('debounce', '300');
  searchbar.className = 'entity-lookup-search';

  // Hidden input to store entityId
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.name = fieldName;
  hiddenInput.id = fieldName;
  if (value) hiddenInput.value = value;

  // Selected entity display
  const selectedDisplay = document.createElement('div');
  selectedDisplay.className = 'entity-lookup-selected';

  // Results list
  const resultsList = document.createElement('div');
  resultsList.className = 'entity-lookup-results hidden';

  // Status message
  const statusMessage = document.createElement('div');
  statusMessage.className = 'entity-lookup-status hidden';

  // Handle search input
  searchbar.addEventListener('ionInput', (e) => {
    const query = (e.detail.value || '').trim();

    if (query.length < 2) {
      resultsList.classList.add('d-none');
      return;
    }

    // Show loading
    resultsList.innerHTML = '<div class="entity-lookup-loading"><ion-spinner name="dots"></ion-spinner></div>';
    resultsList.classList.remove('d-none');

    // Dispatch search event for parent to handle
    const searchEvent = new CustomEvent('entitySearch', {
      bubbles: true,
      detail: {
        fieldName,
        query,
        entity: lookupConfig.entity || 'entities',
        searchFields: lookupConfig.searchFields || ['name'],
        callback: (results) => {
          if (results.length === 0) {
            resultsList.innerHTML = '<div class="entity-lookup-no-results">No results found</div>';
          } else {
            resultsList.innerHTML = results.slice(0, 10).map(item => {
              // Format display using template
              let display = displayTemplate;
              Object.keys(item).forEach(key => {
                display = display.replace(`{${key}}`, item[key] || '');
              });

              return `
                <div class="entity-lookup-item" data-id="${item.id || item._id}" data-display="${display}">
                  ${display}
                </div>
              `;
            }).join('');
          }
        }
      }
    });
    container.dispatchEvent(searchEvent);

    // Demo timeout - in real app, results would come from event handler
    setTimeout(() => {
      if (resultsList.querySelector('.entity-lookup-loading')) {
        resultsList.innerHTML = '<div class="entity-lookup-no-results">Search service not configured</div>';
      }
    }, 2000);
  });

  // Handle result selection
  resultsList.addEventListener('click', (e) => {
    const item = e.target.closest('.entity-lookup-item');
    if (!item) return;

    const entityId = item.dataset.id;
    const display = item.dataset.display;

    hiddenInput.value = entityId;
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));

    selectedDisplay.innerHTML = `
      <ion-chip>
        <ion-label>${display}</ion-label>
        <ion-icon name="close-circle" class="remove-entity"></ion-icon>
      </ion-chip>
    `;

    searchbar.value = '';
    resultsList.classList.add('d-none');
  });

  // Handle remove selected
  selectedDisplay.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-entity')) {
      hiddenInput.value = '';
      selectedDisplay.innerHTML = '';
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Close results when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      resultsList.classList.add('d-none');
    }
  });

  container.appendChild(selectedDisplay);
  container.appendChild(searchbar);
  container.appendChild(resultsList);
  container.appendChild(statusMessage);
  container.appendChild(hiddenInput);

  // If value exists, show it
  if (value) {
    selectedDisplay.innerHTML = `
      <ion-chip>
        <ion-label>ID: ${value}</ion-label>
        <ion-icon name="close-circle" class="remove-entity"></ion-icon>
      </ion-chip>
    `;
  }

  return container;
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

  // Handle toggles
  form.querySelectorAll('ion-toggle').forEach(toggle => {
    const name = toggle.getAttribute('name');
    if (name) {
      values[name] = toggle.hasAttribute('checked') || toggle.checked;
    }
  });

  // Handle radio groups (ion-radio-group)
  form.querySelectorAll('ion-radio-group').forEach(radioGroup => {
    const name = radioGroup.getAttribute('name');
    if (name && radioGroup.value) {
      values[name] = radioGroup.value;
    }
  });

  // Handle checkbox groups
  form.querySelectorAll('.checkbox-group').forEach(checkboxGroup => {
    const name = checkboxGroup.dataset.name;
    if (name) {
      const checkedValues = [];
      checkboxGroup.querySelectorAll('ion-checkbox').forEach(checkbox => {
        if (checkbox.checked) {
          checkedValues.push(checkbox.getAttribute('value'));
        }
      });
      values[name] = checkedValues;
    }
  });

  // Handle autocomplete hidden inputs
  form.querySelectorAll('.autocomplete-container').forEach(container => {
    const hiddenInput = container.querySelector('input[type="hidden"]');
    if (hiddenInput && hiddenInput.name && hiddenInput.value) {
      values[hiddenInput.name] = hiddenInput.value;
    }
  });

  return values;
}

/**
 * Validate form
 * @param {HTMLElement} form - Form element
 * @param {object} schema - Variable schema
 * @param {string} step - Optional step to validate only fields for that step
 * @returns {object} Validation result { valid: boolean, errors: {} }
 */
export function validateForm(form, schema, step = null) {
  const values = getFormValues(form);
  const errors = {};
  let valid = true;

  // Get step from form dataset if not provided
  const formStep = step || form.dataset?.step || null;

  Object.keys(schema).forEach(fieldName => {
    const fieldSchema = schema[fieldName];
    const value = values[fieldName];

    // If step filtering is active, only validate fields for that step
    if (formStep && formStep !== 'all') {
      const fieldStep = fieldSchema.step || 'create';
      const isFieldForStep = (
        fieldStep === formStep ||
        fieldStep === 'all' ||
        (Array.isArray(fieldStep) && fieldStep.includes(formStep))
      );
      if (!isFieldForStep) {
        return; // Skip validation for fields not in current step
      }
    }

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
    el.classList.add('d-none');
    el.textContent = '';
  });

  // Display new errors
  Object.keys(errors).forEach(fieldName => {
    const errorEl = form.querySelector(`#${fieldName}-error`);
    if (errorEl) {
      errorEl.textContent = errors[fieldName];
      errorEl.classList.remove('d-none');
    }
  });
}

/**
 * Clear form errors
 * @param {HTMLElement} form - Form element
 */
export function clearErrors(form) {
  form.querySelectorAll('.form-error').forEach(el => {
    el.classList.add('d-none');
    el.textContent = '';
  });
}

export default {
  generateForm,
  generateStepForm,
  setFKOptions,
  getFKOptions,
  getFormValues,
  validateForm,
  displayErrors,
  clearErrors
};
