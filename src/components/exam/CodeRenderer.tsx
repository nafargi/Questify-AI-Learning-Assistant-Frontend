import React from 'react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import { Code, Terminal, Lightning } from '@phosphor-icons/react';

interface CodeRendererProps {
    question: {
        question_id: string;
        question: string;
        content: {
            problem_statement: string;
            initial_code?: string;
            solution_code?: string;
        };
    };
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export const CodeRenderer: React.FC<CodeRendererProps> = ({
    question,
    value,
    onChange,
    disabled
}) => {
    const { problem_statement, initial_code } = question.content;

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

                <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 text-sm md:text-base leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap">
                    {problem_statement}
                </div>

                <div className="relative group rounded-3xl overflow-hidden border border-white/5 bg-[#0d1117] transition-all duration-500 focus-within:ring-2 ring-primary/20">
                    <div className="bg-[#161b22] px-6 py-3 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                                <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                            </div>
                            <div className="h-4 w-[1px] bg-white/10 mx-2" />
                            <div className="flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
                                <span className="text-[10px] font-black font-mono text-muted-foreground uppercase tracking-widest">
                                    solution.py
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-[9px] font-mono text-muted-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Line 1, Col 1
                             </div>
                             <Code className="w-4 h-4 text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer" weight="bold" />
                        </div>
                    </div>

                    <textarea
                        disabled={disabled}
                        value={value || initial_code || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={cn(
                            "w-full h-[400px] p-8 bg-transparent text-[#e6edf3] font-mono text-sm md:text-base resize-none focus:outline-none focus:ring-0 custom-scrollbar leading-relaxed",
                            disabled && "opacity-60 grayscale-[0.5]"
                        )}
                        placeholder="# Write your logic here..."
                        spellCheck={false}
                    />

                    <div className="absolute bottom-6 right-6 flex items-center gap-3">
                        <div className="bg-primary/20 backdrop-blur-xl border border-primary/20 px-4 py-1.5 rounded-xl text-[10px] font-black font-mono text-primary-foreground/90 uppercase">
                            {value ? `${value.length} characters` : '0 characters'}
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary/20 overflow-hidden">
                        <div className={cn(
                            "h-full bg-primary transition-all duration-1000",
                            value ? "w-full" : "w-0"
                        )} />
                    </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-4 px-2 italic uppercase tracking-widest font-bold">
                    <Lightning className="w-3.5 h-3.5 text-amber-500" weight="fill" />
                    Syntax verification will run post-submission
                </div>
            </CardContent>
        </Card>
    );
};
