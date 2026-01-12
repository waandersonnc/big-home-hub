import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { AvatarUpload } from '@/components/Settings/AvatarUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export const ProfileTab: React.FC = () => {
    const { user, refreshUser } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        document: '',
        avatar_url: ''
    });

    useEffect(() => {
        if (user) {
            loadUserData();
        }
    }, [user]);

    const loadUserData = async () => {
        const { data, error } = await supabase
            .from('owners')
            .select('name, email, phone, document, avatar_url')
            .eq('id', user?.id)
            .single();

        if (data) {
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                document: data.document || '',
                avatar_url: data.avatar_url || ''
            });
        }
    };

    const handlePhoneMask = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .substring(0, 15);
    };

    const handleCPFMask = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            .substring(0, 14);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim().length < 3) {
            toast.error('O nome deve ter pelo menos 3 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('owners')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    document: formData.document,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

            if (error) throw error;

            toast.success('Pefil atualizado com sucesso!');
            await refreshUser();
        } catch (error: any) {
            toast.error('Erro ao atualizar perfil: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h3 className="text-lg font-medium mb-4">Sua Foto</h3>
                <AvatarUpload
                    currentUrl={formData.avatar_url}
                    onUploadSuccess={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
                    onRemoveSuccess={() => setFormData(prev => ({ ...prev, avatar_url: '' }))}
                />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Seu nome"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail (Não editável)</Label>
                        <Input
                            id="email"
                            value={formData.email}
                            disabled
                            className="bg-slate-50 dark:bg-slate-900 opacity-70 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: handlePhoneMask(e.target.value) }))}
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="document">CPF (Opcional)</Label>
                        <Input
                            id="document"
                            value={formData.document}
                            onChange={(e) => setFormData(prev => ({ ...prev, document: handleCPFMask(e.target.value) }))}
                            placeholder="000.000.000-00"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Button type="submit" disabled={loading} className="w-full md:w-auto">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Salvar Alterações'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};
