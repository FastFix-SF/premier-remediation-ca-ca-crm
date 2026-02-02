import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/profitMath';
import { cn } from '@/lib/utils';

interface EditableValueProps {
  value: number;
  onSave: (newValue: number) => Promise<void>;
  label?: string;
  className?: string;
  showCurrency?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const EditableValue: React.FC<EditableValueProps> = ({
  value,
  onSave,
  label,
  className,
  showCurrency = true,
  size = 'md',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  const handleSave = async () => {
    const numValue = parseFloat(editValue.replace(/[^0-9.-]/g, ''));
    if (isNaN(numValue) || numValue === value) {
      setIsEditing(false);
      setEditValue(value.toString());
      return;
    }

    setIsSaving(true);
    try {
      await onSave(numValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      setEditValue(value.toString());
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold',
  };

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {label && <span className="text-xs text-muted-foreground mr-1">{label}</span>}
        <div className="relative flex items-center">
          <span className="absolute left-2 text-muted-foreground">$</span>
          <Input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={cn(
              'h-7 w-28 pl-5 pr-8 text-right',
              sizeClasses[size]
            )}
            disabled={isSaving}
          />
          {isSaving ? (
            <Loader2 className="absolute right-2 h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <div className="absolute right-1 flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleSave}
                className="p-0.5 hover:bg-primary/10 rounded"
              >
                <Check className="h-3 w-3 text-primary" />
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="p-0.5 hover:bg-destructive/10 rounded"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={cn(
        'group inline-flex items-center gap-1 cursor-pointer transition-all',
        'hover:bg-primary/5 rounded px-1.5 py-0.5 -mx-1.5 -my-0.5',
        sizeClasses[size],
        className
      )}
    >
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <span className="font-medium">
        {showCurrency ? formatCurrency(value) : value.toLocaleString()}
      </span>
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 text-muted-foreground transition-opacity" />
    </button>
  );
};

// Compact version for use in badges
export const EditableBadgeValue: React.FC<{
  label: string;
  value: number;
  onSave: (newValue: number) => Promise<void>;
  className?: string;
}> = ({ label, value, onSave, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  const handleSave = async () => {
    const numValue = parseFloat(editValue.replace(/[^0-9.-]/g, ''));
    if (isNaN(numValue) || numValue === value) {
      setIsEditing(false);
      setEditValue(value.toString());
      return;
    }

    setIsSaving(true);
    try {
      await onSave(numValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      setEditValue(value.toString());
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value.toString());
    }
  };

  if (isEditing) {
    return (
      <div className={cn('inline-flex items-center gap-1 bg-white/80 rounded px-1', className)}>
        <span className="text-xs font-medium">{label}</span>
        <Input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-5 w-16 px-1 text-xs text-right"
          disabled={isSaving}
        />
        {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className={cn(
        'inline-flex items-center gap-1 group cursor-pointer hover:bg-white/50 rounded px-1 transition-colors',
        className
      )}
    >
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs">{formatCurrency(value)}</span>
      <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
    </button>
  );
};
