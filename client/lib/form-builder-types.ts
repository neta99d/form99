export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'phone'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'heading'
  | 'paragraph'
  | 'star_rating'
  | 'slider'
  | 'number_rating'

export interface SelectOption {
  id: string
  label: string
  value: string
}

export type VisibilityConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'not_starts_with'
  | 'contains'
  | 'not_contains'

export interface VisibilityCondition {
  sourceFieldId: string
  operator: VisibilityConditionOperator
  value: string
}

export interface VisibilityRule {
  conditions: VisibilityCondition[]
}

export type FieldVisibility = VisibilityRule | VisibilityCondition

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  helperText?: string
  options?: SelectOption[]
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  rows?: number
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4'
  content?: string
  visibleWhen?: FieldVisibility
}

export type FormDirection = 'ltr' | 'rtl'

export interface FormConfig {
  id: string
  title: string
  description?: string
  fields: FormField[]
  submitButtonText: string
  direction: FormDirection
}

export interface UserInfo {
  businessName: string
  fullName: string
}

export type FormAnswerValue = string | boolean | null | undefined
export type FormAnswers = Record<string, FormAnswerValue>

const CONDITIONAL_SOURCE_FIELD_TYPES: FieldType[] = [
  'text',
  'email',
  'number',
  'phone',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'date',
  'star_rating',
  'slider',
  'number_rating',
]

export const DEFAULT_FIELD_CONFIGS: Record<FieldType, Partial<FormField>> = {
  text: { label: 'שדה טקסט', placeholder: 'הקלידו טקסט...', required: false },
  email: { label: 'אימייל', placeholder: 'name@example.com', required: false },
  number: { label: 'מספר', placeholder: '0', required: false },
  phone: { label: 'טלפון', placeholder: '050-1234567', required: false },
  textarea: { label: 'טקסט ארוך', placeholder: 'כתבו את ההודעה שלכם...', required: false, rows: 4 },
  select: { label: 'רשימה נפתחת', required: false, options: [{ id: '1', label: 'אפשרות 1', value: 'option1' }, { id: '2', label: 'אפשרות 2', value: 'option2' }] },
  checkbox: { label: 'תיבת סימון', required: false },
  radio: { label: 'בחירה אחת', required: false, options: [{ id: '1', label: 'אפשרות 1', value: 'choice1' }, { id: '2', label: 'אפשרות 2', value: 'choice2' }] },
  date: { label: 'תאריך', required: false },
  heading: { label: 'כותרת', headingLevel: 'h2', content: 'כותרת מקטע' },
  paragraph: { label: 'פסקה', content: 'הוסיפו כאן תיאור או הנחיות.' },
  star_rating: { label: 'כוכבים', required: false },
  slider: { label: 'סליידר', min: 0, max: 100, required: false },
  number_rating: { label: 'דירוג 1-10', required: false },
}

export const FIELD_CATEGORIES = {
  'שדות בסיסיים': ['text', 'email', 'number', 'phone', 'textarea'],
  'שדות בחירה': ['select', 'checkbox', 'radio'],
  'שדות מיוחדים': ['date'],
  'דירוג': ['star_rating', 'slider', 'number_rating'],
  'רכיבי פריסה': ['heading', 'paragraph'],
} as const

export function isConditionalSourceField(field: FormField) {
  return CONDITIONAL_SOURCE_FIELD_TYPES.includes(field.type)
}

export function getConditionOperatorLabel(operator: VisibilityConditionOperator) {
  switch (operator) {
    case 'not_equals':
      return 'לא שווה ל'
    case 'starts_with':
      return 'מתחיל ב'
    case 'not_starts_with':
      return 'לא מתחיל ב'
    case 'contains':
      return 'מכיל'
    case 'not_contains':
      return 'לא מכיל'
    case 'equals':
    default:
      return 'שווה ל'
  }
}

export function normalizeAnswerValue(value: FormAnswerValue) {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return value == null ? '' : String(value)
}

