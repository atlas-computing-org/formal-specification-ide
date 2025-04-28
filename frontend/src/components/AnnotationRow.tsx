import React, { useState } from 'react';
import { TextMappingWithText, TextLabelWithText, TextRangeWithText, Direction } from '@common/annotations.ts';
import { useDoubleClickDisambiguator } from '../hooks/useDoubleClickDisambiguator.ts';

// Type definitions
export type MappingClickHandler = (params: {
  mapping: TextMappingWithText;
  clickedRange?: {
    range: TextRangeWithText;
    direction: Direction;
  };
}) => void;

export type LabelClickHandler = (params: {
  label: TextLabelWithText;
  clickedRange?: TextRangeWithText;
  direction: Direction;
}) => void;

interface AnnotationRowBaseProps {
  isHighlighted: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDescriptionChange: (newDescription: string) => void;
  className?: string;
  dataIndex?: number;
}

interface MappingRowProps extends AnnotationRowBaseProps {
  item: TextMappingWithText;
  onClick: MappingClickHandler;
}

interface LabelRowProps extends AnnotationRowBaseProps {
  item: TextLabelWithText;
  onClick: LabelClickHandler;
  direction: Direction;
}

type AnnotationRowProps = MappingRowProps | LabelRowProps;

function isTextMapping(item: TextMappingWithText | TextLabelWithText): item is TextMappingWithText {
  return 'lhsRanges' in item;
}

function isMappingRowProps(props: AnnotationRowProps): props is MappingRowProps {
  return isTextMapping(props.item);
}

// Component
export const AnnotationRow: React.FC<AnnotationRowProps> = (props) => {
  const isMappingRow = isMappingRowProps(props);
  const { item, onMouseEnter, onMouseLeave, onDescriptionChange, isHighlighted, className, dataIndex } = props;

  // State and hooks
  const [editingCell, setEditingCell] = useState<'first' | 'second' | null>(null);
  const [editValue, setEditValue] = useState(item.description);
  const { handleClick, handleDoubleClick } = useDoubleClickDisambiguator();

  // Event handlers
  const handleDoubleClickCell = (cell: 'first' | 'second') => {
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

  // Derived values
  const getLabelType = () => {
    if (item.isError) return 'error';
    if (item.isWarning) return 'warning';
    return 'default';
  };

  // Render functions
  const renderContent = (ranges: TextRangeWithText[]) => {
    return (
      <div className="cell content">
        {ranges.map((range, index) => (
          <div
            key={index}
            className="range"
            onClick={(e) => {
              e.stopPropagation();
              if (isMappingRow) {
                const { item, onClick } = props;
                const direction = item.lhsRanges.includes(range) ? 'lhs' : 'rhs';
                onClick({ mapping: item, clickedRange: { range, direction } });
              } else {
                const { item, onClick, direction } = props;
                onClick({ label: item, clickedRange: range, direction });
              }
            }}
          >
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
        onDoubleClick={() => handleDoubleClick(() => handleDoubleClickCell(cell))}
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
          item.description || "[no description]"
        )}
      </div>
    );
  };

  const labelType = getLabelType();
  const rowClassName = `row ${className} ${labelType} ${isHighlighted ? 'highlight' : ''}`;

  // Main render
  if (isMappingRow) {
    const { item, onClick } = props;
    return (
      <div
        className={rowClassName}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={() => handleClick(() => onClick({ mapping: item }))}
        data-index={dataIndex}
      >
        {renderDescriptionCell('first')}
        {renderContent(item.lhsRanges)}
        {renderDescriptionCell('second')}
        {renderContent(item.rhsRanges)}
      </div>
    );
  } else {
    const { item, onClick, direction } = props;
    return (
      <div
        className={rowClassName}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={() => handleClick(() => onClick({ label: item, direction }))}
        data-index={dataIndex}
      >
        {renderDescriptionCell('first')}
        {renderContent(item.ranges)}
      </div>
    );
  }
};