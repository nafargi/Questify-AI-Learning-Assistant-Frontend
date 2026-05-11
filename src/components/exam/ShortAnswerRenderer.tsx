import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { cn } from '../../lib/utils';
import { PencilSimple, Brain, CheckCircle } from '@phosphor-icons/react';

interface ShortAnswerRendererProps {
    question: {
        question_id: string;
        question: string;
        content: {
            model_answer?: string;
        };
    };
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export const ShortAnswerRenderer: React.FC<ShortAnswerRendererProps> = ({
    question,
    value,
    onChange,
    disabled
}) => {
    const wordCount = value ? value.split(/\s+/).filter(Boolean).length : 0;

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

                <div className="relative group rounded-3xl overflow-hidden border-2 border-border/50 bg-card/40 transition-all duration-300 focus-within:border-primary focus-within:bg-background">
                    <div className="bg-muted/30 px-6 py-2.5 border-b border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <PencilSimple className="w-4 h-4 text-primary" weight="bold" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Drafting Area</span>
                        </div>
                        <div className={cn(
                            "text-[10px] font-black uppercase tracking-widest transition-colors",
                            wordCount > 0 ? "text-primary" : "text-muted-foreground/50"
                        )}>
                            {wordCount} Words
                        </div>
                    </div>

                    <Textarea
                        disabled={disabled}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={cn(
                            "w-full min-h-[250px] p-8 bg-transparent border-none focus-visible:ring-0 resize-none text-base md:text-lg leading-relaxed placeholder:text-muted-foreground/30 placeholder:italic",
                            disabled && "opacity-80"
                        )}
                        placeholder="Synthesize your explanation here..."
                        spellCheck={true}
                    />
                    
                    <div className="absolute bottom-4 right-6 pointer-events-none">
                        <Brain className={cn(
                            "w-6 h-6 transition-all duration-500",
                            wordCount > 20 ? "text-primary opacity-20 scale-125" : "text-muted-foreground opacity-5 scale-100"
                        )} weight="fill" />
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-4 px-2 italic uppercase tracking-[0.2em] font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" weight="fill" />
                    Conceptual depth is prioritised over length
                </div>
            </CardContent>
        </Card>
    );
};
