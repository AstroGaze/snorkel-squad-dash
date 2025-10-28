import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AddTourOperatorForm } from './AddTourOperatorForm';
import type { OperatorBoat, TourOperatorInput } from '@/lib/operators';

const onSubmitMock = vi.fn<(payload: TourOperatorInput) => Promise<void>>();
const onCancelMock = vi.fn();

const buildInitialData = (overrides: Partial<TourOperatorInput> = {}): TourOperatorInput => ({
  nombre: 'Coral Adventures',
  contacto: {
    telefono: '+52 998 123 4567',
    email: 'ventas@coral.com',
    direccion: 'Marina Cancun',
  },
  botes: [
    { nombre: 'Coral Star', capacidad: 12, estado: 'Activo', tipo: 'Lancha' },
  ],
  personal: 6,
  capacidadTotal: 24,
  horarios: ['08:00', '12:00'],
  especialidad: 'Snorkel',
  ...overrides,
});

beforeEach(() => {
  onSubmitMock.mockReset();
  onCancelMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('AddTourOperatorForm', () => {
  it('renders creation form and enables submission when minimal requirements are met', async () => {
    const user = userEvent.setup();
    onSubmitMock.mockResolvedValue(undefined);

    render(
      <AddTourOperatorForm
        title="Registrar operador"
        onSubmit={onSubmitMock}
        onCancel={onCancelMock}
      />,
    );

    expect(screen.getByText('Registrar operador')).toBeInTheDocument();
    const submitButton = screen.getByRole('button', { name: /Crear tour operador/i }) as HTMLButtonElement;
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Coral Adventures'), 'Aqua Tours');
    await user.type(screen.getByLabelText(/Equipo disponible/i), '8');
    await user.type(screen.getByLabelText(/Capacidad diaria/i), '32');
    await user.type(screen.getByLabelText('Teléfono*'), '+52 999 222 1111');

    const boatSection = screen.getByText('Registrar embarcación').closest('div') as HTMLDivElement;
    await user.type(within(boatSection).getByPlaceholderText('Nombre del bote'), 'Marlin I');
    const capacityField = within(boatSection).getByPlaceholderText('Capacidad') as HTMLInputElement;
    await user.clear(capacityField);
    fireEvent.change(capacityField, { target: { value: '15' } });
    const boatButtons = Array.from(boatSection.querySelectorAll('button'));
    const addBoatButton = boatButtons[boatButtons.length - 1] as HTMLButtonElement;
    fireEvent.click(addBoatButton);
    await screen.findByText(/Marlin I/);

    await waitFor(() => expect(submitButton).not.toBeDisabled());

    await user.click(submitButton);

    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    const payload = onSubmitMock.mock.calls[0][0] as TourOperatorInput;
    expect(payload.nombre).toBe('Aqua Tours');
    expect(payload.botes).toHaveLength(1);
    const [boat] = payload.botes;
    expect(boat.nombre).toBe('Marlin I');
    expect(boat.capacidad).toBe(15);
    expect(boat.tipo).toBe('Lancha');
  });

  it('prefills fields when editing and calls submitters with normalized data', async () => {
    const user = userEvent.setup();
    const initialData = buildInitialData({
      botes: [
        { nombre: 'Lagoon Runner', capacidad: 18, estado: 'Mantenimiento', tipo: 'Catamaran' },
        { nombre: 'Sea Whisper', capacidad: 0, estado: 'Activo', tipo: 'Lancha' },
      ],
      horarios: ['09:00', '09:00', '15:00'],
    });

    render(
      <AddTourOperatorForm
        initialData={initialData}
        submitting={false}
        onSubmit={onSubmitMock}
        onCancel={onCancelMock}
      />,
    );

    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
    expect((screen.getByPlaceholderText('Coral Adventures') as HTMLInputElement).value).toBe('Coral Adventures');

    const boatList = screen.getAllByText(/Lagoon Runner|Sea Whisper/);
    expect(boatList).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    const payload = onSubmitMock.mock.calls[0][0] as TourOperatorInput;
    expect(payload.botes[1].capacidad).toBe(1);
    expect(payload.horarios).toEqual(['09:00', '15:00']);
  });

  it('allows removing boats and schedules', async () => {
    const user = userEvent.setup();
    render(
      <AddTourOperatorForm
        initialData={buildInitialData({
          horarios: ['07:30'],
        })}
        onSubmit={onSubmitMock}
        onCancel={onCancelMock}
      />,
    );

    const boatText = screen.getByText('Coral Star');
    const boatWrapper = boatText.parentElement?.parentElement as HTMLDivElement;
    const removeBoatButton = within(boatWrapper).getByRole('button', { hidden: true });
    await user.click(removeBoatButton);
    expect(screen.queryByText(/Coral Star/)).not.toBeInTheDocument();

    const scheduleBadge = screen
      .getAllByText('07:30')
      .map((node) => node.parentElement)
      .find((element) => element?.querySelector('button')) as HTMLDivElement | undefined;
    if (!scheduleBadge) {
      throw new Error('Schedule badge not found');
    }
    const removeScheduleButton = scheduleBadge.querySelector('button');
    fireEvent.click(removeScheduleButton as HTMLButtonElement);
    const remainingBadges = screen.queryAllByText((content, element) => {
      return content === '07:30' && element.parentElement?.classList.contains('inline-flex');
    });
    expect(remainingBadges.length).toBe(0);
  });

  it('resets staging inputs after adding a boat or schedule', async () => {
    const user = userEvent.setup();
    render(<AddTourOperatorForm onSubmit={onSubmitMock} onCancel={onCancelMock} />);

    const nameField = screen.getByPlaceholderText('Nombre del bote') as HTMLInputElement;
    const capacityField = screen.getByPlaceholderText('Capacidad') as HTMLInputElement;
    await user.type(nameField, 'Sea Breeze');
    await user.clear(capacityField);
    await user.type(capacityField, '20');
    const boatSection = screen.getByText('Registrar embarcación').closest('div') as HTMLDivElement;
    const boatButtons = Array.from(boatSection.querySelectorAll('button'));
    const addBoatButton = boatButtons[boatButtons.length - 1] as HTMLButtonElement;
    fireEvent.click(addBoatButton);

    await waitFor(() => {
      expect(nameField.value).toBe('');
      expect(capacityField.value).toBe('1');
    });
  });

  it('disables submission while mutation is in flight', () => {
    render(
      <AddTourOperatorForm
        initialData={buildInitialData()}
        submitting
        onSubmit={onSubmitMock}
        onCancel={onCancelMock}
      />,
    );

    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
  });

  it('triggers the cancel handler', async () => {
    const user = userEvent.setup();
    render(
      <AddTourOperatorForm
        initialData={buildInitialData()}
        onSubmit={onSubmitMock}
        onCancel={onCancelMock}
      />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Cancelar' })[0]);
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });
});
