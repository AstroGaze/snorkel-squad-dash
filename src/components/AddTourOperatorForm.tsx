import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, X } from "lucide-react";

interface Boat {
  nombre: string;
  capacidad: number;
  estado: string;
  tipo: string;
}

interface TourOperator {
  nombre: string;
  contacto: {
    telefono: string;
    email: string;
    direccion: string;
  };
  botes: Boat[];
  personal: number;
  horarios: string[];
  especialidad: string;
}

interface AddTourOperatorFormProps {
  onAdd: (operator: TourOperator) => void;
  onCancel: () => void;
}

export const AddTourOperatorForm = ({ onAdd, onCancel }: AddTourOperatorFormProps) => {
  const [formData, setFormData] = useState<TourOperator>({
    nombre: "",
    contacto: {
      telefono: "",
      email: "",
      direccion: ""
    },
    botes: [],
    personal: 1,
    horarios: [],
    especialidad: ""
  });

  const [newBoat, setNewBoat] = useState<Boat>({
    nombre: "",
    capacidad: 1,
    estado: "Activo",
    tipo: "Lancha"
  });

  const [newHorario, setNewHorario] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nombre && formData.contacto.telefono && formData.botes.length > 0) {
      onAdd(formData);
    }
  };

  const addBoat = () => {
    if (newBoat.nombre && newBoat.capacidad > 0) {
      setFormData(prev => ({
        ...prev,
        botes: [...prev.botes, { ...newBoat }]
      }));
      setNewBoat({
        nombre: "",
        capacidad: 1,
        estado: "Activo",
        tipo: "Lancha"
      });
    }
  };

  const removeBoat = (index: number) => {
    setFormData(prev => ({
      ...prev,
      botes: prev.botes.filter((_, i) => i !== index)
    }));
  };

  const addHorario = () => {
    if (newHorario && !formData.horarios.includes(newHorario)) {
      setFormData(prev => ({
        ...prev,
        horarios: [...prev.horarios, newHorario].sort()
      }));
      setNewHorario("");
    }
  };

  const removeHorario = (horario: string) => {
    setFormData(prev => ({
      ...prev,
      horarios: prev.horarios.filter(h => h !== horario)
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="bg-card shadow-ocean border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-foreground">Nuevo Tour Operador</h1>
            <Button variant="ghost" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="shadow-ocean">
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre de la Empresa*</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Coral Adventures"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="especialidad">Especialidad</Label>
                  <Input
                    id="especialidad"
                    value={formData.especialidad}
                    onChange={(e) => setFormData(prev => ({ ...prev, especialidad: e.target.value }))}
                    placeholder="Snorkel en arrecifes"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="personal">Número de Personal</Label>
                <Input
                  id="personal"
                  type="number"
                  min="1"
                  value={formData.personal}
                  onChange={(e) => setFormData(prev => ({ ...prev, personal: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="shadow-ocean">
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="telefono">Teléfono*</Label>
                <Input
                  id="telefono"
                  value={formData.contacto.telefono}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contacto: { ...prev.contacto, telefono: e.target.value }
                  }))}
                  placeholder="+52 998 123 4567"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contacto.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contacto: { ...prev.contacto, email: e.target.value }
                  }))}
                  placeholder="info@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Textarea
                  id="direccion"
                  value={formData.contacto.direccion}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contacto: { ...prev.contacto, direccion: e.target.value }
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
              {/* Add New Boat */}
              <div className="p-4 bg-gradient-surface rounded-lg border border-border">
                <h4 className="font-medium mb-3">Agregar Embarcación</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Nombre del bote"
                    value={newBoat.nombre}
                    onChange={(e) => setNewBoat(prev => ({ ...prev, nombre: e.target.value }))}
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Capacidad"
                    value={newBoat.capacidad}
                    onChange={(e) => setNewBoat(prev => ({ ...prev, capacidad: parseInt(e.target.value) || 1 }))}
                  />
                  <Select value={newBoat.tipo} onValueChange={(value) => setNewBoat(prev => ({ ...prev, tipo: value }))}>
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

              {/* Boats List */}
              {formData.botes.length > 0 && (
                <div className="space-y-2">
                  {formData.botes.map((boat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gradient-surface rounded-lg border border-border">
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
              <CardTitle>Horarios de Salida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  type="time"
                  value={newHorario}
                  onChange={(e) => setNewHorario(e.target.value)}
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

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" variant="ocean">
              Crear Tour Operador
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};