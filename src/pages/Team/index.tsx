import { useState, useEffect } from 'react';
import { Plus, Search, UserCog, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCompany } from '@/contexts/CompanyContext';
import { teamService } from '@/services/team.service';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MemberCard from './MemberCard';
import AddMemberModal from './AddMemberModal';

export default function Team() {
    const { selectedCompanyId } = useCompany();
    const [managers, setManagers] = useState<any[]>([]);
    const [brokers, setBrokers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { toast } = useToast();

    const fetchData = async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const [m, b] = await Promise.all([
                teamService.listManagers(selectedCompanyId),
                teamService.listBrokers(selectedCompanyId)
            ]);
            setManagers(m);
            setBrokers(b);
        } catch (error: any) {
            toast({ title: "Erro ao buscar equipe", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedCompanyId]);

    const filteredManagers = managers.filter(m =>
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredBrokers = brokers.filter(b =>
        b.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
                    <p className="text-muted-foreground">Gerencie seus gerentes e corretores em um só lugar.</p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 h-12 px-6 shadow-soft">
                    <Plus size={20} />
                    Adicionar Membro
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    placeholder="Buscar membro pelo nome ou e-mail..."
                    className="pl-10 h-12 bg-card border-none shadow-soft"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Tabs defaultValue="managers" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-xl w-full max-w-md">
                    <TabsTrigger value="managers" className="flex-1 rounded-lg gap-2">
                        <UserCog size={16} />
                        Gerentes ({managers.length})
                    </TabsTrigger>
                    <TabsTrigger value="brokers" className="flex-1 rounded-lg gap-2">
                        <User size={16} />
                        Corretores ({brokers.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="managers" className="animate-slide-in-left outline-none">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                    ) : filteredManagers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredManagers.map(m => (
                                <MemberCard key={m.id} member={m} onUpdate={fetchData} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
                            <p className="text-muted-foreground">Nenhum gerente encontrado.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="brokers" className="animate-slide-in-left outline-none">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                    ) : filteredBrokers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBrokers.map(b => (
                                <MemberCard key={b.id} member={b} onUpdate={fetchData} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-card rounded-2xl border border-dashed">
                            <p className="text-muted-foreground">Nenhum corretor encontrado.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <AddMemberModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchData}
                managers={managers}
            />
        </div>
    );
}
