import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Anchor, Users, Ship, MapPin, Clock, Phone, Mail, Plus, Edit, Trash2 } from "lucide-react";
import { AddTourOperatorForm } from "./AddTourOperatorForm";

const initialTourOperatorsData = [
  {
    id: 1,
    nombre: "Coral Adventures",
    contacto: {
      telefono: "+52 998 123 4567",
      email: "info@coraladventures.com",
      direccion: "Marina Puerto Juárez, Cancún"
    },
    botes: [
      { id: 1, nombre: "Coral Explorer I", capacidad: 12, estado: "Activo", tipo: "Catamaran" },
      { id: 2, nombre: "Coral Explorer II", capacidad: 8, estado: "Mantenimiento", tipo: "Lancha" },
      { id: 3, nombre: "Sea Dream", capacidad: 15, estado: "Activo", tipo: "Yate" }
    ],
    personal: 8,
    clientesHoy: 12,
    capacidadTotal: 35,
    horarios: ["09:00", "11:30", "14:00", "16:30"],
    especialidad: "Snorkel en arrecifes"
  },
  {
    id: 2,
    nombre: "Deep Blue Tours",
    contacto: {
      telefono: "+52 998 234 5678",
      email: "reservas@deepblue.com",
      direccion: "Zona Hotelera, Cancún"
    },
    botes: [
      { id: 4, nombre: "Ocean Master", capacidad: 20, estado: "Activo", tipo: "Catamaran" },
      { id: 5, nombre: "Blue Wave", capacidad: 10, estado: "Activo", tipo: "Lancha" }
    ],
    personal: 6,
    clientesHoy: 8,
    capacidadTotal: 30,
    horarios: ["10:00", "13:00", "15:30"],
    especialidad: "Cenotes y arrecifes"
  },
  {
    id: 3,
    nombre: "Ocean Explorer",
    contacto: {
      telefono: "+52 998 345 6789",
      email: "tours@oceanexplorer.mx",
      direccion: "Puerto Morelos"
    },
    botes: [
      { id: 6, nombre: "Explorer One", capacidad: 16, estado: "Activo", tipo: "Catamaran" },
      { id: 7, nombre: "Explorer Two", capacidad: 12, estado: "Activo", tipo: "Catamaran" },
      { id: 8, nombre: "Quick Dive", capacidad: 6, estado: "Reparación", tipo: "Lancha" }
    ],
    personal: 10,
    clientesHoy: 15,
    capacidadTotal: 34,
    horarios: ["08:30", "11:00", "13:30", "16:00"],
    especialidad: "Expediciones profundas"
  },
  {
    id: 4,
    nombre: "Reef Discoveries",
    contacto: {
      telefono: "+52 998 456 7890",
      email: "info@reefdiscoveries.com",
      direccion: "Isla Mujeres"
    },
    botes: [
      { id: 9, nombre: "Reef Hunter", capacidad: 14, estado: "Activo", tipo: "Catamaran" },
      { id: 10, nombre: "Coral Seeker", capacidad: 8, estado: "Activo", tipo: "Lancha" }
    ],
    personal: 5,
    clientesHoy: 6,
    capacidadTotal: 22,
    horarios: ["09:30", "12:00", "15:00"],
    especialidad: "Fotografía submarina"
  },
  {
    id: 5,
    nombre: "Marine Paradise",
    contacto: {
      telefono: "+52 998 567 8901",
      email: "paradise@marine.com",
      direccion: "Playa del Carmen"
    },
    botes: [
      { id: 11, nombre: "Paradise Cruiser", capacidad: 18, estado: "Activo", tipo: "Yate" }
    ],
    personal: 4,
    clientesHoy: 4,
    capacidadTotal: 18,
    horarios: ["10:30", "14:30"],
    especialidad: "Tours de lujo"
  }
];

