import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const NotificationsTab: React.FC = () => {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        if (user) {
            loadSettings();
        }
    }, [user]);

    const loadSettings = async () => {
        const { data } = await supabase
            .from('owners')
            .select('settings')
            .eq('id', user?.id)
            .single();

        if (data?.settings?.notifications) {
            setEnabled(data.settings.notifications.enabled);
        }
    };

    const handleToggle = async (checked: boolean) => {
        setEnabled(checked);
        setLoading(true);
        try {
            const { data: currentOwner } = await supabase
                .from('owners')
                .select('settings')
                .eq('id', user?.id)
                .single();

            const newSettings = {
                ...(currentOwner?.settings || {}),
                notifications: { enabled: checked }
            };

            const { error } = await supabase
                .from('owners')
                .update({ settings: newSettings })
                .eq('id', user?.id);

            if (error) throw error;
            toast.success('Preferências de notificação atualizadas.');
        } catch (error: any) {
            toast.error('Erro ao atualizar notificações.');
            setEnabled(!checked);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-6">
                <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg h-fit">
                            <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <Label className="text-base font-semibold mb-1 block">Receber leads e notificações</Label>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                Ao desativar, você deixará de receber alertas em tempo real sobre novos leads e movimentações no sistema.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                        <Switch
                            checked={enabled}
                            onCheckedChange={handleToggle}
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <Mail className="w-4 h-4" />
                <span>E-mails de sistema e relatórios automáticos continuarão ativos.</span>
            </div>
        </div>
    );
};
