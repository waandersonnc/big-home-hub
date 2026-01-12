import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Camera, Trash2, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AvatarUploadProps {
    currentUrl?: string;
    onUploadSuccess: (url: string) => void;
    onRemoveSuccess: () => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentUrl, onUploadSuccess, onRemoveSuccess }) => {
    const { user, isDemo } = useAuthContext();
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (isDemo) {
            toast.error('Modo demonstração: não é possível alterar a foto.');
            return;
        }

        // Validations
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error('Formato inválido. Use JPG, PNG ou WEBP.');
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            toast.error('O arquivo deve ter no máximo 3MB.');
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        setIsUploading(true);
        try {
            if (!user) throw new Error('Usuário não autenticado');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('profile-photos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profile-photos')
                .getPublicUrl(filePath);

            // Update Database
            const { error: updateError } = await supabase
                .from('owners')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            onUploadSuccess(publicUrl);
            toast.success('Foto de perfil atualizada!');
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error('Erro ao fazer upload da foto: ' + error.message);
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = async () => {
        if (!window.confirm('Tem certeza que deseja remover sua foto de perfil?')) return;

        try {
            if (!user) throw new Error('Usuário não autenticado');

            const { error } = await supabase
                .from('owners')
                .update({ avatar_url: null })
                .eq('id', user.id);

            if (error) throw error;

            onRemoveSuccess();
            setPreviewUrl(null);
            toast.success('Foto de perfil removida.');
        } catch (error: any) {
            toast.error('Erro ao remover foto: ' + error.message);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-primary/20 dark:bg-slate-800">
                    {(previewUrl || currentUrl) ? (
                        <img
                            src={previewUrl || currentUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <User className="w-16 h-16 text-slate-400" />
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    disabled={isUploading}
                >
                    <Camera size={18} />
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />

            {currentUrl && !isUploading && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash2 size={14} className="mr-2" />
                    Remover foto
                </Button>
            )}
        </div>
    );
};
