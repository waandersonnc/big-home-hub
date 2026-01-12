import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { storageService } from '@/services/storage.service';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';

interface ImageUploadProps {
    onUpload: (url: string) => void;
    defaultImage?: string;
    type: 'profile' | 'company';
    userId?: string;
    companyId?: string;
}

export function ImageUpload({ onUpload, defaultImage, type, userId, companyId }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(defaultImage || null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (file.size > 3 * 1024 * 1024) {
            toast({
                title: "Arquivo muito grande",
                description: "O tamanho máximo permitido é 3MB.",
                variant: "destructive",
            });
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                title: "Formato inválido",
                description: "Use JPEG, PNG ou WebP.",
                variant: "destructive",
            });
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setIsUploading(true);
        try {
            let url = '';
            if (type === 'profile' && userId) {
                url = await storageService.uploadProfilePhoto(userId, file);
            } else if (type === 'company' && userId && companyId) {
                url = await storageService.uploadCompanyLogo(userId, companyId, file);
            }

            onUpload(url);
            toast({ title: "Upload concluído!" });
        } catch (error) {
            const err = error as Error;
            logger.error('Erro no upload de imagem:', err.message);
            toast({
                title: "Erro no upload",
                description: err.message || "Não foi possível enviar a imagem.",
                variant: "destructive",
            });
            setPreview(defaultImage || null);
        } finally {
            setIsUploading(false);
        }
    };

    const clearImage = () => {
        setPreview(null);
        onUpload('');
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <Avatar className={`h-32 w-32 border-4 border-background shadow-soft ${type === 'company' ? 'rounded-2xl' : ''}`}>
                    <AvatarImage src={preview || ''} className="object-cover" />
                    <AvatarFallback className="bg-muted">
                        {type === 'profile' ? <Camera className="h-8 w-8 text-muted-foreground" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                    </AvatarFallback>
                </Avatar>

                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-6 w-6 text-white" />
                </div>

                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                )}

                {preview && !isUploading && (
                    <button
                        onClick={clearImage}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-soft"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
            >
                {preview ? 'Alterar imagem' : 'Selecionar imagem'}
            </Button>
        </div>
    );
}
