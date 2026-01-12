import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { Camera, Trash2, Loader2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LogoUploadProps {
    companyId: string;
    currentUrl?: string;
    onUploadSuccess: (url: string) => void;
    onRemoveSuccess: () => void;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({ companyId, currentUrl, onUploadSuccess, onRemoveSuccess }) => {
    const { isDemo } = useAuthContext();
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (isDemo) {
            toast.error('Modo demonstração: não é possível fazer upload.');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!validTypes.includes(file.type)) {
            toast.error('Formato inválido. Use JPG, PNG, WEBP ou SVG.');
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            toast.error('O arquivo deve ter no máximo 3MB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${companyId}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('profile-photos') // Using the same bucket for logos too
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('profile-photos')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('real_estate_companies')
                .update({ logo_url: publicUrl })
                .eq('id', companyId);

            if (updateError) throw updateError;

            onUploadSuccess(publicUrl);
            toast.success('Logo da imobiliária atualizada!');
        } catch (error: any) {
            console.error('Error uploading logo:', error);
            toast.error('Erro ao fazer upload da logo: ' + error.message);
            setPreviewUrl(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemove = async () => {
        if (isDemo) {
            toast.error('Modo demonstração: não é possível remover.');
            return;
        }

        if (!window.confirm('Tem certeza que deseja remover a logo da imobiliária?')) return;

        try {
            const { error } = await supabase
                .from('real_estate_companies')
                .update({ logo_url: null })
                .eq('id', companyId);

            if (error) throw error;

            onRemoveSuccess();
            setPreviewUrl(null);
            toast.success('Logo removida.');
        } catch (error: any) {
            toast.error('Erro ao remover logo: ' + error.message);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <div className="w-48 h-24 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-primary/20 dark:bg-slate-800">
                    {(previewUrl || currentUrl) ? (
                        <img
                            src={previewUrl || currentUrl}
                            alt="Logo"
                            className="w-full h-full object-contain p-2"
                        />
                    ) : (
                        <Building className="w-12 h-12 text-slate-400" />
                    )}

                    {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                    )}
                </div>

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                    disabled={isUploading}
                >
                    <Camera size={16} />
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
                    Remover logo
                </Button>
            )}
        </div>
    );
};
