import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Anchor, Users, Ship, MapPin, Clock, Phone, Mail, Plus, Edit, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import { AddTourOperatorForm } from './AddTourOperatorForm';
import { useToast } from '@/hooks/use-toast';
import {
  useDeleteTourOperator,
  useOperatorsBundle,
  useUpsertTourOperator,
  type TourOperatorInput
} from '@/hooks/useOperatorsData';
import type { TourOperator } from '@/lib/operators';

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case 'Activo':
      return 'bg-gradient-ocean text-primary-foreground';
    case 'Mantenimiento':
      return 'bg-gradient-coral text-secondary-foreground';
    case 'Reparación':
      return 'bg-destructive text-destructive-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

interface TourOperatorsViewProps {
  onBack: () => void;
}

const toFormData = (operator: TourOperator): TourOperatorInput => ({
  id: operator.id,
  nombre: operator.nombre,
  contacto: operator.contacto,
  botes: operator.botes,
  personal: operator.personal,
  capacidadTotal: operator.capacidadTotal,
  horarios: operator.horarios,
  especialidad: operator.especialidad
});

export const TourOperatorsView = ({ onBack }: TourOperatorsViewProps) => {
  const { data, isLoading, isError, error } = useOperatorsBundle();
  const upsertMutation = useUpsertTourOperator();
  const deleteMutation = useDeleteTourOperator();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingOperator, setEditingOperator] = useState<TourOperator | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const operators = useMemo(() => data?.operators ?? [], [data?.operators]);

  const totalCapacity = useMemo(() => operators.reduce((acc, operator) => acc + operator.capacidadTotal, 0), [operators]);
  const totalBoats = useMemo(() => operators.reduce((acc, operator) => acc + operator.botes.length, 0), [operators]);

  const handleCreate = () => {
    setEditingOperator(null);
    setShowForm(true);
  };

  const handleEdit = (operator: TourOperator) => {
    setEditingOperator(operator);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingOperator(null);
  };

  const handleSubmit = async (payload: TourOperatorInput) => {
    try {
      await upsertMutation.mutateAsync(payload);
      toast({ title: 'Tour operador guardado', description: 'Los datos se guardaron localmente.' });
      handleFormClose();
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : 'No se pudo guardar el operador.';
      toast({ title: 'Error al guardar', description: message, variant: 'destructive' });
    }
  };

  const handleDelete = async (operatorId: number) => {
    try {
      setDeleteTargetId(operatorId);
      await deleteMutation.mutateAsync(operatorId);
      toast({ title: 'Tour operador eliminado', description: 'El registro fue eliminado del almacenamiento local.' });
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : 'No se pudo eliminar el operador.';
      toast({ title: 'Error al eliminar', description: message, variant: 'destructive' });
    } finally {
      setDeleteTargetId(null);
    }
  };

  if (showForm) {
    return (
      <AddTourOperatorForm
        onSubmit={handleSubmit}
        onCancel={handleFormClose}
        initialData={editingOperator ? toFormData(editingOperator) : undefined}
        submitting={upsertMutation.isPending}
        title={editingOperator ? 'Editar tour operador' : 'Nuevo tour operador'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="bg-card shadow-ocean border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={onBack} className="mr-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="p-2 rounded-lg bg-gradient-ocean">
                <Ship className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Operadores turísticos</h1>
            </div>
            <Button onClick={handleCreate} variant="ocean">
              <Plus className="h-4 w-4 mr-2" />
              Agregar operador
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {isError && (
          <Card className="border-destructive/50">
            <CardContent className="py-6">
              <p className="text-destructive">
                Ocurrió un problema al cargar los operadores: {error?.message ?? 'Error desconocido'}
              </p>
            </CardContent>
          </Card>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-ocean">
            <CardHeader>
              <CardTitle>Total de operadores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{isLoading ? '' : operators.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-ocean">
            <CardHeader>
              <CardTitle>Capacidad combinada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{isLoading ? '' : totalCapacity}</p>
            </CardContent>
          </Card>
          <Card className="shadow-ocean">
            <CardHeader>
              <CardTitle>Embarcaciones registradas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{isLoading ? '' : totalBoats}</p>
            </CardContent>
          </Card>
        </section>

        {isLoading ? (
          <Card className="shadow-ocean">
            <CardContent className="py-12 flex flex-col items-center space-y-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-muted-foreground">Cargando operadores locales...</span>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {operators.length === 0 && (
              <Card className="shadow-ocean">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Aún no hay operadores registrados. Utiliza Agregar operador para crear el primero.
                </CardContent>
              </Card>
            )}

            {operators.map((operador) => (
              <Card key={operador.id} className="shadow-depth border border-border">
                <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-foreground">
                      <Anchor className="h-5 w-5 text-primary" />
                      {operador.nombre}
                      {operador.especialidad && (
                        <Badge variant="outline" className="ml-2 text-foreground">
                          {operador.especialidad}
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {operador.horarios.length} salidas · {operador.botes.length} embarcaciones · {operador.personal} personas en equipo
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(operador)} disabled={upsertMutation.isPending}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteMutation.isPending && deleteTargetId === operador.id}
                        >
                          {deleteMutation.isPending && deleteTargetId === operador.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar tour operador?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente "{operador.nombre}" y sus embarcaciones asociadas.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => handleDelete(operador.id)}
                            disabled={deleteMutation.isPending && deleteTargetId === operador.id}
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-surface rounded-lg border border-border">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">{operador.contacto.telefono || 'Sin teléfono'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">{operador.contacto.email || 'Sin correo'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm text-foreground">{operador.contacto.direccion || 'Sin dirección'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gradient-surface rounded-lg border border-border">
                      <Ship className="h-6 w-6 text-primary mx-auto mb-1" />
                      <div className="text-lg font-bold text-foreground">{operador.botes.length}</div>
                      <div className="text-sm text-muted-foreground">Embarcaciones</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-surface rounded-lg border border-border">
                      <Users className="h-6 w-6 text-secondary mx-auto mb-1" />
                      <div className="text-lg font-bold text-foreground">{operador.capacidadTotal}</div>
                      <div className="text-sm text-muted-foreground">Capacidad diaria</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-surface rounded-lg border border-border">
                      <Users className="h-6 w-6 text-accent-foreground mx-auto mb-1" />
                      <div className="text-lg font-bold text-foreground">{operador.personal}</div>
                      <div className="text-sm text-muted-foreground">Personal</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-surface rounded-lg border border-border">
                      <Clock className="h-6 w-6 text-primary mx-auto mb-1" />
                      <div className="text-lg font-bold text-foreground">{operador.horarios.length}</div>
                      <div className="text-sm text-muted-foreground">Salidas</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <Anchor className="h-4 w-4 mr-2 text-primary" />
                      Embarcaciones
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {operador.botes.map((bote) => (
                        <div key={`${operador.id}-${bote.nombre}`} className="p-4 bg-gradient-surface rounded-lg border border-border">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-medium text-foreground">{bote.nombre}</h5>
                            <Badge className={getEstadoColor(bote.estado)}>{bote.estado}</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>Tipo: {bote.tipo}</div>
                            <div>Capacidad: {bote.capacidad} personas</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      Horarios de salida
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {operador.horarios.length === 0 ? (
                        <Badge variant="outline" className="text-muted-foreground">Sin horarios definidos</Badge>
                      ) : (
                        operador.horarios.map((hora) => (
                          <Badge key={`${operador.id}-${hora}`} variant="outline" className="text-foreground">
                            {hora}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
