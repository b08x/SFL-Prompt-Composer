
import { useState, useEffect } from 'react';
import { validatePrompt } from '../services/geminiService';
import type { SFLPrompt, ValidationResult } from '../types';
import { getGeminiError } from '../utils/errorHandler';

const DEBOUNCE_TIME = 1000; // 1 second

const initialValidationResult: ValidationResult = {
    score: 0,
    assessment: 'Awaiting analysis...',
    issues: [],
};

export const usePromptValidator = (promptComponents: SFLPrompt) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [validationResult, setValidationResult] = useState<ValidationResult>(initialValidationResult);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        // Set up a timer for debouncing
        const handler = setTimeout(async () => {
            try {
                setError(null);
                const result = await validatePrompt(promptComponents);
                setValidationResult(result);
            } catch (e) {
                console.error("Validation failed:", e);
                setError(getGeminiError(e));
                setValidationResult({
                    ...initialValidationResult,
                    assessment: 'Analysis failed.',
                    score: 0,
                })
            } finally {
                setIsLoading(false);
            }
        }, DEBOUNCE_TIME);

        // Cleanup function to clear the timeout if the component unmounts or dependencies change
        return () => {
            clearTimeout(handler);
        };
    }, [promptComponents]); // Re-run the effect whenever promptComponents changes

    return { validationResult, isLoading, error };
};
