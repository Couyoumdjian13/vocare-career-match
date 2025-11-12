import { useState } from "react";
import { Database, Upload, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DatabasePanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function DatabasePanel({ isOpen, onToggle }: DatabasePanelProps) {
  const [csvData, setCsvData] = useState<any[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith(".csv")) {
        setFileName(file.name);
        // Simulate CSV parsing with dummy data
        setCsvData([
          { empresa: "Tech Corp", puesto: "Desarrollador Frontend", ubicacion: "Santiago" },
          { empresa: "InnovaSoft", puesto: "Data Analyst", ubicacion: "Valparaíso" },
          { empresa: "Digital Solutions", puesto: "UX Designer", ubicacion: "Santiago" },
        ]);
        toast({
          title: "✓ CSV cargado exitosamente",
          description: `${file.name} se ha conectado correctamente`,
        });
      } else {
        toast({
          title: "Formato no válido",
          description: "Por favor, sube un archivo CSV",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      {/* Toggle Button - Always visible */}
      <Button
        onClick={onToggle}
        variant="outline"
        size="icon"
        className={cn(
          "fixed top-4 z-40 rounded-full shadow-lg transition-all",
          isOpen ? "right-80" : "right-4"
        )}
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>

      {/* Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 bottom-0 w-80 bg-background border-l border-border transition-transform duration-300 z-30",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Base de datos de ofertas</h2>
          </div>

          <Card className="p-4 mb-4 border-dashed border-2 border-muted-foreground/20 hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="csv-upload"
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center cursor-pointer py-4"
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-center mb-1">
                Subir archivo CSV
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Arrastra o haz clic para seleccionar
              </p>
            </label>
          </Card>

          {fileName && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-primary/10 rounded-lg">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium truncate">{fileName}</span>
            </div>
          )}

          {csvData && (
            <div className="flex-1 flex flex-col">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                Vista previa de ofertas
              </h3>
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  {csvData.map((row, index) => (
                    <Card key={index} className="p-3 hover:shadow-md transition-shadow">
                      <h4 className="font-medium text-sm mb-1">{row.puesto}</h4>
                      <p className="text-xs text-muted-foreground">{row.empresa}</p>
                      <p className="text-xs text-muted-foreground">{row.ubicacion}</p>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
              <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
                Actualizar conexión
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