const getEstadoColor = (estado: string) => {
  switch (estado) {
    case "Activo":
      return "bg-gradient-ocean text-primary-foreground";
    case "Mantenimiento":
      return "bg-gradient-coral text-secondary-foreground";
    case "Reparación":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

interface TourOperatorsViewProps {
  onBack: () => void;
}

export const TourOperatorsView = ({ onBack }: TourOperatorsViewProps) => {
  const [tourOperatorsData, setTourOperatorsData] = useState(initialTourOperatorsData);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOperator, setEditingOperator] = useState<typeof initialTourOperatorsData[0] | null>(null);

  const handleAddOperator = (newOperator: any) => {
    const operatorWithId = {
      ...newOperator,
      id: Math.max(...tourOperatorsData.map(op => op.id)) + 1,
      clientesHoy: 0,
      capacidadTotal: newOperator.botes.reduce((acc: number, boat: any) => acc + boat.capacidad, 0)
    };
    setTourOperatorsData(prev => [...prev, operatorWithId]);
    setShowAddForm(false);
  };

  const handleEditOperator = (updatedOperator: any) => {
    setTourOperatorsData(prev => prev.map(op => 
      op.id === editingOperator?.id 
        ? {
            ...updatedOperator,
            id: op.id,
            clientesHoy: op.clientesHoy,
            capacidadTotal: updatedOperator.botes.reduce((acc: number, boat: any) => acc + boat.capacidad, 0)
          }
        : op
    ));
    setEditingOperator(null);
  };

  const handleDeleteOperator = (id: number) => {
    setTourOperatorsData(prev => prev.filter(op => op.id !== id));
  };

  if (showAddForm) {
    return (
      <AddTourOperatorForm
        onAdd={handleAddOperator}
        onCancel={() => setShowAddForm(false)}
      />
    );
  }

  if (editingOperator) {
    return (
      <AddTourOperatorForm
        isEdit={true}
        editData={editingOperator}
        onEdit={handleEditOperator}
        onCancel={() => setEditingOperator(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-card shadow-ocean border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={onBack} className="mr-2">
                ← Volver
              </Button>
              <div className="p-2 rounded-lg bg-gradient-ocean">
                <Ship className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Tour Operadores</h1>
            </div>
            <Button variant="ocean" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Operador
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-ocean">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Operadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{tourOperatorsData.length}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-ocean">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Embarcaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {tourOperatorsData.reduce((acc, op) => acc + op.botes.length, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-ocean">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Capacidad Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent-foreground">
                {tourOperatorsData.reduce((acc, op) => acc + op.capacidadTotal, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-ocean">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Personal Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {tourOperatorsData.reduce((acc, op) => acc + op.personal, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tour Operators Grid */}
        <div className="space-y-6">
          {tourOperatorsData.map((operador) => (
            <Card key={operador.id} className="shadow-depth">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-foreground mb-2">{operador.nombre}</CardTitle>
                    <p className="text-muted-foreground">{operador.especialidad}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-sm">
                      {operador.clientesHoy} clientes hoy
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingOperator(operador)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar Tour Operador?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el operador "{operador.nombre}" y todas sus embarcaciones.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteOperator(operador.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-surface rounded-lg border border-border">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">{operador.contacto.telefono}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">{operador.contacto.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">{operador.contacto.direccion}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gradient-surface rounded-lg border border-border">
                    <Ship className="h-6 w-6 text-primary mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">{operador.botes.length}</div>
                    <div className="text-sm text-muted-foreground">Embarcaciones</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-surface rounded-lg border border-border">
                    <Users className="h-6 w-6 text-secondary mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">{operador.capacidadTotal}</div>
                    <div className="text-sm text-muted-foreground">Capacidad</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-surface rounded-lg border border-border">
                    <Users className="h-6 w-6 text-accent-foreground mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">{operador.personal}</div>
                    <div className="text-sm text-muted-foreground">Personal</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-surface rounded-lg border border-border">
                    <Clock className="h-6 w-6 text-primary mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">{operador.horarios.length}</div>
                    <div className="text-sm text-muted-foreground">Salidas/día</div>
                  </div>
                </div>

                {/* Boats */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center">
                    <Anchor className="h-4 w-4 mr-2 text-primary" />
                    Embarcaciones
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {operador.botes.map((bote) => (
                      <div key={bote.id} className="p-4 bg-gradient-surface rounded-lg border border-border">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-foreground">{bote.nombre}</h5>
                          <Badge className={getEstadoColor(bote.estado)}>
                            {bote.estado}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>Tipo: {bote.tipo}</div>
                          <div>Capacidad: {bote.capacidad} personas</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schedules */}
                <div>
                  <h4 className="font-semibold text-foreground mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    Horarios de Salida
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {operador.horarios.map((hora, index) => (
                      <Badge key={index} variant="outline" className="text-foreground">
                        {hora}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};