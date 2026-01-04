import { Mail, Phone, UserCog, User, ShieldSwitch } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface MemberCardProps {
    member: any;
    onUpdate: () => void;
}

export default function MemberCard({ member, onUpdate }: MemberCardProps) {
    const isBroker = member.user_type === 'broker';

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all border-none shadow-soft bg-card group">
            <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-primary/10">
                            <AvatarFallback className="bg-primary/5 text-primary font-bold text-xl uppercase">
                                {member.full_name.substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{member.full_name}</h3>
                            <Badge variant="outline" className="mt-1 gap-1 py-0 px-2 h-5 text-[10px] uppercase font-bold tracking-wider">
                                {isBroker ? <User size={10} /> : <UserCog size={10} />}
                                {isBroker ? 'Corretor' : 'Gerente'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Mail size={14} className="text-primary/60" />
                        <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone size={14} className="text-primary/60" />
                        <span>{member.phone}</span>
                    </div>
                    {isBroker && (
                        <div className="flex flex-col gap-1 pt-2 border-t mt-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground/50">Gerente Responsável</span>
                            <div className="flex items-center justify-between">
                                <span className="text-foreground font-medium">{member.manager?.full_name || 'Não atribuído'}</span>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary gap-1 hover:bg-primary/5">
                                    <ShieldSwitch size={12} />
                                    Trocar
                                </Button>
                            </div>
                        </div>
                    )}
                    {!isBroker && (
                        <div className="flex flex-col gap-1 pt-2 border-t mt-2">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground/50">Liderança</span>
                            <span className="text-foreground font-medium italic">8 corretores sob comando</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 py-3 bg-muted/30 flex justify-end gap-2 border-t">
                <Button variant="ghost" size="sm" className="h-8 text-xs">Visualizar Lances</Button>
                <Button size="sm" className="h-8 text-xs">Editar</Button>
            </div>
        </Card>
    );
}
