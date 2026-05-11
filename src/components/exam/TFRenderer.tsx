import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { Check, X } from '@phosphor-icons/react';

interface TFRendererProps {
    question: {
        question_id: string;
        question: string;
        content: {
            answer: boolean;
        };
    };
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export const TFRenderer: React.FC<TFRendererProps> = ({
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

                <div className="grid grid-cols-2 gap-4">
                    <button
                        disabled={disabled}
                        onClick={() => onChange('true')}
                        className={cn(
                            "flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all gap-4 group relative overflow-hidden",
                            value === 'true'
                                ? "border-green-500 bg-green-500/[0.03] scale-[1.02]"
                                : "border-border/50 bg-card/40 hover:border-green-500/30 hover:bg-green-500/[0.01]"
                        )}
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border border-transparent",
                            value === 'true' 
                                ? "bg-green-500 text-white rotate-6" 
                                : "bg-card border-border/50 text-muted-foreground group-hover:border-green-500/50 group-hover:text-green-500"
                        )}>
                            <Check className="w-8 h-8" weight="bold" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className={cn(
                                "font-black text-xl tracking-tighter",
                                value === 'true' ? "text-green-600" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                TRUE
                            </span>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Statement is correct</p>
                        </div>
                        {value === 'true' && (
                            <div className="absolute top-3 right-3 animate-in zoom-in duration-300">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                            </div>
                        )}
                    </button>

                    <button
                        disabled={disabled}
                        onClick={() => onChange('false')}
                        className={cn(
                            "flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all gap-4 group relative overflow-hidden",
                            value === 'false'
                                ? "border-destructive bg-destructive/[0.03] scale-[1.02]"
                                : "border-border/50 bg-card/40 hover:border-destructive/30 hover:bg-destructive/[0.01]"
                        )}
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border border-transparent",
                            value === 'false' 
                                ? "bg-destructive text-white -rotate-6" 
                                : "bg-card border-border/50 text-muted-foreground group-hover:border-destructive/50 group-hover:text-destructive"
                        )}>
                            <X className="w-8 h-8" weight="bold" />
                        </div>
                        <div className="flex flex-col items-center">
                            <span className={cn(
                                "font-black text-xl tracking-tighter",
                                value === 'false' ? "text-destructive" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                FALSE
                            </span>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">Statement is flawed</p>
                        </div>
                        {value === 'false' && (
                            <div className="absolute top-3 right-3 animate-in zoom-in duration-300">
                                <div className="w-2 h-2 rounded-full bg-destructive" />
                            </div>
                        )}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
};
