import toast from 'react-hot-toast';

export interface ValidationRule<T = any> {
  validator: (value: T) => boolean;
  message: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: <T>(message = 'This field is required'): ValidationRule<T> => ({
    validator: (value: T) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return !isNaN(value);
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validator: (value: string) => (value || '').length >= min,
    message: message || `Must be at least ${min} characters long`
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validator: (value: string) => (value || '').length <= max,
    message: message || `Must be less than ${max} characters`
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule<string> => ({
    validator: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value || '');
    },
    message
  }),

  gradeLevel: (message = 'Please enter a valid grade level (K-12)'): ValidationRule<string> => ({
    validator: (value: string) => {
      const gradeRegex = /^(K|[1-9]|1[0-2])$/;
      return gradeRegex.test(value || '');
    },
    message
  }),

  positiveNumber: (message = 'Must be a positive number'): ValidationRule<number> => ({
    validator: (value: number) => !isNaN(value) && value > 0,
    message
  }),

  noSpecialChars: (message = 'Special characters are not allowed'): ValidationRule<string> => ({
    validator: (value: string) => {
      const specialCharsRegex = /^[a-zA-Z0-9\s]*$/;
      return specialCharsRegex.test(value || '');
    },
    message
  }),

  sanitizeHtml: (message = 'Invalid content detected'): ValidationRule<string> => ({
    validator: (value: string) => {
      const htmlRegex = /<[^>]*>/;
      return !htmlRegex.test(value || '');
    },
    message
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule<string> => ({
    validator: (value: string) => {
      try {
        new URL(value || '');
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  password: (message = 'Password must be at least 8 characters with uppercase, lowercase, and number'): ValidationRule<string> => ({
    validator: (value: string) => {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
      return passwordRegex.test(value || '');
    },
    message
  }),

  phoneNumber: (message = 'Please enter a valid phone number'): ValidationRule<string> => ({
    validator: (value: string) => {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      return phoneRegex.test(value || '');
    },
    message
  })
};

/**
 * Validate an object against a schema
 */
export function validateObject<T extends Record<string, any>>(
  obj: T,
  schema: ValidationSchema
): ValidationResult {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(schema)) {
    const value = obj[field];
    const fieldErrors: string[] = [];

    for (const rule of rules) {
      if (!rule.validator(value)) {
        fieldErrors.push(rule.message);
        isValid = false;
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return { isValid, errors };
}

/**
 * Enhanced form data validation for complex objects
 */
export function validateFormData<T extends Record<string, any>>(
  formData: FormData | T,
  schema: ValidationSchema
): ValidationResult {
  const obj: Record<string, any> = {};

  if (formData instanceof FormData) {
    for (const [key, value] of formData.entries()) {
      obj[key] = value;
    }
  } else {
    Object.assign(obj, formData);
  }

  return validateObject(obj, schema);
}

/**
 * Assessment validation schema
 */
export const AssessmentValidationSchema: ValidationSchema = {
  topic: [
    ValidationRules.required('Topic is required'),
    ValidationRules.minLength(2, 'Topic must be at least 2 characters long'),
    ValidationRules.maxLength(100, 'Topic must be less than 100 characters'),
    ValidationRules.sanitizeHtml(),
    ValidationRules.noSpecialChars()
  ],
  grade: [
    ValidationRules.required('Grade level is required'),
    ValidationRules.gradeLevel()
  ]
};

/**
 * Planning validation schema
 */
export const PlanningValidationSchema: ValidationSchema = {
  topic: [
    ValidationRules.required('Topic is required'),
    ValidationRules.minLength(3, 'Topic must be at least 3 characters long'),
    ValidationRules.maxLength(150, 'Topic must be less than 150 characters'),
    ValidationRules.sanitizeHtml(),
    ValidationRules.noSpecialChars()
  ],
  grade: [
    ValidationRules.required('Grade level is required'),
    ValidationRules.gradeLevel()
  ],
  duration: [
    ValidationRules.required('Duration is required'),
    ValidationRules.positiveNumber()
  ]
};

/**
 * Visual Aids validation schema
 */
export const VisualAidsValidationSchema: ValidationSchema = {
  prompt: [
    ValidationRules.required('Prompt is required'),
    ValidationRules.minLength(5, 'Prompt must be at least 5 characters long'),
    ValidationRules.maxLength(500, 'Prompt must be less than 500 characters'),
    ValidationRules.sanitizeHtml()
  ],
  grade_level: [
    ValidationRules.gradeLevel()
  ]
};

/**
 * Activities validation schema
 */
export const ActivitiesValidationSchema: ValidationSchema = {
  topic: [
    ValidationRules.required('Topic is required'),
    ValidationRules.minLength(2, 'Topic must be at least 2 characters long'),
    ValidationRules.maxLength(200, 'Topic must be less than 200 characters'),
    ValidationRules.sanitizeHtml(),
    ValidationRules.noSpecialChars()
  ],
  grade: [
    ValidationRules.required('Grade level is required'),
    ValidationRules.gradeLevel()
  ],
  language: [
    ValidationRules.maxLength(50, 'Language must be less than 50 characters'),
    ValidationRules.noSpecialChars()
  ]
};

/**
 * Interactive Story validation schema
 */
export const InteractiveStoryValidationSchema: ValidationSchema = {
  grade: [
    ValidationRules.required('Grade level is required'),
    ValidationRules.gradeLevel()
  ],
  topic: [
    ValidationRules.required('Topic is required'),
    ValidationRules.minLength(3, 'Topic must be at least 3 characters long'),
    ValidationRules.maxLength(150, 'Topic must be less than 150 characters'),
    ValidationRules.sanitizeHtml(),
    ValidationRules.noSpecialChars()
  ]
};

/**
 * AR Scene validation schema
 */
export const ARSceneValidationSchema: ValidationSchema = {
  topic: [
    ValidationRules.required('Topic is required'),
    ValidationRules.minLength(3, 'Topic must be at least 3 characters long'),
    ValidationRules.maxLength(200, 'Topic must be less than 200 characters'),
    ValidationRules.sanitizeHtml(),
    ValidationRules.noSpecialChars()
  ],
  grade: [
    ValidationRules.required('Grade level is required'),
    ValidationRules.gradeLevel()
  ]
};

/**
 * Voice Assistant validation schema
 */
export const VoiceMessageValidationSchema: ValidationSchema = {
  message: [
    ValidationRules.maxLength(2000, 'Message must be less than 2000 characters'),
    ValidationRules.sanitizeHtml()
  ],
  user_id: [
    ValidationRules.required('User ID is required'),
    ValidationRules.maxLength(100, 'User ID must be less than 100 characters')
  ],
  session_id: [
    ValidationRules.maxLength(100, 'Session ID must be less than 100 characters')
  ]
};

/**
 * Enhanced Assistant validation schema for ChatGPT-like functionality
 */
export const EnhancedAssistantValidationSchema: ValidationSchema = {
  user_id: [
    ValidationRules.required('User ID is required'),
    ValidationRules.maxLength(100, 'User ID must be less than 100 characters')
  ],
  message: [
    ValidationRules.maxLength(2000, 'Message must be less than 2000 characters'),
    ValidationRules.sanitizeHtml()
  ],
  session_id: [
    ValidationRules.maxLength(100, 'Session ID must be less than 100 characters')
  ]
};

/**
 * Lesson Plan validation schema for backward compatibility
 */
export const LessonPlanValidationSchema: ValidationSchema = {
  topic: [
    ValidationRules.required('Topic is required'),
    ValidationRules.minLength(3, 'Topic must be at least 3 characters long'),
    ValidationRules.maxLength(150, 'Topic must be less than 150 characters'),
    ValidationRules.sanitizeHtml(),
    ValidationRules.noSpecialChars()
  ],
  grade: [
    ValidationRules.required('Grade level is required'),
    ValidationRules.gradeLevel()
  ]
};

/**
 * Visual Aid validation schema - Updated to match backend OpenAPI schema
 */
export const VisualAidValidationSchema: ValidationSchema = {
  topic: [
    ValidationRules.required('Topic is required'),
    ValidationRules.minLength(1, 'Topic must be at least 1 character long'),
    ValidationRules.maxLength(200, 'Topic must be less than 200 characters'),
    ValidationRules.sanitizeHtml()
  ],
  grade: [
    ValidationRules.required('Grade level is required')
  ],
  subject: [
    ValidationRules.required('Subject is required'),
    ValidationRules.minLength(1, 'Subject must be at least 1 character long'),
    ValidationRules.maxLength(100, 'Subject must be less than 100 characters')
  ]
};

/**
 * Activity validation schema for backward compatibility
 */
export const ActivityValidationSchema: ValidationSchema = {
  topic: [
    ValidationRules.required('Topic is required'),
    ValidationRules.minLength(2, 'Topic must be at least 2 characters long'),
    ValidationRules.maxLength(200, 'Topic must be less than 200 characters'),
    ValidationRules.sanitizeHtml(),
    ValidationRules.noSpecialChars()
  ],
  grade: [
    ValidationRules.required('Grade level is required'),
    ValidationRules.gradeLevel()
  ]
};

/**
 * Login form validation schema
 */
export const LoginValidationSchema: ValidationSchema = {
  email: [
    ValidationRules.required('Email is required'),
    ValidationRules.email()
  ],
  password: [
    ValidationRules.required('Password is required'),
    ValidationRules.minLength(1, 'Password is required')
  ]
};

/**
 * Registration form validation schema
 */
export const RegisterValidationSchema: ValidationSchema = {
  firstName: [
    ValidationRules.required('First name is required'),
    ValidationRules.minLength(2, 'First name must be at least 2 characters long'),
    ValidationRules.maxLength(50, 'First name must be less than 50 characters'),
    ValidationRules.noSpecialChars()
  ],
  lastName: [
    ValidationRules.required('Last name is required'),
    ValidationRules.minLength(2, 'Last name must be at least 2 characters long'),
    ValidationRules.maxLength(50, 'Last name must be less than 50 characters'),
    ValidationRules.noSpecialChars()
  ],
  email: [
    ValidationRules.required('Email is required'),
    ValidationRules.email()
  ],
  password: [
    ValidationRules.required('Password is required'),
    ValidationRules.password()
  ],
  role: [
    ValidationRules.required('Role is required')
  ]
};

/**
 * Utility function to show validation errors as toast messages
 */
export function showValidationErrors(errors: Record<string, string[]>, firstErrorOnly = true): void {
  if (firstErrorOnly) {
    const firstField = Object.keys(errors)[0];
    if (firstField && errors[firstField].length > 0) {
      toast.error(errors[firstField][0]);
    }
  } else {
    Object.entries(errors).forEach(([field, fieldErrors]) => {
      fieldErrors.forEach(error => {
        toast.error(`${field}: ${error}`);
      });
    });
  }
}

/**
 * Clear all validation errors
 */
export function clearValidationErrors(): void {
  toast.dismiss();
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.entries(errors)
    .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(', ')}`)
    .join('\n');
}
