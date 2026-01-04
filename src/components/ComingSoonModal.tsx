import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
}

export function ComingSoonModal({ isOpen, onClose, title }: ComingSoonModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md animate-scale-in">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        🚀 Em Breve
                    </DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        Estamos trabalhando intensamente para liberar o acesso para{' '}
                        <span className="font-semibold text-primary">{title}</span>.
                        <br /><br />
                        Em breve você poderá aproveitar todas as funcionalidades do BigHome Hub específicas para o seu perfil.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end pt-4">
                    <Button onClick={onClose} className="px-8">
                        Entendido
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
