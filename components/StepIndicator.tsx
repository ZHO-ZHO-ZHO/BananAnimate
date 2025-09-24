
import React from 'react';
import { AppStep } from '../types';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const steps = [
  { id: 1, label: 'Upload Assets', step: AppStep.UPLOAD },
  { id: 2, label: 'Configure & Generate', step: AppStep.GENERATE },
  { id: 3, label: 'View Result', step: AppStep.RESULT },
];

const getStepStatus = (stepEnum: AppStep, currentAppStep: AppStep) => {
  if (stepEnum === currentAppStep) {
    return 'active';
  }
  if (currentAppStep > stepEnum) {
    return 'completed';
  }
  return 'upcoming';
};

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, index) => {
          const status = getStepStatus(step.step, currentStep);
          return (
             <li key={step.label} className="md:flex-1">
              {status === 'completed' ? (
                <div className="group flex w-full flex-col border-l-4 border-indigo-600 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-sm font-medium text-indigo-400 transition-colors ">{`Step ${step.id}`}</span>
                  <span className="text-sm font-medium text-gray-300">{step.label}</span>
                </div>
              ) : status === 'active' ? (
                <div className="flex w-full flex-col border-l-4 border-indigo-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4" aria-current="step">
                  <span className="text-sm font-medium text-indigo-400">{`Step ${step.id}`}</span>
                  <span className="text-sm font-medium text-gray-300">{step.label}</span>
                </div>
              ) : (
                <div className="group flex w-full flex-col border-l-4 border-gray-700 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                  <span className="text-sm font-medium text-gray-500 transition-colors">{`Step ${step.id}`}</span>
                  <span className="text-sm font-medium text-gray-500">{step.label}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepIndicator;
