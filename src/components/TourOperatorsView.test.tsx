import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TourOperatorsView } from './TourOperatorsView';
import type { TourOperator, TourOperatorId, TourOperatorInput } from '@/lib/operators';

const toastMock = vi.hoisted(() => vi.fn());
const useOperatorsBundleMock = vi.hoisted(() => vi.fn());
const useUpsertTourOperatorMock = vi.hoisted(() => vi.fn());
const useDeleteTourOperatorMock = vi.hoisted(() => vi.fn());
const upsertMutateMock = vi.hoisted(() => vi.fn());
const deleteMutateMock = vi.hoisted(() => vi.fn());
const formRenderMock = vi.hoisted(() => vi.fn());

let formSubmitPayload: TourOperatorInput;

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/hooks/useOperatorsData', () => ({
  useOperatorsBundle: useOperatorsBundleMock,
  useUpsertTourOperator: useUpsertTourOperatorMock,
  useDeleteTourOperator: useDeleteTourOperatorMock,
}));

vi.mock('./AddTourOperatorForm', () => ({
  AddTourOperatorForm: (props: {
    onSubmit: (input: TourOperatorInput) => Promise<void>;
    onCancel: () => void;
    title: string;
    submitting: boolean;
    initialData?: TourOperatorInput;
  }) => {
    formRenderMock(props);

    return (
      <div data-testid="add-operator-form">
        <p data-testid="form-title">{props.title}</p>
        <button type="button" onClick={() => props.onSubmit(formSubmitPayload)} disabled={props.submitting}>
          Guardar operador
        </button>
        <button type="button" onClick={props.onCancel}>
          Cancelar
        </button>
        {props.initialData ? (
          <pre data-testid="form-initial">{JSON.stringify(props.initialData)}</pre>
        ) : (
          <span data-testid="form-initial-empty">sin datos</span>
        )}
      </div>
    );
  },
}));

const buildOperator = (overrides: Partial<TourOperator>): TourOperator => ({
  id: overrides.id ?? ('op-' + Math.random()) as TourOperatorId,
  nombre: overrides.nombre ?? 'Operador Demo',
  contacto: overrides.contacto ?? {
    telefono: '999-000-0000',
    email: 'info@demo.com',
    direccion: 'Mar Caribe',
  },
  botes: overrides.botes ?? [
    { nombre: 'Coral I', capacidad: 12, estado: 'Activo', tipo: 'Lancha' },
  ],
  personal: overrides.personal ?? 6,
  capacidadTotal: overrides.capacidadTotal ?? 24,
  horarios: overrides.horarios ?? ['08:00', '12:00'],
  especialidad: overrides.especialidad ?? 'Snorkel',
  clientesHoy: overrides.clientesHoy ?? 0,
  clientesPrevios: overrides.clientesPrevios ?? 0,
});

