
import React from 'react';
import { Button } from './ui/Button';
import { VALIDATION_ICON, ERROR_ICON, WARNING_ICON, INFO_ICON } from '../constants';
import type { ValidationResult, ValidationIssue, Severity, GrammarAspect, SFLComponent } from '../types';

interface ValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    validationResult: ValidationResult | null;
    isLoading: boolean;
}

const severityConfig: Record<Severity, { icon: React.ReactNode; color: string; ringColor: string }> = {
    error: { icon: ERROR_ICON, color: 'text-red-400', ringColor: 'ring-red-500/30' },
    warning: { icon: WARNING_ICON, color: 'text-yellow-400', ringColor: 'ring-yellow-500/30' },
    info: { icon: INFO_ICON, color: 'text-sky-400', ringColor: 'ring-sky-500/30' },
};

const grammarConfig: Record<GrammarAspect, { color: string }> = {
    Functional: { color: 'bg-blue-500/20 text-blue-300' },
    Generative: { color: 'bg-green-500/20 text-green-300' },
    Pragmatic: { color: 'bg-purple-500/20 text-purple-300' },
};

const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
};

const groupIssuesByComponent = (issues: ValidationIssue[]) => {
    return issues.reduce((acc, issue) => {
        const component = issue.component;
        if (!acc[component]) {
            acc[component] = [];
        }
        acc[component].push(issue);
        return acc;
    }, {} as Record<SFLComponent, ValidationIssue[]>);
};

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-5 bg-slate-700 rounded w-1/2"></div>
        <div className="space-y-3">
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
        </div>
        <div className="h-5 bg-slate-700 rounded w-1/3 mt-6"></div>
         <div className="space-y-3">
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        </div>
    </div>
);


export const ValidationModal: React.FC<ValidationModalProps> = ({ isOpen, onClose, validationResult, isLoading }) => {
    if (!isOpen) return null;
    
    const issues = validationResult?.issues || [];
    const groupedIssues = groupIssuesByComponent(issues);
    const componentOrder: SFLComponent[] = ['Cross-Component', 'Field', 'Tenor', 'Mode'];

    return (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
            <div 
                className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-3xl transform transition-all flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 text-violet-400 flex-shrink-0">{VALIDATION_ICON}</span>
                        <h2 className="text-2xl font-bold text-slate-100">
                            Prompt Analysis
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                        <span className="sr-only">Close analysis</span>
                    </button>
                </div>
                
                <div className="max-h-[70vh] overflow-y-auto pr-4 -mr-4 flex-grow">
                    {isLoading && !validationResult ? <LoadingSkeleton /> : (
                        <>
                            <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-lg mb-6 border border-slate-700/50">
                                <div>
                                    <p className="text-sm text-slate-400">Coherence Score</p>
                                    <p className={`text-3xl font-bold ${getScoreColor(validationResult?.score ?? 0)}`}>
                                        {validationResult?.score ?? 0}
                                        <span className="text-lg">/100</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                     <p className="font-semibold text-slate-200">{validationResult?.assessment}</p>
                                     <p className="text-sm text-slate-400">{issues.length} issue{issues.length !== 1 && 's'} found</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                {issues.length === 0 && !isLoading ? (
                                    <div className="text-center py-10 flex flex-col items-center justify-center h-full">
                                        <span className="w-12 h-12 mx-auto text-green-500 block">{VALIDATION_ICON}</span>
                                        <p className="mt-4 font-semibold text-slate-200">No issues found!</p>
                                        <p className="text-sm text-slate-400">This prompt is well-structured and coherent.</p>
                                    </div>
                                ) : (
                                   componentOrder.map(component => {
                                       if (!groupedIssues[component] || groupedIssues[component].length === 0) return null;

                                       return (
                                            <div key={component}>
                                                <h3 className="font-semibold text-slate-300 text-base mb-3 border-b border-slate-700 pb-2">{component.replace('-', ' ')}</h3>
                                                <div className="space-y-4">
                                                {groupedIssues[component].map(issue => (
                                                    <div key={issue.id} className="flex items-start gap-4">
                                                        <div className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center ring-2 mt-0.5 ${severityConfig[issue.severity].ringColor}`}>
                                                            <span className={`w-5 h-5 ${severityConfig[issue.severity].color}`}>{severityConfig[issue.severity].icon}</span>
                                                        </div>
                                                        <div className="flex-grow">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-slate-300 font-medium text-sm">
                                                                    {issue.message}
                                                                </p>
                                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${grammarConfig[issue.grammar].color}`}>
                                                                  {issue.grammar}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-400 text-sm mt-1">
                                                                <strong className="text-slate-300">Suggestion:</strong> {issue.suggestion}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                </div>
                                            </div>
                                       )
                                   })
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700 flex justify-end flex-shrink-0">
                    <Button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 focus:ring-slate-500">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};
