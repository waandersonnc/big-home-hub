import React from 'react';
import { Globe, Timer } from 'lucide-react';

export const LanguageTab: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-muted rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Globe className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Tradução Multi-idioma</h3>
            <div className="flex items-center gap-2 text-muted-foreground bg-white dark:bg-slate-800 px-4 py-2 rounded-full border shadow-sm">
                <Timer size={16} />
                <span className="font-medium">Em breve...</span>
            </div>
            <p className="text-sm text-muted-foreground mt-4 max-w-xs text-center">
                Estamos trabalhando para trazer suporte completo a Inglês e Espanhol em breve.
            </p>
        </div>
    );
};
