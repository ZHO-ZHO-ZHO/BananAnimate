import React from 'react';
import { AppStep } from '../types.js';

const steps = [
  { id: 1, label: 'Upload Assets', step: AppStep.UPLOAD },
  { id: 2, label: 'Configure & Generate', step: AppStep.GENERATE },
  { id: 3, label: 'View Result', step: AppStep.RESULT },
];

const getStepStatus = (stepEnum, currentAppStep) => {
  if (stepEnum === currentAppStep) {
    return 'active';
  }
  if (currentAppStep > stepEnum) {
    return 'completed';
  }
  return 'upcoming';
};

const StepIndicator = ({ currentStep }) =>
  React.createElement(
    'nav',
    { 'aria-label': 'Progress' },
    React.createElement(
      'ol',
      {
        role: 'list',
        className: 'space-y-4 md:flex md:space-x-8 md:space-y-0',
      },
      steps.map((step) => {
        const status = getStepStatus(step.step, currentStep);
        let content;
        if (status === 'completed') {
          content = React.createElement(
            'div',
            {
              className:
                'group flex w-full flex-col border-l-4 border-indigo-600 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4',
            },
            React.createElement(
              'span',
              { className: 'text-sm font-medium text-indigo-400 transition-colors' },
              `Step ${step.id}`
            ),
            React.createElement(
              'span',
              { className: 'text-sm font-medium text-gray-300' },
              step.label
            )
          );
        } else if (status === 'active') {
          content = React.createElement(
            'div',
            {
              className:
                'flex w-full flex-col border-l-4 border-indigo-600 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4',
              'aria-current': 'step',
            },
            React.createElement(
              'span',
              { className: 'text-sm font-medium text-indigo-400' },
              `Step ${step.id}`
            ),
            React.createElement(
              'span',
              { className: 'text-sm font-medium text-gray-300' },
              step.label
            )
          );
        } else {
          content = React.createElement(
            'div',
            {
              className:
                'group flex w-full flex-col border-l-4 border-gray-700 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4',
            },
            React.createElement(
              'span',
              { className: 'text-sm font-medium text-gray-500 transition-colors' },
              `Step ${step.id}`
            ),
            React.createElement(
              'span',
              { className: 'text-sm font-medium text-gray-500' },
              step.label
            )
          );
        }
        return React.createElement(
          'li',
          { key: step.label, className: 'md:flex-1' },
          content
        );
      })
    )
  );

export default StepIndicator;
