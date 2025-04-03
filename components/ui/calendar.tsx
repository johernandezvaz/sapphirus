import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, ButtonProps } from "react-day-picker";

// Definimos manualmente el tipo correcto
interface CustomNavButtonProps extends ButtonProps {
  next: boolean; // Añadimos la propiedad que falta
}

export function Calendar(props: any) {
  return (
    <DayPicker
      {...props}
      components={{
        NavButton: ({ next, ...props }: CustomNavButtonProps) => (
          <button {...props} className="p-2">
            {next ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        ),
      }}
    />
  );
}
