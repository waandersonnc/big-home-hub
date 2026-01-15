import { CircleCheck, Info, LoaderCircle, OctagonX, TriangleAlert } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      closeButton // Adds the 'X' button
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4 text-blue-600" />,
        warning: <TriangleAlert className="h-4 w-4 text-amber-600" />,
        error: <OctagonX className="h-4 w-4 text-red-600" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        // Using a long duration for errors by default to simulate "only close on click"
        // Sonner doesn't have a simple global 'error-only-infinite' prop, 
        // but we can style them very clearly.
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-[0_20px_50px_rgba(0,0,0,0.2)] group-[.toaster]:border-[1.5px]",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error: "group-[.toast]:bg-red-50 group-[.toast]:text-red-900 group-[.toast]:border-red-300 group-[.toast]:shadow-red-900/10",
          success: "group-[.toast]:bg-green-50 group-[.toast]:text-green-900 group-[.toast]:border-green-300 group-[.toast]:shadow-green-900/10",
          warning: "group-[.toast]:bg-amber-50 group-[.toast]:text-amber-900 group-[.toast]:border-amber-300",
          info: "group-[.toast]:bg-blue-50 group-[.toast]:text-blue-900 group-[.toast]:border-blue-300",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
