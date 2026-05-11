import React from 'react';
import { MCQRenderer } from './MCQRenderer';
import { TFRenderer } from './TFRenderer';
import { MatchingRenderer } from './MatchingRenderer';
import { FillBlankRenderer } from './FillBlankRenderer';
import { CodeRenderer } from './CodeRenderer';
import { ShortAnswerRenderer } from './ShortAnswerRenderer';
import { ExamQuestion } from '@/services/api';

interface QuestionRendererProps {
    question: ExamQuestion;
    value?: any;
    onChange: (answer: any) => void;
    disabled?: boolean;
}

export function QuestionRenderer({ question, value, onChange, disabled }: QuestionRendererProps) {
    if (!question) return <div className="p-8 text-center text-muted-foreground italic border-2 border-dashed rounded-3xl">Question data missing...</div>;

    switch (question.question_type) {
        case 'Multiple Choice':
            return (
                <MCQRenderer
                    question={question as any}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            );

        case 'True/False':
            return (
                <TFRenderer
                    question={question as any}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            );

        case 'Matching':
            return (
                <MatchingRenderer
                    question={question as any}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            );

        case 'Fill in Blank':
            return (
                <FillBlankRenderer
                    question={question as any}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            );

        case 'Coding':
            return (
                <CodeRenderer
                    question={question as any}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            );

        case 'Short Answer':
            return (
                <ShortAnswerRenderer
                    question={question as any}
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            );

        default:
            return (
                <div className="p-4 rounded-xl border border-dashed border-muted text-muted-foreground text-center">
                    Unsupported question type: {question.question_type}
                </div>
            );
    }
}

