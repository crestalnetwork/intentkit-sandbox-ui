import React, { useState } from "react";
import { AgentTemplate, AGENT_TEMPLATES } from "../lib/utils/templates";

interface TemplateSelectorProps {
  onTemplateSelect: (template: AgentTemplate) => void;
  onClose: () => void;
  isVisible: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  onClose,
  isVisible,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!isVisible) return null;

  const categories = Array.from(
    new Set(AGENT_TEMPLATES.map((template) => template.category))
  );

  const filteredTemplates = selectedCategory
    ? AGENT_TEMPLATES.filter(
        (template) => template.category === selectedCategory
      )
    : AGENT_TEMPLATES;

  const getCategoryDisplayName = (category: string) => {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#c9d1d9]">
            Choose an Agent Template
          </h2>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-[#c9d1d9] transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Description */}
        <p className="text-[#8b949e] mb-6">
          Select a pre-configured template to quickly create an agent with
          specific capabilities and skills.
        </p>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedCategory === null
                  ? "bg-[#58a6ff] text-white"
                  : "bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d]"
              }`}
            >
              All Templates
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedCategory === category
                    ? "bg-[#58a6ff] text-white"
                    : "bg-[#21262d] text-[#c9d1d9] hover:bg-[#30363d]"
                }`}
              >
                {getCategoryDisplayName(category)}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 hover:border-[#58a6ff] transition-colors cursor-pointer"
              onClick={() => onTemplateSelect(template)}
            >
              {/* Template Header */}
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">{template.icon}</span>
                <h3 className="text-lg font-medium text-[#c9d1d9] flex-1">
                  {template.name}
                </h3>
              </div>

              {/* Template Description */}
              <p className="text-[#8b949e] text-sm mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Skills Preview */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-[#c9d1d9] mb-2">
                  Included Skills:
                </h4>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(template.skills).map((skillName) => (
                    <span
                      key={skillName}
                      className="inline-flex items-center bg-[#21262d] text-[#58a6ff] text-xs px-2 py-1 rounded"
                    >
                      {skillName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Category Badge */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#8b949e] bg-[#21262d] px-2 py-1 rounded">
                  {getCategoryDisplayName(template.category)}
                </span>
                <button className="text-xs text-[#58a6ff] hover:text-[#79c0ff] transition-colors">
                  Use Template →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#30363d]">
          <p className="text-xs text-[#8b949e]">
            Templates provide pre-configured agents with specific skills and
            purposes. You can customize them further after creation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;
