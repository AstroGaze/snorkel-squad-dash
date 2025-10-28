import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LoginScreen } from './LoginScreen';

const { toastMock } = vi.hoisted(() => ({
  toastMock: vi.fn(),
}));

const { signInMock, signUpMock, signOutMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signUpMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock('@/lib/auth', () => ({
  signIn: signInMock,
  signUp: signUpMock,
  signOut: signOutMock,
}));

const originalNavigatorOnLine = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');

const setNavigatorOnLine = (value: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get: () => value,
  });
};

beforeEach(() => {
  setNavigatorOnLine(true);
  toastMock.mockReset();
  signInMock.mockReset();
  signUpMock.mockReset();
  signOutMock.mockReset();
});

afterEach(() => {
  cleanup();
  if (originalNavigatorOnLine) {
    Object.defineProperty(window.navigator, 'onLine', originalNavigatorOnLine);
  } else {
    setNavigatorOnLine(true);
  }
});

describe('LoginScreen', () => {
  it('renders sign-in mode by default and toggles to sign-up', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    const modeContainer = screen.getByText('Modalidad actual').parentElement as HTMLElement;
    expect(within(modeContainer).getByText('Inicia sesion')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Crea una cuenta' })[0]);

    const updatedModeContainer = screen.getByText('Modalidad actual').parentElement as HTMLElement;
    expect(within(updatedModeContainer).getByText('Crear cuenta')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Registrarme' })).toBeInTheDocument();

    const adminRoleButton = screen.getByRole('button', { name: 'Administrador' }) as HTMLButtonElement;
    expect(adminRoleButton).toBeDisabled();

    const sellerRoleButton = screen.getByRole('button', { name: 'Vendedor' }) as HTMLButtonElement;
    expect(sellerRoleButton).not.toBeDisabled();

    expect(screen.getByRole('button', { name: 'Registrarme' })).toBeInTheDocument();
  });

  it('shows validation feedback when email or password are invalid', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.type(screen.getByLabelText('Correo electronico'), 'invalid');
    await user.type(screen.getByLabelText('Contrasena'), '123');

    const form = screen.getByLabelText('Correo electronico').closest('form') as HTMLFormElement;
    fireEvent.submit(form);

    const emailErrors = await screen.findAllByText(/Ingresa un correo valido/i);
    expect(emailErrors.length).toBeGreaterThan(0);
    expect(await screen.findByText(/Usa al menos 8 caracteres/i)).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('submits sign-in with trimmed credentials and selected role', async () => {
    const user = userEvent.setup();
    const session = { token: 'token', email: 'admin@example.com', role: 'admin', expiresAt: Date.now() + 1000 };
    signInMock.mockResolvedValue(session);

    render(<LoginScreen />);

    await user.click(screen.getByRole('button', { name: 'Administrador' }));
    await user.type(screen.getByLabelText('Correo electronico'), ' Admin@Example.COM ');
    await user.type(screen.getByLabelText('Contrasena'), ' password123 ');

    await user.click(screen.getByRole('button', { name: 'Iniciar sesion' }));

    await waitFor(() => expect(signInMock).toHaveBeenCalledTimes(1));
    expect(signInMock).toHaveBeenCalledWith('admin@example.com', 'password123', 'admin');
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bienvenido',
        description: 'Sesion iniciada como Administrador.',
      }),
    );
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it('registers seller accounts and returns to sign-in mode after success', async () => {
    const user = userEvent.setup();
    const session = { token: 'token', email: 'newuser@example.com', role: 'seller', expiresAt: Date.now() + 1000 };
    signUpMock.mockResolvedValue(session);

    render(<LoginScreen />);

    await user.click(screen.getAllByRole('button', { name: 'Crea una cuenta' })[0]);

    const adminRoleButton = screen.getByRole('button', { name: 'Administrador' }) as HTMLButtonElement;
    expect(adminRoleButton).toBeDisabled();

    await user.type(screen.getByLabelText('Correo electronico'), ' newuser@example.com ');
    await user.type(screen.getByLabelText('Contrasena'), ' password123 ');

    await user.click(screen.getByRole('button', { name: 'Registrarme' }));

    await waitFor(() => expect(signUpMock).toHaveBeenCalledTimes(1));
    expect(signUpMock).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
      role: 'seller',
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Cuenta creada',
        description: 'Listo, entraste como Vendedor.',
      }),
    );
    const form = screen.getByLabelText('Correo electronico').closest('form') as HTMLFormElement;
    await waitFor(() => expect(within(form).getByRole('button', { name: 'Iniciar sesion' })).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Registrarme' })).not.toBeInTheDocument();
  });

  it('blocks submissions while offline and surfaces an error message', async () => {
    const user = userEvent.setup();
    setNavigatorOnLine(false);

    render(<LoginScreen />);

    expect(screen.getByText('Sin conexion')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Correo electronico'), 'ventas@aquareservas.com');
    await user.type(screen.getByLabelText('Contrasena'), 'password123');

    const form = screen.getByLabelText('Correo electronico').closest('form') as HTMLFormElement;
    await user.click(within(form).getByRole('button', { name: 'Iniciar sesion' }));

    expect(signInMock).not.toHaveBeenCalled();
    expect(await screen.findByText('Sin conexion a internet. Revisa tu red e intentalo de nuevo.')).toBeInTheDocument();
    expect(screen.getByText('Revisa tu red antes de continuar.')).toBeInTheDocument();
  });
});
