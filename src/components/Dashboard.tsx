import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Users,
  MapPin,
  Calendar,
  Waves,
  Fish,
  Anchor,
  TrendingUp,
  DollarSign,
  Ship,
  BarChart3,
  Clock
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TourOperatorsView } from './TourOperatorsView';
import { useOperatorsBundle } from '@/hooks/useOperatorsData';
import type { ReservationRecord } from '@/lib/operators';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--border))'];
const DISTRIBUTION_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  'hsl(var(--destructive))',
];

interface DashboardProps {
  onLogout: () => void;
}

interface UpcomingDeparture {
  hora: string;
  operador: string;
  clientes: number;
}

interface RealTimeReservation {
  id: string;
  operador: string;
  personas: number;
  timestamp: Date;
  tipo: string;
  horaSalida: string | null;
  registradoPor: ReservationRecord['registradoPor'];
}

type WeeklyDistributionSeries = {
  id: string;
  key: string;
  nombre: string;
  color: string;
};

type WeeklyDistributionRanking = {
  id: string;
  nombre: string;
  clientes: number;
  reservas: number;
};

export const Dashboard = ({ onLogout }: DashboardProps) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'operators'>('dashboard');
  const [selectedReservation, setSelectedReservation] = useState<RealTimeReservation | null>(null);
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);
  const { data, isLoading, isError, error } = useOperatorsBundle();

  const operators = useMemo(() => data?.operators ?? [], [data?.operators]);
  const reservations = useMemo(() => data?.reservationsToday ?? [], [data?.reservationsToday]);
  const weeklyPerformance = useMemo(() => data?.weeklyPerformance ?? [], [data?.weeklyPerformance]);

  const weeklyDistribution = useMemo(() => {
    if (!weeklyPerformance.length) {
      return {
        data: [] as Array<Record<string, number | string>>,
        series: [] as WeeklyDistributionSeries[],
        ranking: [] as WeeklyDistributionRanking[],
      };
    }

    const totals = new Map<string, WeeklyDistributionRanking>();
    weeklyPerformance.forEach((point) => {
      point.operadores.forEach((operator) => {
        const id = String(operator.id);
        const existing = totals.get(id);
        if (existing) {
          existing.clientes += operator.clientes;
          existing.reservas += operator.reservas;
        } else {
          totals.set(id, {
            id,
            nombre: operator.nombre,
            clientes: operator.clientes,
            reservas: operator.reservas,
          });
        }
      });
    });

    const ranking = Array.from(totals.values()).sort((a, b) => b.clientes - a.clientes);
    const topOperators = ranking.slice(0, 4);
    const series: WeeklyDistributionSeries[] = topOperators.map((operator, index) => ({
      id: operator.id,
      key: `operator_${index}`,
      nombre: operator.nombre,
      color: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length],
    }));
    const seriesKeyById = new Map(topOperators.map((operator, index) => [operator.id, `operator_${index}`]));

    const data = weeklyPerformance.map((point) => {
      const date = new Date(point.dayKey);
      const label = date.toLocaleDateString('es-MX', { weekday: 'short' });
      const row: Record<string, number | string> = { dayKey: point.dayKey, label };
      series.forEach((definition) => {
        row[definition.key] = 0;
      });
      let otros = 0;
      point.operadores.forEach((operator) => {
        const id = String(operator.id);
        const key = seriesKeyById.get(id);
        if (key) {
          row[key] = (row[key] as number) + operator.clientes;
        } else {
          otros += operator.clientes;
        }
      });
      if (ranking.length > series.length) {
        row.otros = otros;
      }
      return row;
    });

    const finalSeries =
      ranking.length > series.length
        ? [
            ...series,
            {
              id: 'others',
              key: 'otros',
              nombre: 'Otros operadores',
              color: DISTRIBUTION_COLORS[series.length % DISTRIBUTION_COLORS.length],
            },
          ]
        : series;

    return { data, series: finalSeries, ranking };
  }, [weeklyPerformance]);

  const weeklySummary = useMemo(() => {
    const totalClientes = weeklyPerformance.reduce((acc, point) => acc + point.totalClientes, 0);
    const totalReservas = weeklyPerformance.reduce((acc, point) => acc + point.totalReservas, 0);
    const topOperator = weeklyDistribution.ranking[0] ?? null;
    const activeOperators = weeklyDistribution.ranking.length;
    const topOperatorShare =
      topOperator && totalClientes > 0 ? Math.round((topOperator.clientes / totalClientes) * 100) : null;
    return {
      totalClientes,
      totalReservas,
      topOperator,
      activeOperators,
      topOperatorShare,
    };
  }, [weeklyDistribution, weeklyPerformance]);

  const totalClientes = useMemo(() => operators.reduce((acc, operator) => acc + operator.clientesHoy, 0), [operators]);
  const reservasHoy = reservations.length;

  const distribution = useMemo(() => {
    return operators.map((operator) => {
      const porcentaje = totalClientes > 0 ? Math.round((operator.clientesHoy / totalClientes) * 100) : 0;
      return {
        id: operator.id,
        nombre: operator.nombre,
        clientes: operator.clientesHoy,
        porcentaje,
        capacidadTotal: operator.capacidadTotal,
        personal: operator.personal
      };
    });
  }, [operators, totalClientes]);

  const upcomingDepartures: UpcomingDeparture[] = useMemo(() => {
    return reservations
      .map((reservation) => ({
        hora: reservation.horaSalida ?? '',
        operador: reservation.operadorNombre,
        clientes: reservation.personas
      }))
      .filter((item) => Boolean(item.hora))
      .sort((a, b) => a.hora.localeCompare(b.hora))
      .slice(0, 5);
  }, [reservations]);

  const realTimeReservations: RealTimeReservation[] = useMemo(() => {
    return reservations
      .map((reservation) => ({
        id: String(reservation.id),
        operador: reservation.operadorNombre,
        personas: reservation.personas,
        timestamp: new Date(reservation.timestamp),
        tipo: reservation.tipo,
        horaSalida: reservation.horaSalida,
        registradoPor: reservation.registradoPor
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 6);
  }, [reservations]);

  const handleReservationSelect = (reservation: RealTimeReservation) => {
    setSelectedReservation(reservation);
    setIsReservationDialogOpen(true);
  };

  const handleReservationDialogChange = (open: boolean) => {
    setIsReservationDialogOpen(open);
    if (!open) {
      setSelectedReservation(null);
    }
  };

  const capacityVsDemand = useMemo(() => {
    return operators.map((operator) => ({
      nombre: operator.nombre,
      clientesHoy: operator.clientesHoy,
      capacidad: operator.capacidadTotal
    }));
  }, [operators]);

  if (currentView === 'operators') {
    return <TourOperatorsView onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <header className="bg-card shadow-ocean border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-ocean">
                <Waves className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">AquaReservas Dashboard</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCurrentView('operators')}>
                Gestionar operadores
              </Button>
              <Button variant="outline" onClick={onLogout}>
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {isError && (
          <Card className="border-destructive/50">
            <CardContent className="py-4">
              <p className="text-destructive">
                No fue posible cargar los datos locales: {error?.message ?? 'Error desconocido'}
              </p>
            </CardContent>
          </Card>
        )}

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-ocean">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clientes del día</CardTitle>
              <Users className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{isLoading ? '...' : totalClientes}</div>
              <p className="text-sm text-muted-foreground">Total acumulado hoy</p>
            </CardContent>
          </Card>

          <Card className="shadow-ocean">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Operadores activos</CardTitle>
              <Ship className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{isLoading ? '...' : operators.length}</div>
              <p className="text-sm text-muted-foreground">Con actividad registrada hoy</p>
            </CardContent>
          </Card>

          <Card className="shadow-coral">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reservas activas</CardTitle>
              <Calendar className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{isLoading ? '...' : reservasHoy}</div>
              <p className="text-sm text-muted-foreground">Registros sincronizados hoy</p>
            </CardContent>
          </Card>

          <Card className="shadow-ocean">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Próximas salidas</CardTitle>
              <Anchor className="h-5 w-5 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent-foreground">{isLoading ? '...' : upcomingDepartures.length}</div>
              <p className="text-sm text-muted-foreground">Programadas para hoy</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6">
          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-secondary" />
                <span>Distribucion semanal de clientes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weeklyDistribution.data.length === 0 ? (
                <p className="text-muted-foreground">Agrega reservas para analizar la semana.</p>
              ) : (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyDistribution.data}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="label" stroke="currentColor" className="text-xs fill-muted-foreground" />
                        <YAxis stroke="currentColor" className="text-xs fill-muted-foreground" />
                        <Tooltip />
                        <Legend />
                        {weeklyDistribution.series.map((series) => (
                          <Bar key={series.id} dataKey={series.key} name={series.nombre} stackId="clientes" fill={series.color} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 rounded-lg border border-border bg-gradient-surface">
                      <p className="text-muted-foreground">Personas totales</p>
                      <p className="text-xl font-bold text-foreground">{weeklySummary.totalClientes}</p>
                      <p className="text-xs text-muted-foreground">Reservas: {weeklySummary.totalReservas}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-gradient-surface">
                      <p className="text-muted-foreground">Operadores activos</p>
                      <p className="text-xl font-bold text-foreground">{weeklySummary.activeOperators}</p>
                      <p className="text-xs text-muted-foreground">Con atencion durante la semana</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-gradient-surface">
                      <p className="text-muted-foreground">Principal operador</p>
                      <p className="text-sm text-foreground">
                        {weeklySummary.topOperator ? weeklySummary.topOperator.nombre : 'Sin datos'}
                      </p>
                      {weeklySummary.topOperator && weeklySummary.topOperatorShare !== null ? (
                        <p className="text-xs text-muted-foreground">
                          {weeklySummary.topOperator.clientes} personas ({weeklySummary.topOperatorShare}%)
                        </p>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-secondary" />
                <span>Distribución de clientes en tiempo real</span>
                <div className="ml-auto flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-sm text-muted-foreground">En vivo</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {distribution.length === 0 ? (
                <p className="text-muted-foreground">Aún no hay clientes registrados para hoy.</p>
              ) : (
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold text-foreground mb-3">Distribución por tour operador</h4>
                  {distribution.map((operador) => (
                    <div key={operador.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">{operador.nombre}</span>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-muted-foreground">{operador.porcentaje}%</span>
                          <span className="text-lg font-bold text-primary">{operador.clientes} personas</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="h-3 rounded-full bg-gradient-ocean transition-all duration-1000"
                          style={{ width: `${Math.min(operador.porcentaje, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-foreground flex items-center">
                    <div className="p-2 rounded-lg bg-gradient-ocean mr-3">
                      <Calendar className="h-4 w-4 text-primary-foreground" />
                    </div>
                    Últimas reservas
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    <span>Actualizando en vivo</span>
                  </div>
                </div>

                <div className="grid gap-3">
                  {realTimeReservations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin movimientos registrados hoy.</p>
                  ) : (
                    realTimeReservations.map((reserva) => (
                      <button
                        key={reserva.id}
                        type="button"
                        onClick={() => handleReservationSelect(reserva)}
                        className="group relative w-full overflow-hidden rounded-xl border bg-card border-border text-left transition-all duration-500 hover:shadow-ocean focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`Ver detalles de la reserva de ${reserva.operador}`}
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-muted-foreground">{reserva.tipo}</p>
                              <p className="text-lg font-semibold text-foreground">{reserva.operador}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-foreground">
                                {reserva.personas} pax
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {Number.isNaN(reserva.timestamp.getTime())
                                  ? '...'
                                  : reserva.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {reserva.registradoPor
                                ? `Capturada por ${reserva.registradoPor.email}`
                                : 'Captura sin usuario'}
                            </span>
                            <span className="font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                              Ver detalles
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Capacidad vs demanda</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {capacityVsDemand.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Sin datos para graficar
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={capacityVsDemand}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="nombre" stroke="currentColor" className="text-xs fill-muted-foreground" />
                    <YAxis stroke="currentColor" className="text-xs fill-muted-foreground" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="clientesHoy" fill="hsl(var(--primary))" name="Clientes" />
                    <Bar dataKey="capacidad" fill="hsl(var(--secondary))" name="Capacidad" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-depth lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Participación por operador</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {distribution.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Sin datos suficientes
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution} dataKey="clientes" nameKey="nombre" cx="50%" cy="50%" outerRadius={110} label>
                      {distribution.map((entry, index) => (
                        <Cell key={`cell-${entry.id}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-secondary" />
                <span>Próximas salidas</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingDepartures.length === 0 ? (
                <p className="text-muted-foreground">Aún no hay salidas programadas.</p>
              ) : (
                upcomingDepartures.map((salida, index) => (
                  <div key={`${salida.operador}-${index}`} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div>
                      <p className="text-sm text-muted-foreground">{salida.operador}</p>
                      <p className="text-lg font-semibold text-foreground">{salida.clientes} pasajeros</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">{salida.hora}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Fish className="h-5 w-5 text-primary" />
                <span>Capacidad disponible</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {operators.length === 0 ? (
                <p className="text-muted-foreground">Registra operadores para visualizar su capacidad.</p>
              ) : (
                operators.map((operator) => {
                  const disponible = Math.max(operator.capacidadTotal - operator.clientesHoy, 0);
                  return (
                    <div key={operator.id} className="p-3 rounded-lg border border-border bg-card flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-foreground">{operator.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          Capacidad total {operator.capacidadTotal} · Disponibles {disponible}
                        </p>
                      </div>
                      <Badge variant={disponible > 0 ? 'secondary' : 'destructive'}>
                        {disponible > 0 ? `${disponible} libres` : 'Sin cupo'}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="shadow-depth">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-secondary" />
                <span>Resumen operativo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gradient-surface rounded-lg border border-border">
                  <p className="text-muted-foreground">Operadores totales</p>
                  <p className="text-xl font-bold text-foreground">{operators.length}</p>
                </div>
                <div className="p-3 bg-gradient-surface rounded-lg border border-border">
                  <p className="text-muted-foreground">Reservas hoy</p>
                  <p className="text-xl font-bold text-foreground">{reservasHoy}</p>
                </div>
                <div className="p-3 bg-gradient-surface rounded-lg border border-border">
                  <p className="text-muted-foreground">Clientes asignados</p>
                  <p className="text-xl font-bold text-foreground">{totalClientes}</p>
                </div>
                <div className="p-3 bg-gradient-surface rounded-lg border border-border">
                  <p className="text-muted-foreground">Promedio por operador</p>
                  <p className="text-xl font-bold text-foreground">
                    {operators.length ? Math.round(totalClientes / operators.length) : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <Dialog open={isReservationDialogOpen} onOpenChange={handleReservationDialogChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalle de reserva</DialogTitle>
            <DialogDescription>Consulta la información capturada para esta operación.</DialogDescription>
          </DialogHeader>
          {selectedReservation ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de servicio</p>
                <p className="text-xl font-semibold text-foreground">{selectedReservation.tipo}</p>
                <p className="text-sm text-muted-foreground">
                  Operador asignado:
                  <span className="ml-1 text-foreground font-medium">{selectedReservation.operador}</span>
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Personas</p>
                  <p className="font-semibold text-foreground">{selectedReservation.personas}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hora de salida</p>
                  <p className="font-semibold text-foreground">
                    {selectedReservation.horaSalida ?? 'Sin especificar'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registrada por</p>
                  <p className="font-semibold text-foreground">
                    {selectedReservation.registradoPor
                      ? selectedReservation.registradoPor.email
                      : 'Captura sin usuario'}
                  </p>
                  {selectedReservation.registradoPor ? (
                    <p className="text-xs text-muted-foreground">
                      Rol: {selectedReservation.registradoPor.role === 'admin' ? 'Administración' : 'Ventas'}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-muted-foreground">Capturada</p>
                  <p className="font-semibold text-foreground">
                    {Number.isNaN(selectedReservation.timestamp.getTime())
                      ? 'Sin registro'
                      : selectedReservation.timestamp.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Selecciona una reserva para ver el detalle.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};




