import React from 'react';
import { AdminSelect } from '../AdminRating/AdminControls';
import { label as labelStyle } from './ui';

interface Option { value: string; label: string }
interface Props {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  searchable?: boolean;
  testid?: string;
}

/**
 * Unified compact dropdown for the Advertising module.
 * Uses the project's AdminSelect (the «Рейтинги» design system):
 * portal-based, viewport-aware (flips up/down), ellipsis truncation, mobile-friendly.
 */
const OptionSelect: React.FC<Props> = ({ label, value, options, onChange, placeholder, searchable, testid }) => {
  return (
    <div>
      {label ? <label style={labelStyle}>{label}</label> : null}
      <AdminSelect
        value={value}
        options={options}
        onChange={onChange}
        placeholder={placeholder || '— выберите —'}
        searchable={searchable}
        testid={testid}
        ariaLabel={label || placeholder}
      />
    </div>
  );
};

export default OptionSelect;