export function getConditionalValueOptions(field: FormField): SelectOption[] {
  if (field.type === 'checkbox') {
    return [
      { id: `${field.id}_yes`, label: 'כן', value: 'true' },
      { id: `${field.id}_no`, label: 'לא', value: 'false' },
    ]
  }

  if (field.type === 'select' || field.type === 'radio') {
    return field.options ?? []
  }

  return []
}

export function createDefaultVisibilityCondition(sourceField: FormField): VisibilityCondition {
  const firstOption = getConditionalValueOptions(sourceField)[0]

  return {
    sourceFieldId: sourceField.id,
    operator: 'equals',
    value: firstOption?.value ?? '',
  }
}

export function createDefaultVisibilityRule(sourceField: FormField): VisibilityRule {
  return {
    conditions: [createDefaultVisibilityCondition(sourceField)],
  }
}

export function getVisibilityConditions(visibleWhen: FieldVisibility | undefined): VisibilityCondition[] {
  if (!visibleWhen) {
    return []
  }

  if ('conditions' in visibleWhen) {
    return visibleWhen.conditions
  }

  return [visibleWhen]
}

export function getConditionalSourceFields(fields: FormField[], fieldId: string) {
  const currentFieldIndex = fields.findIndex(field => field.id === fieldId)
  if (currentFieldIndex === -1) {
    return []
  }

  return fields.slice(0, currentFieldIndex).filter(isConditionalSourceField)
}

export function doesFieldMatchCondition(condition: VisibilityCondition, answers: FormAnswers) {
  const currentValue = normalizeAnswerValue(answers[condition.sourceFieldId])

  switch (condition.operator) {
    case 'not_equals':
      return currentValue !== condition.value
    case 'starts_with':
      return currentValue.startsWith(condition.value)
    case 'not_starts_with':
      return !currentValue.startsWith(condition.value)
    case 'contains':
      return currentValue.includes(condition.value)
    case 'not_contains':
      return !currentValue.includes(condition.value)
    case 'equals':
    default:
      return currentValue === condition.value
  }
}

export function doesFieldMatchVisibilityRule(visibleWhen: FieldVisibility | undefined, answers: FormAnswers) {
  const conditions = getVisibilityConditions(visibleWhen)

  if (conditions.length === 0) {
    return true
  }

  return conditions.every(condition => doesFieldMatchCondition(condition, answers))
}

export function isFieldVisible(field: FormField, answers: FormAnswers) {
  return doesFieldMatchVisibilityRule(field.visibleWhen, answers)
}

export function sanitizeFieldVisibilityRules(fields: FormField[]) {
  return fields.map((field, index) => {
    if (!field.visibleWhen) {
      return field
    }

    const validConditions = getVisibilityConditions(field.visibleWhen).filter(condition => {
      const sourceFieldIndex = fields.findIndex(candidate => candidate.id === condition.sourceFieldId)
      const sourceField = sourceFieldIndex >= 0 ? fields[sourceFieldIndex] : null

      return !!sourceField && sourceFieldIndex < index && isConditionalSourceField(sourceField)
    })

    if (validConditions.length === 0) {
      return { ...field, visibleWhen: undefined }
    }

    return { ...field, visibleWhen: { conditions: validConditions } }
  })
}

const FIELD_ID_PREFIXES: Partial<Record<FieldType, string>> = {
  star_rating: 'stars',
  number_rating: 'rating',
}

export function generateFieldId(type: FieldType, existingFields: FormField[]): string {
  const prefix = FIELD_ID_PREFIXES[type] ?? type
  const count = existingFields.filter(f => f.type === type).length
  return count === 0 ? prefix : `${prefix}${count}`
}

