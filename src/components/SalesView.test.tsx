import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SalesView } from './SalesView';
import type { TourOperator } from '@/lib/operators';

const toastMock = vi.hoisted(() => vi.fn());
const useOperatorsBundleMock = vi.hoisted(() => vi.fn());
const useCreateReservationMock = vi.hoisted(() => vi.fn());
const mutateAsyncMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/hooks/useOperatorsData', () => ({
  useOperatorsBundle: useOperatorsBundleMock,
  useCreateReservation: useCreateReservationMock,
}));

const buildOperator = (overrides: Partial<TourOperator>): TourOperator => ({
  id: overrides.id ?? ('operator-' + Math.random()) as TourOperator['id'],
  nombre: overrides.nombre ?? 'Operador Demo',
  contacto: overrides.contacto ?? {
    telefono: '000-000-0000',
    email: 'contacto@demo.com',
    direccion: 'Direccion demo',
  },
  botes: overrides.botes ?? [],
  personal: overrides.personal ?? 5,
  capacidadTotal: overrides.capacidadTotal ?? 20,
  horarios: overrides.horarios ?? ['08:00'],
  especialidad: overrides.especialidad ?? 'Snorkel',
  clientesHoy: overrides.clientesHoy ?? 0,
  clientesPrevios: overrides.clientesPrevios ?? 0,
});

const mockOperators = (operators: TourOperator[], extras?: Partial<ReturnType<typeof useOperatorsBundleMock>>) => {
  useOperatorsBundleMock.mockReturnValue({
    data: { operators, reservationsToday: [], weeklyPerformance: [] },
    isLoading: false,
    isError: false,
    error: null as Error | null,
    ...extras,
  });
};

const setCreateReservationReturn = (overrides?: Partial<{ isPending: boolean; mutateAsync: typeof mutateAsyncMock }>) => {
  useCreateReservationMock.mockReturnValue({
    mutateAsync: overrides?.mutateAsync ?? mutateAsyncMock,
    isPending: overrides?.isPending ?? false,
  });
};

beforeEach(() => {
  toastMock.mockReset();
  mutateAsyncMock.mockReset();
  useOperatorsBundleMock.mockReset();
  useCreateReservationMock.mockReset();
  setCreateReservationReturn();
});

afterEach(() => {
  cleanup();
});

describe('SalesView', () => {
  it('recommends the optimal operator and submits reservations successfully', async () => {
    const operators = [
      buildOperator({
        id: 'op-1' as TourOperator['id'],
        nombre: 'Mar de Plata',
        capacidadTotal: 20,
        clientesHoy: 5,
        clientesPrevios: 3,
        horarios: ['08:00', '12:00'],
      }),
      buildOperator({
        id: 'op-2' as TourOperator['id'],
        nombre: 'Coral Express',
        capacidadTotal: 40,
        clientesHoy: 20,
        clientesPrevios: 20,
        horarios: [],
      }),
    ];
    mockOperators(operators);
    mutateAsyncMock.mockResolvedValue({ id: 'reservation-123' });

    const onBack = vi.fn();
    const user = userEvent.setup();
    render(<SalesView onBack={onBack} sessionToken="session-abc" />);

    expect(screen.getByText('Panel de Ventas')).toBeInTheDocument();
    const [assignedLabel] = screen.getAllByText('Mar de Plata');
    const assignedRow = assignedLabel.closest('div');
    expect(assignedRow).not.toBeNull();
    expect(within(assignedRow as HTMLElement).getByText(/Asignado/i)).toBeInTheDocument();

    const personasInput = screen.getByLabelText('Cantidad de personas') as HTMLInputElement;
    fireEvent.change(personasInput, { target: { value: '3' } });

    await user.click(screen.getByRole('button', { name: /Registrar reserva/i }));

    await vi.waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    expect(mutateAsyncMock).toHaveBeenCalledWith({
      tourOperatorId: 'op-1',
      personas: 3,
      horaSalida: '08:00',
      sessionToken: 'session-abc',
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Reserva asignada',
        description: '3 personas asignadas a Mar de Plata.',
      }),
    );
    expect(personasInput).toHaveValue(1);

    const statsCard = screen.getByText('Estadisticas del dia').closest('div');
    expect(statsCard).not.toBeNull();
    expect(within(statsCard as HTMLElement).getByText('25')).toBeInTheDocument();
    expect(within(statsCard as HTMLElement).getByText('60')).toBeInTheDocument();
  });

  it('shows a destructive toast when no operator can accept the booking', async () => {
    const operators = [
      buildOperator({
        id: 'op-1' as TourOperator['id'],
        nombre: 'Laguna Azul',
        capacidadTotal: 6,
        clientesHoy: 6,
        clientesPrevios: 4,
        horarios: ['07:00', '09:00'],
      }),
    ];
    mockOperators(operators);

    render(<SalesView onBack={vi.fn()} sessionToken="session-xyz" />);

    const personasInput = screen.getByLabelText('Cantidad de personas') as HTMLInputElement;
    await userEvent.clear(personasInput);
    await userEvent.type(personasInput, '25');

    const form = personasInput.closest('form');
    fireEvent.submit(form as HTMLFormElement);

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sin capacidad',
        description: 'No hay operadores disponibles para esta cantidad.',
        variant: 'destructive',
      }),
    );
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('notifies errors when the reservation mutation fails', async () => {
    const operators = [
      buildOperator({
        id: 'op-1' as TourOperator['id'],
        nombre: 'Ocean Breeze',
        capacidadTotal: 30,
        clientesHoy: 10,
        clientesPrevios: 5,
        horarios: ['10:00'],
      }),
    ];
    mockOperators(operators);

    const failure = new Error('Fallo Convex');
    mutateAsyncMock.mockRejectedValue(failure);

    const user = userEvent.setup();
    render(<SalesView onBack={vi.fn()} sessionToken="session-err" />);

    const personasInput = screen.getByLabelText('Cantidad de personas') as HTMLInputElement;
    await user.clear(personasInput);
    await user.type(personasInput, '4');

    await user.click(screen.getByRole('button', { name: /Registrar reserva/i }));

    await vi.waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error al registrar',
        description: 'Fallo Convex',
        variant: 'destructive',
      }),
    );
  });

  it('displays the error banner when operator data fails to load', () => {
    mockOperators([], { isError: true, error: new Error('No autorizado') });

    render(<SalesView onBack={vi.fn()} sessionToken="session-error" />);

    expect(
      screen.getByText('No fue posible cargar la informacion de operadores: No autorizado'),
    ).toBeInTheDocument();
  });

  it('invokes the back action when pressing the volver button', async () => {
    mockOperators([]);
    const onBack = vi.fn();
    const user = userEvent.setup();

    render(<SalesView onBack={onBack} sessionToken="session-back" />);

    await user.click(screen.getByRole('button', { name: /Volver/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
