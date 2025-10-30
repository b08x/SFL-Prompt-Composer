
export const getGeminiError = (error: unknown): string => {
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
        if (error.message.includes('SAFETY')) {
            errorMessage = 'The request was blocked due to safety concerns. Please modify your content and try again.';
        } else if (error.message.includes('400')) {
            errorMessage = 'The request was invalid, possibly due to the prompt content. Please review and try again.';
        } else if (error.message.includes('API key')) {
            errorMessage = 'There is an issue with the API key configuration.';
        } else if (error.message.includes('429')) {
            errorMessage = 'You have exceeded your API quota. Please check your billing account or try again later.';
        } else if (error.message.includes('500') || error.message.includes('503')) {
            errorMessage = 'The service is temporarily unavailable. Please try again later.';
        } else {
            errorMessage = error.message; // Use the raw message for other cases
        }
    }
    return errorMessage;
};
