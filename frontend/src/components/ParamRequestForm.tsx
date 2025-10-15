"use client"

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AlertCircle, Send } from 'lucide-react';
import type { ParamRequest, ParamField, FieldType } from '@/server/schemas/param-requests';

interface ParamRequestFormProps {
  request: ParamRequest;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export default function ParamRequestForm({ 
  request, 
  onSubmit,
  onCancel 
}: ParamRequestFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    // Initialize with defaults and known values
    const initial: Record<string, unknown> = { ...request.known };
    request.missing.forEach(field => {
      if (field.default !== undefined) {
        initial[field.id] = field.default;
      }
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (fieldId: string, value: string, type: FieldType) => {
    let processedValue: unknown = value;

    // Type conversion based on field type
    switch (type) {
      case 'UFix64':
      case 'UInt64':
      case 'UInt8':
        processedValue = value === '' ? '' : Number(value);
        break;
      case 'Bool':
        processedValue = value === 'true';
        break;
      case 'Timestamp':
        // For timestamp, we accept either a number or will parse it later
        processedValue = value;
        break;
      default:
        processedValue = value;
    }

    setValues(prev => ({ ...prev, [fieldId]: processedValue }));
    
    // Clear error when user types
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateField = (field: ParamField, value: unknown): string | null => {
    if (field.required && (value === undefined || value === '' || value === null)) {
      return `${field.label} is required`;
    }

    if (!field.validation) return null;

    const { min, max, pattern } = field.validation;

    if (typeof value === 'number') {
      if (min !== undefined && value < min) {
        return `${field.label} must be at least ${min}`;
      }
      if (max !== undefined && value > max) {
        return `${field.label} must be at most ${max}`;
      }
    }

    if (typeof value === 'string' && pattern) {
      const regex = new RegExp(pattern);
      if (!regex.test(value)) {
        return `${field.label} format is invalid`;
      }
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    request.missing.forEach(field => {
      const error = validateField(field, values[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit the values
    onSubmit(values);
  };

  const renderField = (field: ParamField) => {
    const value = values[field.id];
    const error = errors[field.id];

    if (field.type === 'Enum' && field.enumOptions) {
      return (
        <div key={field.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
          )}
          <select
            value={String(value || '')}
            onChange={(e) => handleChange(field.id, e.target.value, field.type)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {field.label}</option>
            {field.enumOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      );
    }

    const inputType = 
      field.type === 'UFix64' || field.type === 'UInt64' || field.type === 'UInt8' 
        ? 'number' 
        : field.type === 'Timestamp'
        ? 'text'
        : 'text';

    return (
      <div key={field.id} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
        )}
        <Input
          type={inputType}
          value={String(value || '')}
          onChange={(e) => handleChange(field.id, e.target.value, field.type)}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          className={error ? 'border-red-500' : ''}
          step={field.type === 'UFix64' ? '0.00000001' : undefined}
          min={field.validation?.min}
          max={field.validation?.max}
        />
        {field.examples && field.examples.length > 0 && (
          <p className="text-xs text-gray-400">
            e.g., {field.examples.slice(0, 2).join(', ')}
          </p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {request.actionLabel}
        </h3>
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {request.reason}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {request.missing.map(field => renderField(field))}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
          >
            <Send className="w-4 h-4 mr-2" />
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}

