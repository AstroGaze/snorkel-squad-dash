import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Calendar, Waves, Fish, Anchor, TrendingUp, DollarSign } from "lucide-react";

const initialMockData = {
  totalClientes: 45,
  tourOperadores: [
    { id: 1, nombre: "Coral Adventures", clientes: 12, porcentaje: 27, ventas: 2400 },
    { id: 2, nombre: "Deep Blue Tours", clientes: 8, porcentaje: 18, ventas: 1800 },
    { id: 3, nombre: "Ocean Explorer", clientes: 15, porcentaje: 33, ventas: 3200 },
    { id: 4, nombre: "Reef Discoveries", clientes: 6, porcentaje: 13, ventas: 1200 },
    { id: 5, nombre: "Marine Paradise", clientes: 4, porcentaje: 9, ventas: 800 }
  ],
  reservasHoy: 18,
  proximasSalidas: [
    { hora: "09:00", operador: "Coral Adventures", clientes: 6 },
    { hora: "11:30", operador: "Ocean Explorer", clientes: 8 },
    { hora: "14:00", operador: "Deep Blue Tours", clientes: 4 }
  ],
  ventasRealTime: [
    { id: 1, operador: "Ocean Explorer", monto: 450, timestamp: new Date(), tipo: "Reserva Completa" },
    { id: 2, operador: "Coral Adventures", monto: 200, timestamp: new Date(Date.now() - 30000), tipo: "Depósito" },
    { id: 3, operador: "Deep Blue Tours", monto: 380, timestamp: new Date(Date.now() - 60000), tipo: "Reserva Completa" }
  ]
};

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard = ({ onLogout }: DashboardProps) => {
  const [mockData, setMockData] = useState(initialMockData);
  const [ventasTotal, setVentasTotal] = useState(9400);
  const [nuevaVenta, setNuevaVenta] = useState<any>(null);

  // Simulador de ventas en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      const operadores = ["Ocean Explorer", "Coral Adventures", "Deep Blue Tours", "Reef Discoveries", "Marine Paradise"];
      const tipos = ["Reserva Completa", "Depósito", "Pago Final"];
      const montos = [200, 250, 300, 380, 450, 500, 600];
      
      const nuevaVentaData = {
        id: Date.now(),
        operador: operadores[Math.floor(Math.random() * operadores.length)],
        monto: montos[Math.floor(Math.random() * montos.length)],
        timestamp: new Date(),
        tipo: tipos[Math.floor(Math.random() * tipos.length)]
      };

      setNuevaVenta(nuevaVentaData);
      setVentasTotal(prev => prev + nuevaVentaData.monto);
      
      setMockData(prev => ({
        ...prev,
        ventasRealTime: [nuevaVentaData, ...prev.ventasRealTime.slice(0, 4)],
        tourOperadores: prev.tourOperadores.map(op => 
          op.nombre === nuevaVentaData.operador 
            ? { ...op, ventas: op.ventas + nuevaVentaData.monto }
            : op
        )
      }));

      // Resetear la animación después de 3 segundos
      setTimeout(() => setNuevaVenta(null), 3000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);
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
                Ventas del Día
              </CardTitle>
              <DollarSign className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold text-secondary transition-all duration-500 ${nuevaVenta ? 'animate-pulse' : ''}`}>
                ${ventasTotal.toLocaleString()}
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

        {/* Ventas en Tiempo Real */}
        <div className="mb-8">
          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                <span>Distribución de Ventas en Tiempo Real</span>
                <div className="ml-auto flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">En vivo</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Ventas por Operador */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-foreground mb-3">Ventas por Tour Operador</h4>
                {mockData.tourOperadores.map((operador) => (
                  <div key={operador.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">{operador.nombre}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">{operador.clientes} clientes</span>
                        <span className={`text-lg font-bold transition-all duration-500 ${
                          nuevaVenta?.operador === operador.nombre ? 'text-secondary animate-pulse' : 'text-primary'
                        }`}>
                          ${operador.ventas.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          nuevaVenta?.operador === operador.nombre 
                            ? 'bg-gradient-coral animate-pulse' 
                            : 'bg-gradient-ocean'
                        }`}
                        style={{ 
                          width: `${Math.min((operador.ventas / Math.max(...mockData.tourOperadores.map(op => op.ventas))) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Historial de Ventas Recientes */}
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold text-foreground mb-3">Últimas Transacciones</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {mockData.ventasRealTime.map((venta, index) => (
                    <div 
                      key={venta.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-500 ${
                        index === 0 && nuevaVenta ? 'bg-gradient-coral/10 border-secondary animate-fade-in scale-105' : 'bg-gradient-surface border-border'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full transition-all duration-300 ${
                          index === 0 && nuevaVenta ? 'bg-gradient-coral' : 'bg-gradient-ocean'
                        }`}>
                          <DollarSign className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{venta.operador}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-muted-foreground">{venta.tipo}</p>
                            <span className="text-xs text-muted-foreground">
                              {venta.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold transition-all duration-300 ${
                          index === 0 && nuevaVenta ? 'text-secondary text-lg' : 'text-primary'
                        }`}>
                          ${venta.monto}
                        </p>
                        {index === 0 && nuevaVenta && (
                          <p className="text-xs text-secondary animate-pulse">¡Nueva venta!</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              
              <Button variant="ocean" className="w-full mt-4">
                Ver Todas las Reservas
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};