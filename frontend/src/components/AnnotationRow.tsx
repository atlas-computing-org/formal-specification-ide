import React, { useState } from 'react';
import { TextMappingWithText, TextLabelWithText, TextRangeWithText } from '@common/annotations.ts';

function isTextMapping(item: TextMappingWithText | TextLabelWithText): item is TextMappingWithText {
  return 'lhsRanges' in item;
}

interface AnnotationRowProps {
  item: TextMappingWithText | TextLabelWithText;
  isHighlighted: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDescriptionChange: (newDescription: string) => void;
  className?: string;
  dataIndex?: number;
}

export const AnnotationRow: React.FC<AnnotationRowProps> = ({
  item,
  isHighlighted,
  onMouseEnter,
  onMouseLeave,
  onDescriptionChange,
  className = '',
  dataIndex,
}) => {
  const [editingCell, setEditingCell] = useState<'first' | 'second' | null>(null);
  const [editValue, setEditValue] = useState(item.description);

  const handleDoubleClick = (cell: 'first' | 'second') => {
    setEditingCell(cell);
  };

  const handleBlur = () => {
    setEditingCell(null);
    onDescriptionChange(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue(item.description);
    }
  };

  const getLabelType = () => {
    if (item.isError) return 'error';
    if (item.isWarning) return 'warning';
    return 'default';
  };

  const renderContent = (ranges: TextRangeWithText[]) => {
    return (
      <div className="cell content">
        {ranges.map((range, index) => (
          <div key={index} className="range">
            <span className="index">{range.start}-{range.end}: </span>
            <span className="text">{range.text}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderDescriptionCell = (cell: 'first' | 'second') => {
    const isEditing = editingCell === cell;
    return (
      <div 
        className="cell description" 
        onDoubleClick={() => handleDoubleClick(cell)}
      >
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          item.description
        )}
      </div>
    );
  };

  const labelType = getLabelType();
  const rowClassName = `row ${className} ${labelType} ${isHighlighted ? 'highlight' : ''}`;

  return isTextMapping(item) ? (
    <div
      className={rowClassName}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-index={dataIndex}
    >
      {renderDescriptionCell('first')}
      {renderContent(item.lhsRanges)}
      {renderDescriptionCell('second')}
      {renderContent(item.rhsRanges)}
    </div>
  ) : (
    <div
      className={rowClassName}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-index={dataIndex}
    >
      {renderDescriptionCell('first')}
      {renderContent(item.ranges)}
    </div>
  );
}; 