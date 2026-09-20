import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Copy, 
  Check, 
  RotateCcw, 
  Calculator, 
  Sparkles,
  Ruler,
  Scale,
  Thermometer,
  Boxes,
  Maximize,
  Gauge,
  Clock,
  HardDrive
} from 'lucide-react';

type UnitCategory = 'length' | 'weight' | 'temperature' | 'volume' | 'area' | 'speed' | 'time' | 'data';

interface UnitDef {
  id: string;
  name: string;
  symbol: string;
  toBase?: (val: number) => number;
  fromBase?: (val: number) => number;
  rate?: number; // relative to base unit
}

interface CategoryDef {
  name: string;
  icon: React.FC<{ size?: number; className?: string }>;
  baseUnit: string;
  units: UnitDef[];
  defaultFrom: string;
  defaultTo: string;
}

const CATEGORIES: Record<UnitCategory, CategoryDef> = {
  length: {
    name: 'Length',
    icon: Ruler,
    baseUnit: 'm',
    defaultFrom: 'm',
    defaultTo: 'ft',
    units: [
      { id: 'km', name: 'Kilometer', symbol: 'km', rate: 1000 },
      { id: 'm', name: 'Meter', symbol: 'm', rate: 1 },
      { id: 'cm', name: 'Centimeter', symbol: 'cm', rate: 0.01 },
      { id: 'mm', name: 'Millimeter', symbol: 'mm', rate: 0.001 },
      { id: 'mi', name: 'Mile', symbol: 'mi', rate: 1609.344 },
      { id: 'yd', name: 'Yard', symbol: 'yd', rate: 0.9144 },
      { id: 'ft', name: 'Foot', symbol: 'ft', rate: 0.3048 },
      { id: 'in', name: 'Inch', symbol: 'in', rate: 0.0254 },
      { id: 'nmi', name: 'Nautical Mile', symbol: 'nmi', rate: 1852 },
    ]
  },
  weight: {
    name: 'Weight / Mass',
    icon: Scale,
    baseUnit: 'kg',
    defaultFrom: 'kg',
    defaultTo: 'lb',
    units: [
      { id: 't', name: 'Metric Ton', symbol: 't', rate: 1000 },
      { id: 'kg', name: 'Kilogram', symbol: 'kg', rate: 1 },
      { id: 'g', name: 'Gram', symbol: 'g', rate: 0.001 },
      { id: 'mg', name: 'Milligram', symbol: 'mg', rate: 0.000001 },
      { id: 'lb', name: 'Pound', symbol: 'lb', rate: 0.45359237 },
      { id: 'oz', name: 'Ounce', symbol: 'oz', rate: 0.028349523125 },
      { id: 'st', name: 'Stone', symbol: 'st', rate: 6.35029318 },
    ]
  },
  temperature: {
    name: 'Temperature',
    icon: Thermometer,
    baseUnit: 'C',
    defaultFrom: 'C',
    defaultTo: 'F',
    units: [
      {
        id: 'C',
        name: 'Celsius',
        symbol: '°C',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        id: 'F',
        name: 'Fahrenheit',
        symbol: '°F',
        toBase: (v) => (v - 32) * (5 / 9),
        fromBase: (v) => (v * (9 / 5)) + 32,
      },
      {
        id: 'K',
        name: 'Kelvin',
        symbol: 'K',
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      }
    ]
  },
  volume: {
    name: 'Volume',
    icon: Boxes,
    baseUnit: 'l',
    defaultFrom: 'l',
    defaultTo: 'gal',
    units: [
      { id: 'm3', name: 'Cubic Meter', symbol: 'm³', rate: 1000 },
      { id: 'l', name: 'Liter', symbol: 'L', rate: 1 },
      { id: 'ml', name: 'Milliliter', symbol: 'mL', rate: 0.001 },
      { id: 'gal', name: 'Gallon (US)', symbol: 'gal', rate: 3.785411784 },
      { id: 'qt', name: 'Quart (US)', symbol: 'qt', rate: 0.946352946 },
      { id: 'pt', name: 'Pint (US)', symbol: 'pt', rate: 0.473176473 },
      { id: 'cup', name: 'Cup (US)', symbol: 'cup', rate: 0.2365882365 },
      { id: 'floz', name: 'Fluid Ounce (US)', symbol: 'fl oz', rate: 0.0295735295625 },
      { id: 'tbsp', name: 'Tablespoon (US)', symbol: 'tbsp', rate: 0.0147867647813 },
      { id: 'tsp', name: 'Teaspoon (US)', symbol: 'tsp', rate: 0.00492892159375 },
    ]
  },
  area: {
    name: 'Area',
    icon: Maximize,
    baseUnit: 'm2',
    defaultFrom: 'm2',
    defaultTo: 'ft2',
    units: [
      { id: 'km2', name: 'Square Kilometer', symbol: 'km²', rate: 1000000 },
      { id: 'ha', name: 'Hectare', symbol: 'ha', rate: 10000 },
      { id: 'm2', name: 'Square Meter', symbol: 'm²', rate: 1 },
      { id: 'ac', name: 'Acre', symbol: 'ac', rate: 4046.8564224 },
      { id: 'yd2', name: 'Square Yard', symbol: 'yd²', rate: 0.83612736 },
      { id: 'ft2', name: 'Square Foot', symbol: 'ft²', rate: 0.09290304 },
      { id: 'in2', name: 'Square Inch', symbol: 'in²', rate: 0.00064516 },
    ]
  },
  speed: {
    name: 'Speed',
    icon: Gauge,
    baseUnit: 'ms',
    defaultFrom: 'kmh',
    defaultTo: 'mph',
    units: [
      { id: 'ms', name: 'Meters / Second', symbol: 'm/s', rate: 1 },
      { id: 'kmh', name: 'Kilometers / Hour', symbol: 'km/h', rate: 1 / 3.6 },
      { id: 'mph', name: 'Miles / Hour', symbol: 'mph', rate: 0.44704 },
      { id: 'kn', name: 'Knot', symbol: 'kn', rate: 0.5144444444 },
      { id: 'fts', name: 'Feet / Second', symbol: 'ft/s', rate: 0.3048 },
    ]
  },
  time: {
    name: 'Time',
    icon: Clock,
    baseUnit: 's',
    defaultFrom: 'h',
    defaultTo: 'min',
    units: [
      { id: 'ms', name: 'Millisecond', symbol: 'ms', rate: 0.001 },
      { id: 's', name: 'Second', symbol: 's', rate: 1 },
      { id: 'min', name: 'Minute', symbol: 'min', rate: 60 },
      { id: 'h', name: 'Hour', symbol: 'h', rate: 3600 },
      { id: 'd', name: 'Day', symbol: 'd', rate: 86400 },
      { id: 'wk', name: 'Week', symbol: 'wk', rate: 604800 },
      { id: 'mo', name: 'Month (30.4d)', symbol: 'mo', rate: 2629800 },
      { id: 'yr', name: 'Year (365d)', symbol: 'yr', rate: 31536000 },
    ]
  },
  data: {
    name: 'Digital Data',
    icon: HardDrive,
    baseUnit: 'B',
    defaultFrom: 'MB',
    defaultTo: 'GB',
    units: [
      { id: 'b', name: 'Bit', symbol: 'b', rate: 0.125 },
      { id: 'B', name: 'Byte', symbol: 'B', rate: 1 },
      { id: 'KB', name: 'Kilobyte (Decimal)', symbol: 'KB', rate: 1000 },
      { id: 'MB', name: 'Megabyte (Decimal)', symbol: 'MB', rate: 1000000 },
      { id: 'GB', name: 'Gigabyte (Decimal)', symbol: 'GB', rate: 1000000000 },
      { id: 'TB', name: 'Terabyte (Decimal)', symbol: 'TB', rate: 1000000000000 },
      { id: 'KiB', name: 'Kibibyte (Binary)', symbol: 'KiB', rate: 1024 },
      { id: 'MiB', name: 'Mebibyte (Binary)', symbol: 'MiB', rate: 1048576 },
      { id: 'GiB', name: 'Gibibyte (Binary)', symbol: 'GiB', rate: 1073741824 },
      { id: 'TiB', name: 'Tebibyte (Binary)', symbol: 'TiB', rate: 1099511627776 },
    ]
  }
};

