import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Store, User, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComingSoonModal } from '@/components/ComingSoonModal';

export default function PreSignup() {
    const navigate = useNavigate();
    const [comingSoonTitle, setComingSoonTitle] = useState<string | null>(null);

    const profiles = [
        {
            id: 'constructor',
            title: 'Dono de CONSTRUTORA',
            description: 'Gerencie obras, lançamentos e leads de grandes empreendimentos.',
            icon: Building2,
            soon: true,
        },
        {
            id: 'agency',
            title: 'Dono de IMOBILIÁRIA',
            description: 'Controle sua equipe, estoque e pipeline de vendas em um só lugar.',
            icon: Store,
            soon: false,
        },
        {
            id: 'broker',
            title: 'Corretor Autônomo',
            description: 'Organize seus leads e imóveis de forma simples e eficiente.',
            icon: User,
            soon: true,
        }
    ];

    const handleSelect = (profile: typeof profiles[0]) => {
        if (profile.soon) {
            setComingSoonTitle(profile.title);
        } else if (profile.id === 'agency') {
            navigate('/signup/owner');
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div className="p-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="gap-2 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o Login
                </Button>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-5xl space-y-12 animate-fade-in">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold text-foreground">Crie sua conta</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Escolha o tipo de conta que deseja criar para começar a transformar seu negócio imobiliário.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {profiles.map((profile, index) => {
                            const Icon = profile.icon;
                            return (
                                <Card
                                    key={profile.id}
                                    className={`relative group cursor-pointer border-2 transition-all duration-300 hover:border-primary hover:shadow-elevated animate-scale-in`}
                                    style={{ animationDelay: `${index * 100}ms` }}
                                    onClick={() => handleSelect(profile)}
                                >
                                    <CardHeader className="space-y-4">
                                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                                            <Icon className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                                {profile.title}
                                            </CardTitle>
                                            {profile.soon && (
                                                <span className="absolute top-4 right-4 bg-secondary text-primary-dark text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                                    Em breve
                                                </span>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <CardDescription className="text-base leading-relaxed">
                                            {profile.description}
                                        </CardDescription>
                                        <div className="flex items-center text-sm font-semibold text-primary opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                                            Selecionar Perfil
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>

            <ComingSoonModal
                isOpen={!!comingSoonTitle}
                onClose={() => setComingSoonTitle(null)}
                title={comingSoonTitle || ''}
            />
        </div>
    );
}
