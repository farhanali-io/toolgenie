import React, { useState } from 'react';
import { CategoryTabs } from './CategoryTabs';
import { ToolGrid } from './ToolGrid';
import { ToolItem } from '../types';

export const HomeToolExplorer: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleSelectTool = (tool: ToolItem) => {
    window.location.href = `/${tool.categorySlug}/${tool.slug}`;
  };

  return (
    <div id="tool-explorer-wrapper">
      <CategoryTabs 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory} 
      />
      <ToolGrid 
        selectedCategory={selectedCategory} 
        onSelectCategory={setSelectedCategory} 
        onSelectTool={handleSelectTool} 
      />
    </div>
  );
};
