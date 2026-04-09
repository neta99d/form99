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
  | 'file'
  | 'heading'
  | 'paragraph'

export interface SelectOption {
  id: string
  label: string
  value: string
}

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
  accept?: string
  multiple?: boolean
  rows?: number
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4'
  content?: string
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

export const DEFAULT_FIELD_CONFIGS: Record<FieldType, Partial<FormField>> = {
  text: { label: 'Text Field', placeholder: 'Enter text...', required: false },
  email: { label: 'Email', placeholder: 'your@email.com', required: false },
  number: { label: 'Number', placeholder: '0', required: false },
  phone: { label: 'Phone', placeholder: '(123) 456-7890', required: false },
  textarea: { label: 'Long Text', placeholder: 'Enter your message...', required: false, rows: 4 },
  select: { label: 'Dropdown', required: false, options: [{ id: '1', label: 'Option 1', value: 'option1' }, { id: '2', label: 'Option 2', value: 'option2' }] },
  checkbox: { label: 'Checkbox', required: false },
  radio: { label: 'Radio Group', required: false, options: [{ id: '1', label: 'Choice 1', value: 'choice1' }, { id: '2', label: 'Choice 2', value: 'choice2' }] },
  date: { label: 'Date', required: false },
  file: { label: 'File Upload', required: false, accept: '*/*', multiple: false },
  heading: { label: 'Heading', headingLevel: 'h2', content: 'Section Title' },
  paragraph: { label: 'Paragraph', content: 'Add description or instructions here.' },
}

export const FIELD_CATEGORIES = {
  'Basic Fields': ['text', 'email', 'number', 'phone', 'textarea'],
  'Choice Fields': ['select', 'checkbox', 'radio'],
  'Special Fields': ['date', 'file'],
  'Layout Elements': ['heading', 'paragraph'],
} as const

export function createField(type: FieldType): FormField {
  const config = DEFAULT_FIELD_CONFIGS[type]
  return {
    id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    label: config.label || 'New Field',
    placeholder: config.placeholder,
    required: config.required || false,
    helperText: config.helperText,
    options: config.options ? [...config.options.map(o => ({ ...o, id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` }))] : undefined,
    minLength: config.minLength,
    maxLength: config.maxLength,
    min: config.min,
    max: config.max,
    pattern: config.pattern,
    accept: config.accept,
    multiple: config.multiple,
    rows: config.rows,
    headingLevel: config.headingLevel,
    content: config.content,
  }
}

export function generateFormHTML(config: FormConfig): string {
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
</style>`

  let fieldsHTML = ''
  
  for (const field of config.fields) {
    const requiredMark = field.required ? '<span class="required">*</span>' : ''
    const helperHTML = field.helperText ? `<div class="form-helper">${field.helperText}</div>` : ''
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
      case 'phone':
      case 'date':
        fieldsHTML += `
  <div class="form-group">
    <label class="form-label">${field.label}${requiredMark}</label>
    <input type="${field.type === 'phone' ? 'tel' : field.type}" class="form-input" name="${field.id}" placeholder="${field.placeholder || ''}"${field.required ? ' required' : ''}${field.minLength ? ` minlength="${field.minLength}"` : ''}${field.maxLength ? ` maxlength="${field.maxLength}"` : ''}${field.min !== undefined ? ` min="${field.min}"` : ''}${field.max !== undefined ? ` max="${field.max}"` : ''}${field.pattern ? ` pattern="${field.pattern}"` : ''} />
    ${helperHTML}
  </div>`
        break
      case 'textarea':
        fieldsHTML += `
  <div class="form-group">
    <label class="form-label">${field.label}${requiredMark}</label>
    <textarea class="form-textarea" name="${field.id}" placeholder="${field.placeholder || ''}" rows="${field.rows || 4}"${field.required ? ' required' : ''}${field.minLength ? ` minlength="${field.minLength}"` : ''}${field.maxLength ? ` maxlength="${field.maxLength}"` : ''}></textarea>
    ${helperHTML}
  </div>`
        break
      case 'select':
        const optionsHTML = field.options?.map(o => `<option value="${o.value}">${o.label}</option>`).join('\n      ') || ''
        fieldsHTML += `
  <div class="form-group">
    <label class="form-label">${field.label}${requiredMark}</label>
    <select class="form-select" name="${field.id}"${field.required ? ' required' : ''}>
      <option value="">Select an option...</option>
      ${optionsHTML}
    </select>
    ${helperHTML}
  </div>`
        break
      case 'checkbox':
        fieldsHTML += `
  <div class="form-group">
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
  <div class="form-group">
    <label class="form-label">${field.label}${requiredMark}</label>
    <div class="form-radio-group">${radioOptionsHTML}
    </div>
    ${helperHTML}
  </div>`
        break
      case 'file':
        fieldsHTML += `
  <div class="form-group">
    <label class="form-label">${field.label}${requiredMark}</label>
    <input type="file" class="form-input" name="${field.id}"${field.accept ? ` accept="${field.accept}"` : ''}${field.multiple ? ' multiple' : ''}${field.required ? ' required' : ''} />
    ${helperHTML}
  </div>`
        break
      case 'heading':
        const HeadingTag = field.headingLevel || 'h2'
        fieldsHTML += `
  <div class="form-heading">
    <${HeadingTag}>${field.content || 'Heading'}</${HeadingTag}>
  </div>`
        break
      case 'paragraph':
        fieldsHTML += `
  <p class="form-paragraph">${field.content || ''}</p>`
        break
    }
  }

  const langAttr = config.direction === 'rtl' ? 'he' : 'en'
  const dirAttr = config.direction

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
</body>
</html>`
}
