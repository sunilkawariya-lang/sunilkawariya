import React from 'react';

interface PrecisionInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export const PrecisionInput: React.FC<PrecisionInputProps> = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step, 
  suffix, 
  prefix,
  className = ""
}) => {
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-bold text-slate-700">{label}</label>
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            {prefix && <span className="text-xs font-bold text-slate-400 mr-1">{prefix}</span>}
            <input 
              type="number" 
              value={value}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) onChange(val);
              }}
              min={min}
              max={max}
              step={step}
              className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-right transition-all"
            />
            {suffix && <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{suffix}</span>}
          </div>
        </div>
      </div>
      <input 
        type="range" min={min} max={max} step={step}
        value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
      />
    </div>
  );
};
