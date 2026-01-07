import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message = "Carregando a experiência BigHome..." }: LoadingScreenProps) {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-md">
            <div className="relative flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
                {/* Logo or Brand Element */}
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 shadow-glass border border-white/20 overflow-hidden">
                        <img src="/logo.png" alt="BigHome" className="h-16 w-16 object-contain" />
                    </div>
                </div>

                {/* Progress Element */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <h2 className="text-xl font-semibold tracking-tight text-foreground">
                            {message}
                        </h2>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-[240px] text-center leading-relaxed">
                        Prepare-se para transformar a gestão de seu negócio imobiliário.
                    </p>
                </div>

                {/* Decorative dots */}
                <div className="flex gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        </div>
    );
}