export const UnitConverterWidget: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<UnitCategory>('length');
  const [fromUnitId, setFromUnitId] = useState<string>(CATEGORIES.length.defaultFrom);
  const [toUnitId, setToUnitId] = useState<string>(CATEGORIES.length.defaultTo);
  const [inputValue, setInputValue] = useState<string>('1');
  const [precision, setPrecision] = useState<number>(4);
  const [copied, setCopied] = useState<boolean>(false);

  const categoryDef = CATEGORIES[activeCategory];

  const handleCategoryChange = (cat: UnitCategory) => {
    setActiveCategory(cat);
    setFromUnitId(CATEGORIES[cat].defaultFrom);
    setToUnitId(CATEGORIES[cat].defaultTo);
  };

  const handleSwapUnits = () => {
    setFromUnitId(toUnitId);
    setToUnitId(fromUnitId);
  };

  // Conversion calculations
  const { resultValue, formattedResult, formulaNote } = useMemo(() => {
    const num = parseFloat(inputValue);
    if (isNaN(num)) {
      return { resultValue: null, formattedResult: '0', formulaNote: '' };
    }

    const fromDef = categoryDef.units.find(u => u.id === fromUnitId);
    const toDef = categoryDef.units.find(u => u.id === toUnitId);

    if (!fromDef || !toDef) {
      return { resultValue: null, formattedResult: '0', formulaNote: '' };
    }

    let baseVal = 0;
    if (fromDef.toBase) {
      baseVal = fromDef.toBase(num);
    } else if (fromDef.rate !== undefined) {
      baseVal = num * fromDef.rate;
    }

    let convertedVal = 0;
    if (toDef.fromBase) {
      convertedVal = toDef.fromBase(baseVal);
    } else if (toDef.rate !== undefined) {
      convertedVal = baseVal / toDef.rate;
    }

    // Format output
    let formatted = '';
    if (Math.abs(convertedVal) > 0 && (Math.abs(convertedVal) < 0.0001 || Math.abs(convertedVal) >= 1e9)) {
      formatted = convertedVal.toExponential(precision);
    } else {
      formatted = parseFloat(convertedVal.toFixed(precision)).toString();
    }

    // Calculate 1 unit baseline formula
    let oneBase = fromDef.toBase ? fromDef.toBase(1) : (fromDef.rate || 1);
    let oneConverted = toDef.fromBase ? toDef.fromBase(oneBase) : oneBase / (toDef.rate || 1);
    let formulaStr = `1 ${fromDef.symbol} = ${parseFloat(oneConverted.toFixed(6))} ${toDef.symbol}`;

    return {
      resultValue: convertedVal,
      formattedResult: formatted,
      formulaNote: formulaStr
    };
  }, [inputValue, fromUnitId, toUnitId, categoryDef, precision]);

  const handleCopyResult = async () => {
    if (!formattedResult) return;
    try {
      await navigator.clipboard.writeText(formattedResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Category Selection Tabs */}
      <div 
        className="rounded-2xl border p-2 flex flex-wrap gap-1.5 overflow-x-auto"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {(Object.keys(CATEGORIES) as UnitCategory[]).map((catKey) => {
          const cat = CATEGORIES[catKey];
          const Icon = cat.icon;
          const isActive = activeCategory === catKey;

          return (
            <button
              key={catKey}
              type="button"
              onClick={() => handleCategoryChange(catKey)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
                isActive ? 'shadow-xs' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? 'var(--accent-contrast)' : 'var(--text-secondary)'
              }}
            >
              <Icon size={15} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Interactive Conversion Workspace */}
      <div 
        className="rounded-2xl border p-6 sm:p-8 space-y-8 shadow-xs"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {/* Precision & Fast Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Active Category:
            </span>
            <span className="font-bold px-2.5 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--accent)' }}>
              {categoryDef.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--text-muted)' }}>Decimal Precision:</span>
            <select
              value={precision}
              onChange={(e) => setPrecision(parseInt(e.target.value, 10))}
              className="px-2 py-1 rounded-md text-xs font-medium border cursor-pointer focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="2">2 decimal places</option>
              <option value="4">4 decimal places</option>
              <option value="6">6 decimal places</option>
              <option value="8">8 decimal places</option>
            </select>
          </div>
        </div>

        {/* The Two Panels: FROM | SWAP | TO */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* FROM INPUT BOX */}
          <div 
            className="md:col-span-5 rounded-2xl border p-5 flex flex-col justify-between min-h-[140px]"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="unit-from-input" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                From
              </label>
              <select
                value={fromUnitId}
                onChange={(e) => setFromUnitId(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                {categoryDef.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>

            <input
              id="unit-from-input"
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0"
              className="w-full text-2xl sm:text-3xl font-extrabold bg-transparent border-none outline-none tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* SWAP BUTTON */}
          <div className="md:col-span-1 flex justify-center py-2 md:py-0">
            <button
              type="button"
              onClick={handleSwapUnits}
              title="Swap units"
              className="w-11 h-11 rounded-full border flex items-center justify-center transition-all hover:scale-110 shadow-xs active:scale-95"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent)'
              }}
            >
              <ArrowLeftRight size={18} />
            </button>
          </div>

          {/* TO RESULT BOX */}
          <div 
            className="md:col-span-5 rounded-2xl border p-5 flex flex-col justify-between min-h-[140px] relative"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                To (Converted Result)
              </span>
              <select
                value={toUnitId}
                onChange={(e) => setToUnitId(e.target.value)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                {categoryDef.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-baseline justify-between gap-3 overflow-hidden">
              <div 
                className="text-2xl sm:text-3xl font-extrabold truncate tracking-tight select-all"
                style={{ color: 'var(--accent)' }}
                title={formattedResult}
              >
                {formattedResult}
              </div>

              <button
                type="button"
                onClick={handleCopyResult}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border shrink-0 shadow-xs"
                style={{
                  backgroundColor: copied ? '#10b981' : 'var(--bg-surface)',
                  borderColor: copied ? '#10b981' : 'var(--border-subtle)',
                  color: copied ? '#ffffff' : 'var(--text-primary)'
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Unit relationship formula card */}
        {formulaNote && (
          <div 
            className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
              <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Formula relationship:
              </span>
              <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                {formulaNote}
              </span>
            </div>

            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              100% Client-Side IEEE 754 Floating-Point Computation
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
