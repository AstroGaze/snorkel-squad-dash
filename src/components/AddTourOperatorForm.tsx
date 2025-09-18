import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, X } from 'lucide-react';
import type { OperatorBoat, TourOperatorInput } from '@/lib/operators';

type TourOperatorFormData = TourOperatorInput;
type BoatForm = OperatorBoat & { id?: number };

const defaultFormData: TourOperatorFormData = {
  nombre: '',
  contacto: {
    telefono: '',
    email: '',
    direccion: ''
  },
  botes: [],
  personal: 1,
  capacidadTotal: 0,
  horarios: [],
  especialidad: ''
};

const defaultBoat: BoatForm = {
  nombre: '',
  capacidad: 1,
  estado: 'Activo',
  tipo: 'Lancha'
};

interface AddTourOperatorFormProps {
  onSubmit: (operator: TourOperatorFormData) => Promise<void> | void;
  onCancel: () => void;
  initialData?: TourOperatorFormData;
  submitting?: boolean;
  title?: string;
}

export const AddTourOperatorForm = ({
  onSubmit,
  onCancel,
  initialData,
  submitting = false,
  title
}: AddTourOperatorFormProps) => {
  const [formData, setFormData] = useState<TourOperatorFormData>(initialData ?? defaultFormData);
  const [newBoat, setNewBoat] = useState<BoatForm>(defaultBoat);
  const [newHorario, setNewHorario] = useState('');

  useEffect(() => {
    setFormData(initialData ?? defaultFormData);
  }, [initialData]);

  const canSubmit = useMemo(() => {
    return Boolean(
      formData.nombre &&
      formData.contacto.telefono &&
      formData.botes.length > 0
    );
  }, [formData.nombre, formData.contacto.telefono, formData.botes.length]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || submitting) {
      return;
    }

    const payload: TourOperatorFormData = {
      ...formData,
      botes: formData.botes.map((boat) => ({
        ...boat,
        capacidad: Math.max(1, boat.capacidad)
      })),
      horarios: [...new Set(formData.horarios)].sort()
    };

    await onSubmit(payload);
  };

  const addBoat = () => {
    if (!newBoat.nombre || newBoat.capacidad < 1) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      botes: [...prev.botes, { ...newBoat }]
    }));
    setNewBoat(defaultBoat);
  };

  const removeBoat = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      botes: prev.botes.filter((_, i) => i !== index)
    }));
  };

  const addHorario = () => {
    if (!newHorario) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      horarios: [...new Set([...prev.horarios, newHorario])].sort()
    }));
    setNewHorario('');
  };

  const removeHorario = (horario: string) => {
    setFormData((prev) => ({
      ...prev,
      horarios: prev.horarios.filter((item) => item !== horario)
    }));
  };

  const formTitle = title ?? (initialData ? 'Editar tour operador' : 'Nuevo tour operador');

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="bg-card shadow-ocean border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-ocean">
                <Plus className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">{formTitle}</h1>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* General Information */}
          <Card className="shadow-ocean">
            <CardHeader>
              <CardTitle>Datos Generales*</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre del tour operador</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(event) => setFormData((prev) => ({
                      ...prev,
                      nombre: event.target.value
                    }))}
                    placeholder="Coral Adventures"
                  />
                </div>
                <div>
                  <Label htmlFor="especialidad">Especialidad</Label>
                  <Input
                    id="especialidad"
                    value={formData.especialidad}
                    onChange={(event) => setFormData((prev) => ({
                      ...prev,
                      especialidad: event.target.value
                    }))}
                    placeholder="Snorkel en arrecifes"
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Capacity and Staff */}
          <Card className="shadow-ocean">
            <CardHeader>
              <CardTitle>Capacidad Operativa</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="personal">Equipo disponible</Label>
                <Input
                  id="personal"
                  type="number"
                  min="1"
                  value={formData.personal}
                  onChange={(event) => setFormData((prev) => ({
                    ...prev,
                    personal: Number.parseInt(event.target.value, 10) || 1
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="capacidadTotal">Capacidad diaria estimada</Label>
                <Input
                  id="capacidadTotal"
                  type="number"
                  min="0"
                  value={formData.capacidadTotal}
                  onChange={(event) => setFormData((prev) => ({
                    ...prev,
                    capacidadTotal: Math.max(0, Number.parseInt(event.target.value, 10) || 0)
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="shadow-ocean">
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="telefono">Teléfono*</Label>
                <Input
                  id="telefono"
                  value={formData.contacto.telefono}
                  onChange={(event) => setFormData((prev) => ({
                    ...prev,
                    contacto: { ...prev.contacto, telefono: event.target.value }
                  }))}
                  placeholder="+52 998 123 4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contacto.email}
                  onChange={(event) => setFormData((prev) => ({
                    ...prev,
                    contacto: { ...prev.contacto, email: event.target.value }
                  }))}
                  placeholder="info@operador.com"
                />
              </div>
              <div>
                <Label htmlFor="direccion">Ubicación</Label>
                <Input
                  id="direccion"
                  value={formData.contacto.direccion}
                  onChange={(event) => setFormData((prev) => ({
                    ...prev,
                    contacto: { ...prev.contacto, direccion: event.target.value }
                  }))}
                  placeholder="Marina Puerto Juárez, Cancún"
                />
              </div>
            </CardContent>
          </Card>

          {/* Boats */}
          <Card className="shadow-ocean">
            <CardHeader>
              <CardTitle>Embarcaciones*</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-surface rounded-lg border border-border">
                <h4 className="font-medium mb-3">Registrar embarcación</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Nombre del bote"
                    value={newBoat.nombre}
                    onChange={(event) => setNewBoat((prev) => ({
                      ...prev,
                      nombre: event.target.value
                    }))}
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Capacidad"
                    value={newBoat.capacidad}
                    onChange={(event) => setNewBoat((prev) => ({
                      ...prev,
                      capacidad: Number.parseInt(event.target.value, 10) || 1
                    }))}
                  />
                  <Select value={newBoat.tipo} onValueChange={(value) => setNewBoat((prev) => ({ ...prev, tipo: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lancha">Lancha</SelectItem>
                      <SelectItem value="Catamaran">Catamarán</SelectItem>
                      <SelectItem value="Yate">Yate</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addBoat} variant="ocean" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {formData.botes.length > 0 && (
                <div className="space-y-2">
                  {formData.botes.map((boat, index) => (
                    <div
                      key={`${boat.nombre}-${index}`}
                      className="flex items-center justify-between p-3 bg-gradient-surface rounded-lg border border-border"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{boat.nombre}</span>
                        <span className="text-muted-foreground ml-2">
                          - {boat.tipo} - {boat.capacidad} personas
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBoat(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedules */}
          <Card className="shadow-ocean">
            <CardHeader>
              <CardTitle>Horarios de salida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Input
                  type="time"
                  value={newHorario}
                  onChange={(event) => setNewHorario(event.target.value)}
                />
                <Button type="button" onClick={addHorario} variant="ocean" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.horarios.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.horarios.map((horario) => (
                    <Badge key={horario} variant="outline" className="text-foreground">
                      {horario}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-4 w-4 p-0"
                        onClick={() => removeHorario(horario)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="ocean" disabled={!canSubmit || submitting}>
              {initialData ? 'Guardar cambios' : 'Crear tour operador'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};
