import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Calendar, Waves, Fish, Anchor, TrendingUp, DollarSign, Ship, BarChart3, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TourOperatorsView } from "./TourOperatorsView";

const initialMockData = {
  totalClientes: 45,
  tourOperadores: [
    { id: 1, nombre: "Coral Adventures", clientes: 12, porcentaje: 27 },
    { id: 2, nombre: "Deep Blue Tours", clientes: 8, porcentaje: 18 },
    { id: 3, nombre: "Ocean Explorer", clientes: 15, porcentaje: 33 },
    { id: 4, nombre: "Reef Discoveries", clientes: 6, porcentaje: 13 },
    { id: 5, nombre: "Marine Paradise", clientes: 4, porcentaje: 9 }
  ],
  reservasHoy: 18,
  proximasSalidas: [
    { hora: "09:00", operador: "Coral Adventures", clientes: 6 },
    { hora: "11:30", operador: "Ocean Explorer", clientes: 8 },
    { hora: "14:00", operador: "Deep Blue Tours", clientes: 4 }
  ],
  reservasRealTime: [
    { id: 1, operador: "Ocean Explorer", personas: 4, timestamp: new Date(), tipo: "Familia" },
    { id: 2, operador: "Coral Adventures", personas: 2, timestamp: new Date(Date.now() - 30000), tipo: "Pareja" },
    { id: 3, operador: "Deep Blue Tours", personas: 6, timestamp: new Date(Date.now() - 60000), tipo: "Grupo" }
  ]
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--border))'];

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard = ({ onLogout }: DashboardProps) => {
  const [mockData, setMockData] = useState(initialMockData);
  const [clientesTotal, setClientesTotal] = useState(45);
  const [nuevaReserva, setNuevaReserva] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'operators'>('dashboard');

  // Simulador de reservas en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const operadores = ["Ocean Explorer", "Coral Adventures", "Deep Blue Tours", "Reef Discoveries", "Marine Paradise"];
      const tipos = ["Familia", "Pareja", "Grupo", "Individual"];
      const personas = [1, 2, 3, 4, 5, 6];
      
      const nuevaReservaData = {
        id: Date.now(),
        operador: operadores[Math.floor(Math.random() * operadores.length)],
        personas: personas[Math.floor(Math.random() * personas.length)],
        timestamp: new Date(),
        tipo: tipos[Math.floor(Math.random() * tipos.length)]
      };

      setNuevaReserva(nuevaReservaData);
      setClientesTotal(prev => prev + nuevaReservaData.personas);
      
      setMockData(prev => ({
        ...prev,
        totalClientes: prev.totalClientes + nuevaReservaData.personas,
        reservasRealTime: [nuevaReservaData, ...prev.reservasRealTime.slice(0, 4)],
        tourOperadores: prev.tourOperadores.map(op => 
          op.nombre === nuevaReservaData.operador 
            ? { ...op, clientes: op.clientes + nuevaReservaData.personas }
            : op
        )
      }));

      // Resetear la animación después de 3 segundos
      setTimeout(() => setNuevaReserva(null), 3000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (currentView === 'operators') {
    return <TourOperatorsView onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-card shadow-ocean border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-ocean">
                <Waves className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">AquaReservas Dashboard</h1>
            </div>
            <Button variant="outline" onClick={onLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-ocean hover:shadow-depth transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clientes del Día
              </CardTitle>
              <Users className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold text-secondary transition-all duration-500 ${nuevaReserva ? 'animate-pulse' : ''}`}>
                {clientesTotal}
              </div>
              <p className="text-sm text-muted-foreground">
                Total acumulado
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-ocean hover:shadow-depth transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Clientes Hoy
              </CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{mockData.totalClientes}</div>
              <p className="text-sm text-muted-foreground">
                Distribuidos entre {mockData.tourOperadores.length} operadores
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-coral hover:shadow-depth transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reservas Activas
              </CardTitle>
              <Calendar className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{mockData.reservasHoy}</div>
              <p className="text-sm text-muted-foreground">
                Para el día de hoy
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-ocean hover:shadow-depth transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Próximas Salidas
              </CardTitle>
              <Anchor className="h-5 w-5 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent-foreground">{mockData.proximasSalidas.length}</div>
              <p className="text-sm text-muted-foreground">
                Tours programados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Distribución en Tiempo Real */}
        <div className="mb-8">
          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-secondary" />
                <span>Distribución de Clientes en Tiempo Real</span>
                <div className="ml-auto flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">En vivo</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Clientes por Operador */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-foreground mb-3">Distribución por Tour Operador</h4>
                {mockData.tourOperadores.map((operador) => (
                  <div key={operador.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">{operador.nombre}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">{operador.porcentaje}%</span>
                        <span className={`text-lg font-bold transition-all duration-500 ${
                          nuevaReserva?.operador === operador.nombre ? 'text-secondary animate-pulse' : 'text-primary'
                        }`}>
                          {operador.clientes} personas
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          nuevaReserva?.operador === operador.nombre 
                            ? 'bg-gradient-coral animate-pulse' 
                            : 'bg-gradient-ocean'
                        }`}
                        style={{ 
                          width: `${Math.min((operador.clientes / Math.max(...mockData.tourOperadores.map(op => op.clientes))) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Historial de Reservas Recientes - Redesigned */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-foreground flex items-center">
                    <div className="p-2 rounded-lg bg-gradient-ocean mr-3">
                      <Calendar className="h-4 w-4 text-primary-foreground" />
                    </div>
                    Últimas Reservas
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                    <span>Actualizando en vivo</span>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  {mockData.reservasRealTime.map((reserva, index) => (
                    <div 
                      key={reserva.id} 
                      className={`group relative overflow-hidden rounded-xl border transition-all duration-500 hover:shadow-ocean ${
                        index === 0 && nuevaReserva 
                          ? 'bg-gradient-to-r from-secondary/10 to-primary/5 border-secondary shadow-lg animate-scale-in' 
                          : 'bg-card border-border hover:border-primary/20'
                      }`}
                    >
                      {/* Nueva reserva indicator */}
                      {index === 0 && nuevaReserva && (
                        <div className="absolute top-0 right-0 bg-gradient-coral text-secondary-foreground text-xs px-2 py-1 rounded-bl-lg animate-fade-in">
                          ¡Nueva!
                        </div>
                      )}
                      
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          {/* Left side - Operator info */}
                          <div className="flex items-center space-x-4">
                            <div className={`relative p-3 rounded-xl transition-all duration-300 ${
                              index === 0 && nuevaReserva 
                                ? 'bg-gradient-coral shadow-lg' 
                                : 'bg-gradient-surface border border-border group-hover:bg-gradient-ocean'
                            }`}>
                              <Ship className={`h-5 w-5 transition-colors duration-300 ${
                                index === 0 && nuevaReserva 
                                  ? 'text-secondary-foreground' 
                                  : 'text-primary group-hover:text-primary-foreground'
                              }`} />
                              
                              {/* Pulsing ring for new reservations */}
                              {index === 0 && nuevaReserva && (
                                <div className="absolute inset-0 rounded-xl border-2 border-secondary animate-ping"></div>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              <p className={`font-semibold transition-colors duration-300 ${
                                index === 0 && nuevaReserva ? 'text-secondary' : 'text-foreground'
                              }`}>
                                {reserva.operador}
                              </p>
                              <div className="flex items-center space-x-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-gradient-surface text-xs font-medium text-muted-foreground border border-border">
                                  {reserva.tipo}
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {reserva.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right side - People count */}
                          <div className="text-right">
                            <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                              index === 0 && nuevaReserva 
                                ? 'bg-gradient-coral text-secondary-foreground shadow-lg' 
                                : 'bg-gradient-surface border border-border'
                            }`}>
                              <Users className="h-4 w-4" />
                              <span className={`font-bold transition-all duration-300 ${
                                index === 0 && nuevaReserva ? 'text-lg' : 'text-base'
                              }`}>
                                {reserva.personas}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">personas</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Animated bottom border for new reservations */}
                      {index === 0 && nuevaReserva && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-secondary animate-pulse"></div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* View all button */}
                <div className="mt-4 text-center">
                  <Button variant="ghost" className="text-primary hover:text-primary-foreground hover:bg-gradient-ocean">
                    Ver todas las reservas
                    <TrendingUp className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pie Chart */}
          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Distribución de Clientes (Gráfico)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockData.tourOperadores}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nombre, porcentaje }) => `${nombre}: ${porcentaje}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="clientes"
                  >
                    {mockData.tourOperadores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} personas`, 'Clientes']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-secondary" />
                <span>Comparativo por Operador</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockData.tourOperadores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="nombre" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={(value) => [`${value} personas`, 'Clientes']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="clientes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tour Operators Distribution */}
          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Distribución por Tour Operador</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockData.tourOperadores.map((operador) => (
                <div key={operador.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{operador.nombre}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{operador.clientes} personas</span>
                      <span className="text-sm font-semibold text-primary">{operador.porcentaje}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-ocean h-2 rounded-full transition-all duration-500"
                      style={{ width: `${operador.porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Tours */}
          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Fish className="h-5 w-5 text-secondary" />
                <span>Próximas Salidas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockData.proximasSalidas.map((salida, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gradient-surface border border-border">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-gradient-coral">
                      <Anchor className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{salida.hora}</p>
                      <p className="text-sm text-muted-foreground">{salida.operador}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{salida.clientes}</p>
                    <p className="text-sm text-muted-foreground">personas</p>
                  </div>
                </div>
              ))}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <Button variant="ocean" className="w-full">
                  Ver Todas las Reservas
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setCurrentView('operators')}
                >
                  <Ship className="h-4 w-4 mr-2" />
                  Ver Operadores
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};