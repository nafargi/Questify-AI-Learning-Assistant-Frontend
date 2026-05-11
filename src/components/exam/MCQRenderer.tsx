import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { cn } from '../../lib/utils';
import { CheckCircle } from '@phosphor-icons/react';

interface MCQRendererProps {
    question: {
        question_id: string;
        question: string;
        content: {
            options: string[];
        };
    };
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export const MCQRenderer: React.FC<MCQRendererProps> = ({
    question,
    value,
    onChange,
    disabled
}) => {
    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-6">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <span className="text-primary font-black text-sm">Q</span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground leading-tight pt-1">
                        {question.question}
                    </h3>
                </div>
                
                <RadioGroup
                    value={value}
                    onValueChange={onChange}
                    disabled={disabled}
                    className="grid gap-3"
                >
                    {question?.content?.options ? question.content.options.map((option, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center space-x-3 p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                                value === option
                                    ? "border-primary bg-primary/[0.03] ring-1 ring-primary"
                                    : "border-border/50 bg-card/40 hover:border-primary/50 hover:bg-primary/[0.02]"
                            )}
                            onClick={() => !disabled && onChange(option)}
                        >
                            <RadioGroupItem value={option} id={`${question.question_id}-${index}`} className="sr-only" />
                            <div className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                value === option ? "border-primary bg-primary scale-110" : "border-muted-foreground/30 group-hover:border-primary"
                            )}>
                                {value === option && (
                                    <div className="w-2 h-2 rounded-full bg-primary-foreground animate-in zoom-in duration-300" />
                                )}
                            </div>
                            <Label
                                htmlFor={`${question.question_id}-${index}`}
                                className="flex-1 cursor-pointer font-bold text-sm md:text-base text-foreground leading-snug"
                            >
                                {option}
                            </Label>
                            
                            {value === option && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary animate-in fade-in slide-in-from-right-2 duration-500">
                                    <CheckCircle className="w-5 h-5" weight="fill" />
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="p-4 rounded-xl border border-dashed text-center text-muted-foreground italic">
                            No options provided for this question.
                        </div>
                    )}
                </RadioGroup>
            </CardContent>
        </Card>
    );
};

