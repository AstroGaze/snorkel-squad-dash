import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, Ship, Plus, CheckCircle, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const tourOperators = [
  { id: 1, nombre: "Coral Adventures", clientesHoy: 12, capacidadTotal: 35 },
  { id: 2, nombre: "Deep Blue Tours", clientesHoy: 8, capacidadTotal: 30 },
  { id: 3, nombre: "Ocean Explorer", clientesHoy: 15, capacidadTotal: 34 },
  { id: 4, nombre: "Reef Discoveries", clientesHoy: 6, capacidadTotal: 22 },
  { id: 5, nombre: "Marine Paradise", clientesHoy: 4, capacidadTotal: 18 }
];

interface SalesViewProps {
  onBack: () => void;
}

export const SalesView = ({ onBack }: SalesViewProps) => {
  const [cantidadPersonas, setCantidadPersonas] = useState<number>(1);
  const [operadorSeleccionado, setOperadorSeleccionado] = useState<string>("");
  const [operadores, setOperadores] = useState(tourOperators);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Función para encontrar el operador con menos clientes
  const getOperadorRecomendado = () => {
    return operadores.reduce((min, current) => 
      current.clientesHoy < min.clientesHoy ? current : min
    );
  };

  // Función para obtener el operador más equilibrado basado en porcentaje de capacidad
  const getOperadorMasEquilibrado = () => {
    return operadores.reduce((best, current) => {
      const currentUtilization = (current.clientesHoy / current.capacidadTotal) * 100;
      const bestUtilization = (best.clientesHoy / best.capacidadTotal) * 100;
      return currentUtilization < bestUtilization ? current : best;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!operadorSeleccionado || cantidadPersonas < 1) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos correctamente",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simular procesamiento
    setTimeout(() => {
      // Actualizar el operador seleccionado
      setOperadores(prev => prev.map(op => 
        op.id.toString() === operadorSeleccionado 
          ? { ...op, clientesHoy: op.clientesHoy + cantidadPersonas }
          : op
      ));

      toast({
        title: "¡Reserva registrada!",
        description: `${cantidadPersonas} ${cantidadPersonas === 1 ? 'persona asignada' : 'personas asignadas'} a ${operadores.find(op => op.id.toString() === operadorSeleccionado)?.nombre}`,
      });

      // Reset form
      setCantidadPersonas(1);
      setOperadorSeleccionado("");
      setIsSubmitting(false);
    }, 1000);
  };

  const operadorRecomendado = getOperadorMasEquilibrado();

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-card shadow-ocean border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={onBack} className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="p-2 rounded-lg bg-gradient-ocean">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Panel de Ventas</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de Reserva */}
          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-primary" />
                <span>Nueva Reserva</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="personas">Cantidad de Personas</Label>
                  <Input
                    id="personas"
                    type="number"
                    min="1"
                    max="20"
                    value={cantidadPersonas}
                    onChange={(e) => setCantidadPersonas(parseInt(e.target.value) || 1)}
                    placeholder="Ingresa el número de personas"
                    className="text-lg font-medium"
                  />
                  <p className="text-sm text-muted-foreground">
                    Máximo 20 personas por reserva
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operador">Tour Operador</Label>
                  <Select value={operadorSeleccionado} onValueChange={setOperadorSeleccionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tour operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operadores.map((operador) => (
                        <SelectItem key={operador.id} value={operador.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{operador.nombre}</span>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge variant="outline" className="text-xs">
                                {operador.clientesHoy}/{operador.capacidadTotal}
                              </Badge>
                              {operador.id === operadorRecomendado.id && (
                                <Badge variant="secondary" className="text-xs">
                                  Recomendado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Se recomienda: <strong>{operadorRecomendado.nombre}</strong> (mejor disponibilidad)
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="ocean"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Registrar Reserva
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Estado Actual de Operadores */}
          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Ship className="h-5 w-5 text-secondary" />
                <span>Estado Actual</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                Distribución actual de clientes por operador
              </div>
              
              {operadores.map((operador) => {
                const porcentajeUso = (operador.clientesHoy / operador.capacidadTotal) * 100;
                const isRecomendado = operador.id === operadorRecomendado.id;
                
                return (
                  <div key={operador.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-foreground">{operador.nombre}</span>
                        {isRecomendado && (
                          <Badge variant="secondary" className="text-xs">
                            Recomendado
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {operador.clientesHoy}/{operador.capacidadTotal} ({Math.round(porcentajeUso)}%)
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isRecomendado ? 'bg-gradient-coral' : 'bg-gradient-ocean'
                        }`}
                        style={{ width: `${Math.min(porcentajeUso, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 p-4 bg-gradient-surface rounded-lg border border-border">
                <h4 className="font-medium text-foreground mb-2">Estadísticas del Día</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Clientes</p>
                    <p className="font-bold text-primary">
                      {operadores.reduce((acc, op) => acc + op.clientesHoy, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Capacidad Total</p>
                    <p className="font-bold text-secondary">
                      {operadores.reduce((acc, op) => acc + op.capacidadTotal, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};