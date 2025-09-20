import React, { useState, useEffect, useRef } from 'react';
import { Flex, Box, Text, TextField, Select, TextArea, IconButton } from "@radix-ui/themes";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

interface DetailFieldProps {
  label: string;
  value?: string | number;
  icon?: React.ReactNode;
  editable?: boolean;
  type?: "text" | "number" | "date" | "select" | "textarea";
  options?: Array<{ value: string; label: string }>;
  onSave?: (value: string) => Promise<void>;
  formatter?: (value: string | number) => string;
  placeholder?: string;
}

export const DetailField: React.FC<DetailFieldProps> = ({
  label,
  value,
  icon,
  editable = false,
  type = "text",
  options,
  onSave,
  formatter,
  placeholder
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const displayValue = formatter && value !== undefined 
    ? formatter(value) 
    : value?.toString() || "";

  useEffect(() => {
    if (isEditing) {
      if (type === "textarea" && textAreaRef.current) {
        textAreaRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isEditing, type]);

  const handleEdit = () => {
    setEditValue(value?.toString() || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <Flex direction="column" gap="2" py="3">
      <Flex align="center" gap="2" justify="between">
        <Flex align="center" gap="2" style={{ minWidth: 0, flex: 1 }}>
          {icon && (
            <Box style={{ color: 'var(--gray-9)', flexShrink: 0 }}>
              {icon}
            </Box>
          )}
          <Text 
            size={{ initial: "1", sm: "2" }}
            weight="medium"
            style={{ 
              color: 'var(--gray-10)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: window.innerWidth < 768 ? '10px' : '12px'
            }}
          >
            {label}
          </Text>
        </Flex>
        {editable && !isEditing && (
          <IconButton
            size="1"
            variant="ghost"
            onClick={handleEdit}
            style={{ 
              color: 'var(--gray-9)',
              minHeight: "32px",
              minWidth: "32px"
            }}
          >
            <FaEdit size={10} />
          </IconButton>
        )}
      </Flex>

      {isEditing ? (
        <Flex gap="2" align="center" direction={{ initial: "column", sm: "row" }}>
          {type === "select" && options ? (
            <Select.Root
              value={editValue}
              onValueChange={setEditValue}
              size={{ initial: "2", sm: "3" }}
            >
              <Select.Trigger style={{ flex: 1, borderRadius: '6px' }} />
              <Select.Content>
                {options.map(option => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          ) : type === "textarea" ? (
            <TextArea
              ref={textAreaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              size={{ initial: "2", sm: "3" }}
              style={{ 
                flex: 1, 
                borderRadius: '6px',
                minHeight: '80px'
              }}
              placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
            />
          ) : (
            <TextField.Root
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              size={{ initial: "2", sm: "3" }}
              style={{ flex: 1, borderRadius: '6px' }}
              placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
            />
          )}
          <Flex gap="2" style={{ flexShrink: 0 }}>
            <IconButton
              size="1"
              variant="solid"
              color="green"
              onClick={handleSave}
              disabled={saving}
              style={{ borderRadius: '4px' }}
            >
              <FaSave size={10} />
            </IconButton>
            <IconButton
              size="1"
              variant="soft"
              color="gray"
              onClick={handleCancel}
              style={{ borderRadius: '4px' }}
            >
              <FaTimes size={10} />
            </IconButton>
          </Flex>
        </Flex>
      ) : (
        <Text 
          size={{ initial: "2", sm: "3" }}
          weight="medium" 
          style={{ 
            color: displayValue ? 'var(--gray-12)' : 'var(--gray-9)',
            wordWrap: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto",
            lineHeight: 1.4
          }}
        >
          {displayValue || placeholder || "—"}
        </Text>
      )}
    </Flex>
  );
};