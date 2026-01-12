import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sun, Moon } from 'lucide-react';

export const AppearanceTab: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="space-y-6">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {theme === 'light' ? (
                            <Sun className="w-6 h-6 text-orange-500" />
                        ) : (
                            <Moon className="w-6 h-6 text-blue-400" />
                        )}
                        <div>
                            <h4 className="font-medium">Tema do Sistema</h4>
                            <p className="text-sm text-muted-foreground">
                                Escolha entre o modo claro e escuro para sua interface.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{theme === 'light' ? 'Light' : 'Dark'}</span>
                        <Switch
                            checked={theme === 'dark'}
                            onCheckedChange={toggleTheme}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => theme !== 'light' && toggleTheme()}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border grayscale opacity-50'
                        }`}
                >
                    <div className="w-full h-24 rounded bg-white border border-slate-200 mb-3 overflow-hidden">
                        <div className="h-4 w-full bg-slate-100 border-b border-slate-200 p-1 flex gap-1">
                            <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                            <div className="h-2 w-2 rounded-full bg-slate-300"></div>
                        </div>
                        <div className="p-2 space-y-2">
                            <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
                            <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                    <span className="font-medium">Modo Claro</span>
                </button>

                <button
                    onClick={() => theme !== 'dark' && toggleTheme()}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border grayscale opacity-50'
                        }`}
                >
                    <div className="w-full h-24 rounded bg-slate-900 border border-slate-800 mb-3 overflow-hidden">
                        <div className="h-4 w-full bg-slate-800 border-b border-slate-700 p-1 flex gap-1">
                            <div className="h-2 w-2 rounded-full bg-slate-600"></div>
                            <div className="h-2 w-2 rounded-full bg-slate-600"></div>
                        </div>
                        <div className="p-2 space-y-2">
                            <div className="h-2 w-3/4 bg-slate-800 rounded"></div>
                            <div className="h-2 w-1/2 bg-slate-800 rounded"></div>
                        </div>
                    </div>
                    <span className="font-medium">Modo Escuro</span>
                </button>
            </div>
        </div>
    );
};
