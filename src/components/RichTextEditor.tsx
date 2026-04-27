import React, { useState } from 'react';
interface RichTextEditorProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  showValidation?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label = '1.',
  placeholder = 'Implement a functionality...',
  value,
  onChange,
  required = false,
  showValidation = false
}) => {
  const [isTouched, setIsTouched] = useState(false);

  // Determine if we should show the validation tooltip
  const isInvalid = (required && isTouched && (!value || value.trim() === '')) || showValidation;
  const handleBlur = () => {
    setIsTouched(true);
  };

  return (
    <div className="rich-text-editor-container relative mb-4" style={{ border: '1px solid var(--BorderGrey)', borderRadius: '4px', overflow: 'hidden' }}>
      {label && (
        <div 
          className="editor-header px-3 py-2" 
          style={{ backgroundColor: 'var(--LightBackgroundGrey)', borderBottom: '1px solid var(--BorderGrey)', color: 'var(--TextBlack)', fontWeight: '600', fontSize: '15px' }}
        >
          {label}
        </div>
      )}
      
      <div className="editor-body relative">
        <textarea
          value={value}
          onBlur={handleBlur}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[300px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--SiteBlue)]"
        />
        
        {isInvalid && (
          <div 
            className="validation-tooltip absolute" 
            style={{ 
              bottom: '40px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--TextBlack)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '500',
              zIndex: 1000,
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
            }}
          >
            Please fill in this field.
            <div 
              className="tooltip-arrow absolute" 
              style={{
                bottom: '-6px',
                left: '50%',
                marginLeft: '-6px',
                borderWidth: '6px 6px 0',
                borderStyle: 'solid',
                borderColor: 'var(--TextBlack) transparent transparent transparent'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
