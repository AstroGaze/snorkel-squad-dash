import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Ship, Plus, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreateReservation, useOperatorsBundle } from '@/hooks/useOperatorsData';

interface SalesViewProps {
  onBack: () => void;
  sessionToken: string;
}

const calcularCarga = (clientes: number, capacidad: number) => {
  if (capacidad <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return clientes / capacidad;
};

export const SalesView = ({ onBack, sessionToken }: SalesViewProps) => {
  const { data, isLoading, isError, error } = useOperatorsBundle();
  const createReservation = useCreateReservation();
  const { toast } = useToast();

  const [cantidadPersonas, setCantidadPersonas] = useState<number>(1);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string>('');

  const operadores = useMemo(() => data?.operators ?? [], [data?.operators]);

  const operadoresElegibles = useMemo(() => {
    if (!operadores.length || cantidadPersonas < 1) {
      return [];
    }

    return operadores.filter((operador) => {
      const capacidadLibre = operador.capacidadTotal - operador.clientesHoy;
      return capacidadLibre >= cantidadPersonas;
    });
  }, [operadores, cantidadPersonas]);

  const operadorAsignado = useMemo(() => {
    if (!operadoresElegibles.length) {
      return null;
    }

    return operadoresElegibles.reduce((best, current) => {
      const bestLoad = calcularCarga(best.clientesHoy, best.capacidadTotal);
      const currentLoad = calcularCarga(current.clientesHoy, current.capacidadTotal);

      if (currentLoad === bestLoad) {
        const bestSlack = best.capacidadTotal - best.clientesHoy;
        const currentSlack = current.capacidadTotal - current.clientesHoy;

        if (currentSlack === bestSlack) {
          return current.nombre.localeCompare(best.nombre) < 0 ? current : best;
        }

        return currentSlack > bestSlack ? current : best;
      }

      return currentLoad < bestLoad ? current : best;
    }, operadoresElegibles[0]);
  }, [operadoresElegibles]);

  const capacidadDisponible = useMemo(() => {
    if (!operadorAsignado) {
      return null;
    }
    return Math.max(operadorAsignado.capacidadTotal - operadorAsignado.clientesHoy, 0);
  }, [operadorAsignado]);

  useEffect(() => {
    if (operadorAsignado?.horarios?.length) {
      setHorarioSeleccionado((prev) =>
        operadorAsignado.horarios.includes(prev) ? prev : operadorAsignado.horarios[0]
      );
    } else {
      setHorarioSeleccionado('');
    }
  }, [operadorAsignado]);

  const totalClientes = useMemo(() => operadores.reduce((acc, op) => acc + op.clientesHoy, 0), [operadores]);
  const capacidadTotal = useMemo(() => operadores.reduce((acc, op) => acc + op.capacidadTotal, 0), [operadores]);

  const isSubmitting = createReservation.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!operadorAsignado) {
      toast({
        title: 'Sin capacidad',
        description: 'No hay operadores disponibles para esta cantidad.',
        variant: 'destructive',
      });
      return;
    }

    if (capacidadDisponible !== null && capacidadDisponible < cantidadPersonas) {
      const mensaje = capacidadDisponible === 0
        ? `No hay lugares disponibles con ${operadorAsignado.nombre}.`
        : `Solo quedan ${capacidadDisponible} lugares disponibles con ${operadorAsignado.nombre}.`;
      toast({ title: 'Capacidad insuficiente', description: mensaje, variant: 'destructive' });
      return;
    }

    if (operadorAsignado.horarios.length && !horarioSeleccionado) {
      toast({
        title: 'Selecciona un horario',
        description: 'El operador asignado requiere elegir una hora de salida.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createReservation.mutateAsync({
        tourOperatorId: operadorAsignado.id,
        personas: cantidadPersonas,
        horaSalida: horarioSeleccionado || undefined,
        sessionToken,
      });

      toast({
        title: 'Reserva asignada',
        description: `${cantidadPersonas} ${cantidadPersonas === 1 ? 'persona' : 'personas'} asignadas a ${operadorAsignado.nombre}.`,
      });

      setCantidadPersonas(1);
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : 'No se pudo registrar la reserva.';
      toast({ title: 'Error al registrar', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isError && (
          <Card className="mb-6 border-destructive/50">
            <CardContent className="py-6">
              <p className="text-destructive">
                No fue posible cargar la informacion de operadores: {error?.message ?? 'Error desconocido'}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-primary" />
                <span>Registro de reserva</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="personas">Cantidad de personas</Label>
                  <Input
                    id="personas"
                    type="number"
                    min="1"
                    max={capacidadDisponible !== null ? Math.max(capacidadDisponible, 1) : 50}
                    value={cantidadPersonas}
                    onChange={(event) => {
                      const parsed = Number.parseInt(event.target.value, 10);
                      const safeValue = Math.max(1, Number.isNaN(parsed) ? 1 : parsed);
                      setCantidadPersonas(capacidadDisponible !== null ? Math.min(safeValue, capacidadDisponible) : safeValue);
                    }}
                    placeholder="Ingresa el numero de personas"
                    className="text-lg font-medium"
                    disabled={isLoading || isSubmitting || !operadores.length || capacidadDisponible === 0}
                  />
                  {operadorAsignado ? (
                    <p className="text-sm text-muted-foreground">
                      Capacidad disponible con {operadorAsignado.nombre}: {capacidadDisponible}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Ajusta la cantidad para encontrar un operador con cupo.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Operador asignado (Least Loaded)</Label>
                  <Card className="border-dashed bg-gradient-surface">
                    <CardContent className="py-4">
                      {operadorAsignado ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">{operadorAsignado.nombre}</span>
                            <Badge variant="secondary">Asignado automaticamente</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Carga actual: {operadorAsignado.clientesHoy}/{operadorAsignado.capacidadTotal}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No hay operadores con capacidad suficiente para {cantidadPersonas} personas.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {operadorAsignado && (
                  <div className="space-y-2">
                    <Label htmlFor="horario">Hora de salida</Label>
                    {operadorAsignado.horarios.length ? (
                      <Select
                        value={horarioSeleccionado}
                        onValueChange={setHorarioSeleccionado}
                        disabled={isLoading || isSubmitting}
                      >
                        <SelectTrigger id="horario">
                          <SelectValue placeholder="Selecciona un horario" />
                        </SelectTrigger>
                        <SelectContent>
                          {operadorAsignado.horarios.map((hora) => (
                            <SelectItem key={hora} value={hora}>
                              {hora}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Este operador no tiene horarios definidos. La reserva se guardara sin hora especifica.
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  variant="ocean"
                  disabled={
                    isSubmitting ||
                    isLoading ||
                    !operadores.length ||
                    !operadorAsignado ||
                    capacidadDisponible === 0
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Registrar reserva
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Ship className="h-5 w-5 text-secondary" />
                <span>Estado actual</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="py-8 flex flex-col items-center space-y-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Sincronizando datos...</span>
                </div>
              ) : operadores.length === 0 ? (
                <p className="text-muted-foreground">No hay operadores disponibles para asignar reservas.</p>
              ) : (
                <>
                  {operadores.map((operador) => {
                    const porcentajeUso = operador.capacidadTotal > 0
                      ? (operador.clientesHoy / operador.capacidadTotal) * 100
                      : 0;
                    const isAsignado = operadorAsignado?.id === operador.id;

                    return (
                      <div key={operador.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-foreground">{operador.nombre}</span>
                            {isAsignado && (
                              <Badge variant="secondary" className="text-xs">Asignado</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {operador.clientesHoy}/{operador.capacidadTotal} ({Math.round(porcentajeUso)}%)
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isAsignado ? 'bg-gradient-coral' : 'bg-gradient-ocean'
                            }`}
                            style={{ width: `${Math.min(porcentajeUso, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-6 p-4 bg-gradient-surface rounded-lg border border-border">
                    <h4 className="font-medium text-foreground mb-2">Estadisticas del dia</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total clientes</p>
                        <p className="font-bold text-primary">{totalClientes}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Capacidad total</p>
                        <p className="font-bold text-secondary">{capacidadTotal}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

