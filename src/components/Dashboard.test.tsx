import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Dashboard } from './Dashboard';
import type { OperatorsBundle, ReservationRecord, TourOperator } from '@/lib/operators';

const useOperatorsBundleMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useOperatorsData', () => ({
  useOperatorsBundle: useOperatorsBundleMock,
}));

vi.mock('./TourOperatorsView', () => ({
  TourOperatorsView: ({ onBack }: { onBack: () => void }) => (
    <div>
      <p>Mock Tour Operators</p>
      <button type="button" onClick={onBack}>
        Volver al dashboard
      </button>
    </div>
  ),
}));

vi.mock('recharts', () => {
const MockContainer = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="recharts-mock">
    {children}
  </div>
);

  return {
    ResponsiveContainer: MockContainer,
    PieChart: MockContainer,
    Pie: MockContainer,
    Cell: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Tooltip: () => <div />,
    Legend: () => <div />,
    BarChart: MockContainer,
    Bar: MockContainer,
    XAxis: MockContainer,
    YAxis: MockContainer,
    CartesianGrid: MockContainer,
  };
});

const buildOperator = (overrides: Partial<TourOperator>): TourOperator => ({
  id: overrides.id ?? ('operator-' + Math.random()) as TourOperator['id'],
  nombre: overrides.nombre ?? 'Operator Demo',
  contacto: overrides.contacto ?? {
    telefono: '000-000-0000',
    email: 'contacto@demo.com',
    direccion: 'Direccion demo',
  },
  botes: overrides.botes ?? [],
  personal: overrides.personal ?? 5,
  capacidadTotal: overrides.capacidadTotal ?? 20,
  horarios: overrides.horarios ?? ['08:00', '12:00'],
  especialidad: overrides.especialidad ?? 'Snorkel',
  clientesHoy: overrides.clientesHoy ?? 0,
  clientesPrevios: overrides.clientesPrevios ?? 0,
});

const buildReservation = (overrides: Partial<ReservationRecord>): ReservationRecord => ({
  id: overrides.id ?? ('reservation-' + Math.random()) as ReservationRecord['id'],
  operadorId: overrides.operadorId ?? ('operator-' + Math.random()) as ReservationRecord['operadorId'],
  operadorNombre: overrides.operadorNombre ?? 'Operador Test',
  personas: overrides.personas ?? 2,
  tipo: overrides.tipo ?? 'Tour demo',
  timestamp: overrides.timestamp ?? new Date('2025-02-24T12:00:00Z').toISOString(),
  horaSalida: overrides.horaSalida ?? '09:00',
  registradoPor:
    overrides.registradoPor ??
    {
      id: ('user-' + Math.random()) as ReservationRecord['registradoPor']['id'],
      email: 'ventas@aquareservas.com',
      role: 'seller',
    },
});

const buildBundle = (overrides?: Partial<OperatorsBundle>): OperatorsBundle => ({
  operators: overrides?.operators ?? [
    buildOperator({
      id: 'op-1' as TourOperator['id'],
      nombre: 'Blue Reef Adventures',
      capacidadTotal: 24,
      clientesHoy: 14,
      personal: 6,
    }),
    buildOperator({
      id: 'op-2' as TourOperator['id'],
      nombre: 'Coral Wave Expeditions',
      capacidadTotal: 18,
      clientesHoy: 8,
      personal: 5,
    }),
  ],
  reservationsToday: overrides?.reservationsToday ?? [
    buildReservation({
      id: 'res-1' as ReservationRecord['id'],
      operadorId: 'op-1' as ReservationRecord['operadorId'],
      operadorNombre: 'Blue Reef Adventures',
      personas: 4,
      tipo: 'Snorkel privado premium',
      timestamp: new Date('2025-02-24T10:00:00Z').toISOString(),
      horaSalida: '10:30',
    }),
    buildReservation({
      id: 'res-2' as ReservationRecord['id'],
      operadorId: 'op-2' as ReservationRecord['operadorId'],
      operadorNombre: 'Coral Wave Expeditions',
      personas: 6,
      tipo: 'Crucero al atardecer',
      timestamp: new Date('2025-02-24T13:15:00Z').toISOString(),
      horaSalida: '15:00',
    }),
  ],
});

const mockHookReturn = (bundleOverrides?: Partial<OperatorsBundle>, extras?: Partial<ReturnType<typeof useOperatorsBundleMock>>) => {
  const base = {
    data: buildBundle(bundleOverrides),
    isLoading: false,
    isError: false,
    error: null as Error | null,
  };

  useOperatorsBundleMock.mockReturnValue({
    ...base,
    ...extras,
  });
};

beforeEach(() => {
  useOperatorsBundleMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('Dashboard', () => {
  it('shows aggregated metrics from the operators bundle', () => {
    mockHookReturn();
    const onLogout = vi.fn();
    render(<Dashboard onLogout={onLogout} />);

    expect(screen.getByText('AquaReservas Dashboard')).toBeInTheDocument();
    const clientesCard = screen.getByText('Total acumulado hoy').closest('div');
    expect(clientesCard).not.toBeNull();
    expect(within(clientesCard as HTMLElement).getByText('22')).toBeInTheDocument();

    const operadoresCard = screen.getByText('Con actividad registrada hoy').closest('div');
    expect(operadoresCard).not.toBeNull();
    expect(within(operadoresCard as HTMLElement).getByText('2')).toBeInTheDocument();

    const reservasCard = screen.getByText('Registros sincronizados hoy').closest('div');
    expect(reservasCard).not.toBeNull();
    expect(within(reservasCard as HTMLElement).getByText('2')).toBeInTheDocument();

    const salidasCard = screen.getByText('Programadas para hoy').closest('div');
    expect(salidasCard).not.toBeNull();
    expect(within(salidasCard as HTMLElement).getByText('2')).toBeInTheDocument();
  });

  it('invokes the logout callback when requested', async () => {
    mockHookReturn();
    const onLogout = vi.fn();
    const user = userEvent.setup();
    render(<Dashboard onLogout={onLogout} />);

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('allows navigating to tour operators view and back to the dashboard', async () => {
    mockHookReturn();
    const user = userEvent.setup();
    render(<Dashboard onLogout={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Gestionar operadores' }));
    expect(screen.getByText('Mock Tour Operators')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Volver al dashboard' }));
    expect(screen.getByText('AquaReservas Dashboard')).toBeInTheDocument();
  });

  it('opens the reservation detail dialog when selecting a recent reservation', async () => {
    mockHookReturn();
    const user = userEvent.setup();
    render(<Dashboard onLogout={vi.fn()} />);

    const [reservationLabel] = screen.getAllByText('Snorkel privado premium');
    const reservaButton = reservationLabel.closest('button');
    expect(reservaButton).not.toBeNull();
    await user.click(reservaButton as HTMLButtonElement);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Detalle de reserva' })).toBeInTheDocument();
    expect(within(dialog).getByText('Snorkel privado premium')).toBeInTheDocument();
    expect(within(dialog).getByText(/Operador asignado:/)).toBeInTheDocument();
    expect(within(dialog).getByText('Blue Reef Adventures')).toBeInTheDocument();
  });

  it('shows an error banner when data fails to load', () => {
    mockHookReturn(undefined, {
      isError: true,
      error: new Error('Fallo de red'),
    });
    render(<Dashboard onLogout={vi.fn()} />);

    expect(screen.getByText('No fue posible cargar los datos locales: Fallo de red')).toBeInTheDocument();
  });
});