const setOperatorsState = ({
  operators = [],
  isLoading = false,
  isError = false,
  error = null,
}: {
  operators?: TourOperator[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
}) => {
  useOperatorsBundleMock.mockReturnValue({
    data: { operators, reservationsToday: [], weeklyPerformance: [] },
    isLoading,
    isError,
    error,
  });
};

const configureMutations = ({
  upsertPending = false,
  deletePending = false,
}: {
  upsertPending?: boolean;
  deletePending?: boolean;
} = {}) => {
  useUpsertTourOperatorMock.mockReturnValue({
    mutateAsync: upsertMutateMock,
    isPending: upsertPending,
  });

  useDeleteTourOperatorMock.mockReturnValue({
    mutateAsync: deleteMutateMock,
    isPending: deletePending,
  });
};

beforeEach(() => {
  toastMock.mockReset();
  useOperatorsBundleMock.mockReset();
  useUpsertTourOperatorMock.mockReset();
  useDeleteTourOperatorMock.mockReset();
  upsertMutateMock.mockReset();
  deleteMutateMock.mockReset();
  formRenderMock.mockReset();
  formSubmitPayload = {
    nombre: 'Nuevo Operador',
    contacto: { telefono: '123', email: 'nuevo@demo.com', direccion: 'Centro' },
    botes: [],
    personal: 4,
    capacidadTotal: 12,
    horarios: [],
    especialidad: 'Kayak',
  };
  configureMutations();
});

afterEach(() => {
  cleanup();
});

describe('TourOperatorsView', () => {
  it('renders operator metrics and details', () => {
    const operators = [
      buildOperator({
        id: 'op-1' as TourOperatorId,
        nombre: 'Mar de Plata',
        capacidadTotal: 20,
        botes: [
          { nombre: 'Reef Runner', capacidad: 10, estado: 'Activo', tipo: 'Catamarán' },
          { nombre: 'Sea Breeze', capacidad: 8, estado: 'Mantenimiento', tipo: 'Lancha' },
        ],
      }),
      buildOperator({
        id: 'op-2' as TourOperatorId,
        nombre: 'Coral Expeditions',
        capacidadTotal: 30,
        botes: [{ nombre: 'Coral Star', capacidad: 15, estado: 'Activo', tipo: 'Yate' }],
      }),
    ];

    setOperatorsState({ operators });
    const onBack = vi.fn();
    render(<TourOperatorsView onBack={onBack} />);

    expect(screen.getByText('Operadores turísticos')).toBeInTheDocument();

    const getMetricValue = (label: string) => {
      const title = screen.getByText(label);
      const card = title.parentElement?.parentElement;
      if (!card) {
        throw new Error(`No se encontró la tarjeta para la métrica "${label}"`);
      }
      return card.querySelector('p')?.textContent ?? '';
    };

    expect(getMetricValue('Total de operadores')).toContain('2');
    expect(getMetricValue('Capacidad combinada')).toContain('50');
    expect(getMetricValue('Embarcaciones registradas')).toContain('3');
    expect(screen.getByText('Mar de Plata')).toBeInTheDocument();
    expect(screen.getByText('Coral Expeditions')).toBeInTheDocument();
  });

  it('opens the creation form and persists a new operator successfully', async () => {
    const user = userEvent.setup();
    const operators = [buildOperator({ id: 'op-1' as TourOperatorId })];
    setOperatorsState({ operators });
    configureMutations();
    upsertMutateMock.mockResolvedValue({ id: 'op-3' });

    render(<TourOperatorsView onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Agregar operador' }));

    expect(screen.getByTestId('add-operator-form')).toBeInTheDocument();
    expect(formRenderMock).toHaveBeenLastCalledWith(expect.objectContaining({ initialData: undefined }));

    await user.click(screen.getByRole('button', { name: 'Guardar operador' }));

    await waitFor(() => expect(upsertMutateMock).toHaveBeenCalledTimes(1));
    expect(upsertMutateMock).toHaveBeenCalledWith(formSubmitPayload);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Tour operador guardado',
        description: 'Los datos se sincronizaron correctamente.',
      }),
    );
    expect(screen.queryByTestId('add-operator-form')).not.toBeInTheDocument();
  });

  it('keeps the form open and shows an error toast when saving fails', async () => {
    const user = userEvent.setup();
    const operators = [buildOperator({ id: 'op-1' as TourOperatorId })];
    setOperatorsState({ operators });
    upsertMutateMock.mockRejectedValue(new Error('No se pudo guardar'));

    render(<TourOperatorsView onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Agregar operador' }));
    await user.click(screen.getByRole('button', { name: 'Guardar operador' }));

    await waitFor(() => expect(upsertMutateMock).toHaveBeenCalledTimes(1));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error al guardar',
        description: 'No se pudo guardar',
        variant: 'destructive',
      }),
    );
    expect(screen.getByTestId('add-operator-form')).toBeInTheDocument();
  });

  it('prefills data when editing an operator', async () => {
    const user = userEvent.setup();
    const operators = [
      buildOperator({
        id: 'op-1' as TourOperatorId,
        nombre: 'Isla Aventura',
        especialidad: 'Buceo',
        capacidadTotal: 25,
      }),
    ];
    setOperatorsState({ operators });

    render(<TourOperatorsView onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Editar' }));

    expect(formRenderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Editar tour operador',
        initialData: expect.objectContaining({
          id: 'op-1',
          nombre: 'Isla Aventura',
        }),
      }),
    );
  });

  it('confirms deletion and notifies success', async () => {
    const user = userEvent.setup();
    const operators = [buildOperator({ id: 'op-1' as TourOperatorId, nombre: 'Laguna Azul' })];
    setOperatorsState({ operators });
    deleteMutateMock.mockResolvedValue(undefined);

    render(<TourOperatorsView onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(deleteMutateMock).toHaveBeenCalledWith('op-1'));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Tour operador eliminado',
        description: 'El registro fue eliminado.',
      }),
    );
  });

  it('surfaces errors that occur while deleting an operator', async () => {
    const user = userEvent.setup();
    const operators = [buildOperator({ id: 'op-1' as TourOperatorId })];
    setOperatorsState({ operators });
    deleteMutateMock.mockRejectedValue(new Error('Bloqueado'));

    render(<TourOperatorsView onBack={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(deleteMutateMock).toHaveBeenCalledTimes(1));
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Error al eliminar',
        description: 'Bloqueado',
        variant: 'destructive',
      }),
    );
  });

  it('displays an error banner when the bundle fails to load', () => {
    setOperatorsState({ operators: [], isError: true, error: new Error('Sin permisos') });
    render(<TourOperatorsView onBack={vi.fn()} />);

    expect(
      screen.getByText('Ocurrió un problema al cargar los operadores: Sin permisos'),
    ).toBeInTheDocument();
  });

  it('shows loading state and empty state messaging', () => {
    setOperatorsState({ operators: [], isLoading: true });
    const view = render(<TourOperatorsView onBack={vi.fn()} />);
    expect(screen.getByText('Cargando operadores locales...')).toBeInTheDocument();

    setOperatorsState({ operators: [], isLoading: false });
    view.rerender(<TourOperatorsView onBack={vi.fn()} />);
    expect(
      screen.getByText('Aún no hay operadores registrados. Utiliza "Agregar operador" para crear el primero.'),
    ).toBeInTheDocument();
  });

  it('invokes the provided back handler', async () => {
    const user = userEvent.setup();
    setOperatorsState({ operators: [] });
    const onBack = vi.fn();
    render(<TourOperatorsView onBack={onBack} />);

    await user.click(screen.getByRole('button', { name: 'Volver' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
