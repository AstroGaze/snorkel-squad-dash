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
}

export const SalesView = ({ onBack }: SalesViewProps) => {
  const { data, isLoading, isError, error } = useOperatorsBundle();
  const createReservation = useCreateReservation();
  const { toast } = useToast();

  const [cantidadPersonas, setCantidadPersonas] = useState<number>(1);
  const [operadorSeleccionado, setOperadorSeleccionado] = useState<string>('');
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string>('');

  const operadores = useMemo(() => data?.operators ?? [], [data?.operators]);
  const operadorActual = useMemo(() => {
    const id = Number.parseInt(operadorSeleccionado, 10);
    if (Number.isNaN(id)) {
      return null;
    }
    return operadores.find((item) => item.id === id) ?? null;
  }, [operadores, operadorSeleccionado]);


  const operadorRecomendado = useMemo(() => {
    if (!operadores.length) {
      return null;
    }
    return operadores.reduce((best, current) => {
      const currentUtilisation = current.capacidadTotal > 0 ? current.clientesHoy / current.capacidadTotal : 1;
      const bestUtilisation = best.capacidadTotal > 0 ? best.clientesHoy / best.capacidadTotal : 1;
      return currentUtilisation < bestUtilisation ? current : best;
    }, operadores[0]);
  }, [operadores]);

  useEffect(() => {
    if (operadorActual?.horarios?.length) {
      setHorarioSeleccionado((prev) =>
        operadorActual.horarios.includes(prev) ? prev : operadorActual.horarios[0]
      );
    } else {
      setHorarioSeleccionado('');
    }
  }, [operadorActual]);

  const capacidadDisponible = useMemo(() => {
    if (!operadorActual) {
      return null;
    }

    if (!operadorActual.capacidadTotal || operadorActual.capacidadTotal <= 0) {
      return null;
    }

    return Math.max(operadorActual.capacidadTotal - operadorActual.clientesHoy, 0);
  }, [operadorActual]);

  const totalClientes = useMemo(() => operadores.reduce((acc, op) => acc + op.clientesHoy, 0), [operadores]);
  const capacidadTotal = useMemo(() => operadores.reduce((acc, op) => acc + op.capacidadTotal, 0), [operadores]);

  const isSubmitting = createReservation.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!operadorSeleccionado || cantidadPersonas < 1) {
      toast({
        title: 'Datos incompletos',
        description: 'Selecciona un operador y una cantidad valida de personas.',
        variant: 'destructive'
      });
      return;
    }

    const operadorId = Number.parseInt(operadorSeleccionado, 10);
    if (Number.isNaN(operadorId)) {
      toast({
        title: 'Operador invalido',
        description: 'No pudimos identificar al operador seleccionado.',
        variant: 'destructive'
      });
      return;
    }

    const operador = operadorActual;

    if (operador?.horarios.length && !horarioSeleccionado) {
      toast({
        title: 'Selecciona un horario',
        description: 'Este operador requiere elegir una hora de salida.',
        variant: 'destructive'
      });
      return;
    }

    if (operador && capacidadDisponible !== null && cantidadPersonas > capacidadDisponible) {
      const mensaje = capacidadDisponible === 0
        ? `No hay lugares disponibles con ${operador.nombre}.`
        : `Solo quedan ${capacidadDisponible} lugares disponibles con ${operador.nombre}.`;
      toast({
        title: 'Capacidad insuficiente',
        description: mensaje,
        variant: 'destructive'
      });
      return;
    }

    try {
      await createReservation.mutateAsync({
        tourOperatorId: operadorId,
        personas: cantidadPersonas,
        horaSalida: horarioSeleccionado || null
      });

      toast({
        title: 'Reserva registrada',
        description: operador
          ? `${cantidadPersonas} ${cantidadPersonas === 1 ? 'persona' : 'personas'} asignadas a ${operador.nombre}.`
          : 'El registro fue enviado a Supabase.'
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
                <span>Nueva reserva</span>
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
                    onChange={(event) => setCantidadPersonas(Math.max(1, Number.parseInt(event.target.value, 10) || 1))}
                    placeholder="Ingresa el numero de personas"
                    className="text-lg font-medium"
                    disabled={isLoading || isSubmitting || !operadores.length || capacidadDisponible === 0}
                  />
                  {operadorActual && (
                    <p className="text-sm text-muted-foreground">
                      Capacidad disponible:{' '}
                      {capacidadDisponible === null ? 'sin limite' : capacidadDisponible}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Asignar a operador</Label>
                  <Select
                    value={operadorSeleccionado}
                    onValueChange={setOperadorSeleccionado}
                    disabled={isLoading || isSubmitting || !operadores.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoading ? 'Cargando operadores' : 'Selecciona un operador'} />
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
                              {operadorRecomendado && operador.id === operadorRecomendado.id && (
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
                  {operadorRecomendado && (
                    <p className="text-sm text-muted-foreground">
                      Mejor disponibilidad: <strong>{operadorRecomendado.nombre}</strong>
                    </p>
                  )}
                </div>

                {operadorActual && (
                  <div className="space-y-2">
                    <Label htmlFor="horario">Hora de salida</Label>
                    {operadorActual.horarios.length ? (
                      <Select
                        value={horarioSeleccionado}
                        onValueChange={setHorarioSeleccionado}
                        disabled={isLoading || isSubmitting}
                      >
                        <SelectTrigger id="horario">
                          <SelectValue placeholder="Selecciona un horario" />
                        </SelectTrigger>
                        <SelectContent>
                          {operadorActual.horarios.map((hora) => (
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
                  disabled={isSubmitting || isLoading || !operadores.length || capacidadDisponible === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando
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
                  <span>Sincronizando con Supabase...</span>
                </div>
              ) : operadores.length === 0 ? (
                <p className="text-muted-foreground">No hay operadores disponibles para asignar reservas.</p>
              ) : (
                <>
                  {operadores.map((operador) => {
                    const porcentajeUso = operador.capacidadTotal > 0
                      ? (operador.clientesHoy / operador.capacidadTotal) * 100
                      : 0;
                    const isRecommended = operadorRecomendado?.id === operador.id;

                    return (
                      <div key={operador.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-foreground">{operador.nombre}</span>
                            {isRecommended && (
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
                              isRecommended ? 'bg-gradient-coral' : 'bg-gradient-ocean'
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
