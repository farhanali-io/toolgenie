import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ 
  name, 
  className = '', 
  size = 22,
  style
}) => {
  // Access Lucide icon dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icons = LucideIcons as Record<string, any>;
  const IconComponent = Icons[name] || LucideIcons.Wrench;

  return (
    <IconComponent 
      size={size} 
      className={className} 
      style={style}
      aria-hidden="true" 
    />
  );
};
