import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './FormField.module.scss';

export interface BaseFormFieldProps {
  label?: React.ReactNode;
  required?: boolean;
  error?: string | null;
  hint?: React.ReactNode;
  id?: string;
  className?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export interface InputFormFieldProps extends BaseFormFieldProps, React.InputHTMLAttributes<HTMLInputElement> {
  control?: 'input';
}

export interface SelectFormFieldProps extends BaseFormFieldProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  control: 'select';
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>;
}

export interface TextareaFormFieldProps extends BaseFormFieldProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  control: 'textarea';
}

export interface CustomFormFieldProps extends BaseFormFieldProps {
  control: 'custom';
}

export type FormFieldProps =
  | InputFormFieldProps
  | SelectFormFieldProps
  | TextareaFormFieldProps
  | CustomFormFieldProps;

export const FormField: React.FC<FormFieldProps> = (props) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const {
    label,
    required,
    error,
    hint,
    className = '',
    prefixIcon,
    suffixIcon,
    control = 'input',
    children,
    ...rest
  } = props;

  const hasError = Boolean(error);

  const renderControl = () => {
    if (control === 'custom' || children) {
      return children;
    }

    const commonClass = [
      hasError ? styles.hasError : '',
      prefixIcon ? styles.hasPrefix : '',
      suffixIcon ? styles.hasSuffix : ''
    ].filter(Boolean).join(' ');

    if (control === 'select') {
      const { options, ...selectProps } = rest as React.SelectHTMLAttributes<HTMLSelectElement> & {
        options?: Array<{ value: string | number; label: string; disabled?: boolean }>;
      };

      return (
        <select
          id={inputId}
          className={`${styles.select} ${commonClass}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : hint ? hintId : undefined}
          required={required}
          {...selectProps}
        >
          {options ? (
            options.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          ) : (
            (rest as any).children
          )}
        </select>
      );
    }

    if (control === 'textarea') {
      const textareaProps = rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>;
      return (
        <textarea
          id={inputId}
          className={`${styles.textarea} ${commonClass}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : hint ? hintId : undefined}
          required={required}
          {...textareaProps}
        />
      );
    }

    // Default to input
    const inputProps = rest as React.InputHTMLAttributes<HTMLInputElement>;
    return (
      <input
        id={inputId}
        className={`${styles.input} ${commonClass}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : hint ? hintId : undefined}
        required={required}
        {...inputProps}
      />
    );
  };

  return (
    <div className={`${styles.formField} ${className}`}>
      {label && (
        <div className={styles.labelRow}>
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.requiredMarker} aria-hidden="true">*</span>}
          </label>
        </div>
      )}

      <div className={styles.controlWrapper}>
        {prefixIcon && <span className={styles.prefixIcon}>{prefixIcon}</span>}
        {renderControl()}
        {suffixIcon && <span className={styles.suffixIcon}>{suffixIcon}</span>}
      </div>

      {hasError && (
        <div id={errorId} className={styles.errorMessage} role="alert">
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}

      {!hasError && hint && (
        <div id={hintId} className={styles.hintMessage}>
          {hint}
        </div>
      )}
    </div>
  );
};

export default FormField;