export function createField(type: FieldType, existingFields: FormField[] = []): FormField {
  const config = DEFAULT_FIELD_CONFIGS[type]
  return {
    id: generateFieldId(type, existingFields),
    type,
    label: config.label || 'שדה חדש',
    placeholder: config.placeholder,
    required: config.required || false,
    helperText: config.helperText,
    options: config.options ? [...config.options.map(o => ({ ...o, id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` }))] : undefined,
    minLength: config.minLength,
    maxLength: config.maxLength,
    min: config.min,
    max: config.max,
    pattern: config.pattern,
    rows: config.rows,
    headingLevel: config.headingLevel,
    content: config.content,
    visibleWhen: undefined,
  }
}

export function generateFormHTML(config: FormConfig): string {
  const escapeAttribute = (value: string) =>
    value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

  const getVisibilityDataAttributes = (field: FormField) => {
    if (!field.visibleWhen) {
      return ''
    }

    const conditions = getVisibilityConditions(field.visibleWhen)
    if (conditions.length === 0) {
      return ''
    }

    return ` data-conditions="${escapeAttribute(JSON.stringify(conditions))}"`
  }

  const styles = `
<style>
  .form-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .form-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #1a1a2e;
  }
  .form-description {
    color: #666;
    margin-bottom: 1.5rem;
  }
  .form-group {
    margin-bottom: 1.25rem;
  }
  .form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #1a1a2e;
  }
  .form-label .required {
    color: #dc2626;
    margin-left: 0.25rem;
  }
  .form-input, .form-textarea, .form-select {
    width: 100%;
    padding: 0.625rem 0.875rem;
    font-size: 0.875rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    background: white;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }
  .form-input:focus, .form-textarea:focus, .form-select:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  .form-helper {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
  }
  .form-checkbox-group, .form-radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .form-checkbox-item, .form-radio-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .form-checkbox, .form-radio {
    width: 1rem;
    height: 1rem;
    accent-color: #6366f1;
  }
  .form-heading {
    margin: 1.5rem 0 0.75rem;
    color: #1a1a2e;
  }
  .form-heading h1 { font-size: 1.5rem; }
  .form-heading h2 { font-size: 1.25rem; }
  .form-heading h3 { font-size: 1.125rem; }
  .form-heading h4 { font-size: 1rem; }
  .form-paragraph {
    color: #64748b;
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  .is-hidden {
    display: none !important;
  }
  .form-submit {
    width: 100%;
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    background: #6366f1;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background 0.2s;
    margin-top: 1rem;
  }
  .form-submit:hover {
    background: #4f46e5;
  }
  .form-star-rating { display: inline-flex; flex-direction: row-reverse; gap: 0.25rem; }
  .form-star-rating input[type="radio"] { display: none; }
  .form-star-rating label { font-size: 1.75rem; color: #d1d5db; cursor: pointer; transition: color 0.15s; line-height: 1; }
  .form-star-rating input:checked ~ label,
  .form-star-rating label:hover,
  .form-star-rating label:hover ~ label { color: #fbbf24; }
  .form-slider-container { display: flex; align-items: center; gap: 1rem; }
  .form-slider { flex: 1; accent-color: #6366f1; }
  .form-slider-value { min-width: 2.5rem; text-align: center; font-size: 0.875rem; font-weight: 600; color: #1a1a2e; }
  .form-number-rating { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .form-number-rating input[type="radio"] { display: none; }
  .form-number-rating label { width: 2.25rem; height: 2.25rem; display: flex; align-items: center; justify-content: center; border: 1.5px solid #e2e8f0; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem; font-weight: 500; color: #64748b; transition: all 0.15s; }
  .form-number-rating label:hover { border-color: #6366f1; color: #6366f1; }
  .form-number-rating input:checked + label { background: #6366f1; border-color: #6366f1; color: white; }
</style>`

  let fieldsHTML = ''
  
  for (const field of config.fields) {
    const requiredMark = field.required ? '<span class="required">*</span>' : ''
    const helperHTML = field.helperText ? `<div class="form-helper">${field.helperText}</div>` : ''
    const visibilityAttributes = getVisibilityDataAttributes(field)
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'phone':
      case 'date':
        fieldsHTML += `
  <div class="form-group"${visibilityAttributes}>
    <label class="form-label">${field.label}${requiredMark}</label>
    <input type="${field.type === 'phone' ? 'tel' : field.type}" class="form-input" name="${field.id}" placeholder="${field.placeholder || ''}"${field.required ? ' required' : ''}${field.minLength ? ` minlength="${field.minLength}"` : ''}${field.maxLength ? ` maxlength="${field.maxLength}"` : ''}${field.min !== undefined ? ` min="${field.min}"` : ''}${field.max !== undefined ? ` max="${field.max}"` : ''}${field.pattern ? ` pattern="${field.pattern}"` : ''} />
    ${helperHTML}
  </div>`
        break
      case 'textarea':
        fieldsHTML += `
  <div class="form-group"${visibilityAttributes}>
    <label class="form-label">${field.label}${requiredMark}</label>
    <textarea class="form-textarea" name="${field.id}" placeholder="${field.placeholder || ''}" rows="${field.rows || 4}"${field.required ? ' required' : ''}${field.minLength ? ` minlength="${field.minLength}"` : ''}${field.maxLength ? ` maxlength="${field.maxLength}"` : ''}></textarea>
    ${helperHTML}
  </div>`
        break
      case 'select':
        const optionsHTML = field.options?.map(o => `<option value="${o.value}">${o.label}</option>`).join('\n      ') || ''
        fieldsHTML += `
  <div class="form-group"${visibilityAttributes}>
    <label class="form-label">${field.label}${requiredMark}</label>
    <select class="form-select" name="${field.id}"${field.required ? ' required' : ''}>
      <option value="">בחרו אפשרות...</option>
      ${optionsHTML}
    </select>
    ${helperHTML}
  </div>`
        break
      case 'checkbox':
        fieldsHTML += `
  <div class="form-group"${visibilityAttributes}>
    <div class="form-checkbox-item">
      <input type="checkbox" class="form-checkbox" name="${field.id}" id="${field.id}"${field.required ? ' required' : ''} />
      <label for="${field.id}">${field.label}${requiredMark}</label>
    </div>
    ${helperHTML}
  </div>`
        break
      case 'radio':
        const radioOptionsHTML = field.options?.map(o => `
      <div class="form-radio-item">
        <input type="radio" class="form-radio" name="${field.id}" id="${o.id}" value="${o.value}"${field.required ? ' required' : ''} />
        <label for="${o.id}">${o.label}</label>
      </div>`).join('') || ''
        fieldsHTML += `
  <div class="form-group"${visibilityAttributes}>
    <label class="form-label">${field.label}${requiredMark}</label>
    <div class="form-radio-group">${radioOptionsHTML}
    </div>
    ${helperHTML}
  </div>`
        break
      case 'heading':
        const HeadingTag = field.headingLevel || 'h2'
        fieldsHTML += `
  <div class="form-heading"${visibilityAttributes}>
    <${HeadingTag}>${field.content || 'כותרת'}</${HeadingTag}>
  </div>`
        break
      case 'paragraph':
        fieldsHTML += `
  <div class="form-paragraph"${visibilityAttributes}>${field.content || ''}</div>`
        break
      case 'star_rating': {
        const starsHTML = [5, 4, 3, 2, 1].map(i =>
          `<input type="radio" name="${field.id}" id="${field.id}_s${i}" value="${i}"${field.required ? ' required' : ''} /><label for="${field.id}_s${i}" title="${i} כוכבים">★</label>`
        ).join('')
        fieldsHTML += `
  <div class="form-group"${visibilityAttributes}>
    <label class="form-label">${field.label}${requiredMark}</label>
    <div class="form-star-rating">${starsHTML}</div>
    ${helperHTML}
  </div>`
        break
      }
      case 'slider': {
        const sliderMin = field.min ?? 0
        const sliderMax = field.max ?? 100
        fieldsHTML += `
  <div class="form-group"${visibilityAttributes}>
    <label class="form-label">${field.label}${requiredMark}</label>
    <div class="form-slider-container">
      <input type="range" class="form-slider" name="${field.id}" id="${field.id}" min="${sliderMin}" max="${sliderMax}" value="${sliderMin}" oninput="document.getElementById('${field.id}_val').textContent=this.value"${field.required ? ' required' : ''} />
      <span class="form-slider-value" id="${field.id}_val">${sliderMin}</span>
    </div>
    ${helperHTML}
  </div>`
        break
      }
      case 'number_rating': {
        const ratingHTML = Array.from({ length: 10 }, (_, i) => i + 1).map(i =>
          `<input type="radio" name="${field.id}" id="${field.id}_n${i}" value="${i}"${field.required ? ' required' : ''} /><label for="${field.id}_n${i}">${i}</label>`
        ).join('')
        fieldsHTML += `
  <div class="form-group"${visibilityAttributes}>
    <label class="form-label">${field.label}${requiredMark}</label>
    <div class="form-number-rating">${ratingHTML}</div>
    ${helperHTML}
  </div>`
        break
      }
    }
  }

  const langAttr = config.direction === 'rtl' ? 'he' : 'en'
  const dirAttr = config.direction
  const behaviorScript = `
<script>
  (() => {
    const form = document.querySelector('form');
    if (!form) return;

    const conditionalBlocks = Array.from(form.querySelectorAll('[data-conditions]'));
    if (conditionalBlocks.length === 0) return;

    const getFieldValue = (fieldId) => {
      const controls = Array.from(form.querySelectorAll(\`[name="\${fieldId}"]\`)).filter(control => !control.disabled);
      if (controls.length === 0) return '';

      const firstControl = controls[0];
      if (firstControl.type === 'radio') {
        const checkedControl = controls.find(control => control.checked);
        return checkedControl ? checkedControl.value : '';
      }

      if (firstControl.type === 'checkbox') {
        return firstControl.checked ? 'true' : 'false';
      }

      return firstControl.value ?? '';
    };

    const setBlockVisibility = (block, isVisible) => {
      block.classList.toggle('is-hidden', !isVisible);
      block.hidden = !isVisible;

      const controls = Array.from(block.querySelectorAll('input, select, textarea'));
      controls.forEach(control => {
        if (!control.dataset.originalRequired) {
          control.dataset.originalRequired = control.required ? 'true' : 'false';
        }

        control.disabled = !isVisible;
        control.required = isVisible && control.dataset.originalRequired === 'true';
      });
    };

    const updateVisibility = () => {
      conditionalBlocks.forEach(block => {
        const conditions = JSON.parse(block.dataset.conditions || '[]');
        const isVisible = conditions.every(condition => {
          const currentValue = condition.sourceFieldId ? getFieldValue(condition.sourceFieldId) : '';
          const expectedValue = condition.value ?? '';

          switch (condition.operator) {
            case 'not_equals':
              return currentValue !== expectedValue;
            case 'starts_with':
              return currentValue.startsWith(expectedValue);
            case 'not_starts_with':
              return !currentValue.startsWith(expectedValue);
            case 'contains':
              return currentValue.includes(expectedValue);
            case 'not_contains':
              return !currentValue.includes(expectedValue);
            case 'equals':
            default:
              return currentValue === expectedValue;
          }
        });

        setBlockVisibility(block, isVisible);
      });
    };

    form.addEventListener('input', updateVisibility);
    form.addEventListener('change', updateVisibility);
    updateVisibility();
  })();
</script>`

  return `<!DOCTYPE html>
<html lang="${langAttr}" dir="${dirAttr}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  ${styles}
</head>
<body>
  <div class="form-container">
    <h1 class="form-title">${config.title}</h1>
    ${config.description ? `<p class="form-description">${config.description}</p>` : ''}
    <form action="#" method="POST">
      ${fieldsHTML}
      <button type="submit" class="form-submit">${config.submitButtonText}</button>
    </form>
  </div>
  ${behaviorScript}
</body>
</html>`
}
