
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Waves, Fish, User, Lock, AlertTriangle, WifiOff, ShieldCheck, Clock4, Compass } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signIn, signOut, signUp, type AppRole } from '@/lib/auth';

type AuthMode = 'signin' | 'signup';

type ModeCopy = {
  title: string;
  subtitle: string;
  button: string;
  helper: string;
  switchAction: string;
};

const copy: Record<AuthMode, ModeCopy> = {
  signin: {
    title: 'Inicia sesion',
    subtitle: 'Accede con tu cuenta de AquaReservas',
    button: 'Iniciar sesion',
    helper: 'No tienes cuenta?',
    switchAction: 'Crea una cuenta',
  },
  signup: {
    title: 'Crear cuenta',
    subtitle: 'Registra un nuevo perfil de vendedor',
    button: 'Registrarme',
    helper: 'Ya tienes cuenta?',
    switchAction: 'Inicia sesion',
  },
};

const roleLabel: Record<AppRole, string> = {
  admin: 'Administrador',
  seller: 'Vendedor',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const featureItems = [
  {
    icon: ShieldCheck,
    title: 'Seguridad garantizada',
    description: 'Sesiones cifradas y control de roles para todo el equipo.',
  },
  {
    icon: Clock4,
    title: 'Sincronizacion en tiempo real',
    description: 'Reservas y flotillas se actualizan al instante desde Convex.',
  },
  {
    icon: Compass,
    title: 'Operacion guiada',
    description: 'El panel sugiere al mejor operador segun la carga diaria.',
  },
] as const;

export const LoginScreen = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<AppRole>('seller');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const { toast } = useToast();

  const modeCopy = useMemo(() => copy[mode], [mode]);
  const currentDateLabel = useMemo(() => {
    try {
      return new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    } catch (error) {
      return '';
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  useEffect(() => {
    if (mode === 'signup') {
      setUserType('seller');
    }
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
    setFormError(null);
    setSubmitAttempted(false);
    setIsLoading(false);
  };

  const emailError = useMemo(() => {
    if (!submitAttempted) {
      return null;
    }

    const trimmed = email.trim();
    if (!trimmed) {
      return 'Proporciona un correo electronico.';
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      return 'Ingresa un correo valido (ej. nombre@empresa.com).';
    }

    return null;
  }, [email, submitAttempted]);

  const passwordError = useMemo(() => {
    if (!submitAttempted) {
      return null;
    }

    const trimmed = password.trim();
    if (!trimmed) {
      return 'La contrasena es obligatoria.';
    }

    if (trimmed.length < MIN_PASSWORD_LENGTH) {
      return `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }

    return null;
  }, [password, submitAttempted]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setFormError(null);

    const normalisedEmail = email.trim().toLowerCase();
    const safePassword = password.trim();

    if (normalisedEmail !== email) {
      setEmail(normalisedEmail);
    }

    if (safePassword !== password) {
      setPassword(safePassword);
    }

    if (!normalisedEmail || !safePassword) {
      setFormError('Proporciona correo y contrasena.');
      return;
    }

    if (!EMAIL_REGEX.test(normalisedEmail)) {
      setFormError('Ingresa un correo valido (ej. nombre@empresa.com).');
      return;
    }

    if (safePassword.length < MIN_PASSWORD_LENGTH) {
      setFormError(`La contrasena debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    if (!isOnline) {
      setFormError('Sin conexion a internet. Revisa tu red e intentalo de nuevo.');
      return;
    }

    setIsLoading(true);

    const selectedRole: AppRole = mode === 'signup' ? 'seller' : userType;

    if (mode === 'signup' && selectedRole !== 'seller') {
      setIsLoading(false);
      setFormError('Solo se pueden registrar cuentas de vendedor.');
      return;
    }

    try {
      if (mode === 'signin') {
        await signIn(normalisedEmail, safePassword, selectedRole);
        toast({ title: 'Bienvenido', description: `Sesion iniciada como ${roleLabel[selectedRole]}.` });
      } else {
        await signUp({ email: normalisedEmail, password: safePassword, role: selectedRole });
        toast({ title: 'Cuenta creada', description: `Listo, entraste como ${roleLabel[selectedRole]}.` });
        setMode('signin');
        setSubmitAttempted(false);
      }

      setPassword('');
      setFormError(null);
    } catch (error) {
      let message = error instanceof Error ? error.message : 'No se pudo procesar la solicitud.';
      const lowerMessage = message.toLowerCase();

      if (!isOnline) {
        message = 'Sin conexion a internet. Revisa tu red e intentalo de nuevo.';
      } else if (lowerMessage.includes('no existe')) {
        message = 'No encontramos una cuenta con ese correo. Verifica el rol o registrate.';
      } else if (lowerMessage.includes('contrasena')) {
        message = 'La contrasena es incorrecta para el rol seleccionado.';
      } else if (lowerMessage.includes('ya existe')) {
        message = 'Ya existe una cuenta con ese correo. Prueba iniciando sesion.';
      } else if (lowerMessage.includes('rol')) {
        message = 'El rol seleccionado no coincide con tu cuenta. Elige el rol correcto y vuelve a intentar.';
      }

      setFormError(message);
      await signOut();
    } finally {
      setIsLoading(false);
    }
  };

  const helperHint = mode === 'signup'
    ? 'Mayoristas y agencias reciben acceso al aprobar su cuenta.'
    : 'Usa el rol asignado en tu invitacion para evitar bloqueos.';

  return (
    <div className='relative flex h-screen flex-col overflow-hidden bg-gradient-to-br from-[#061527] via-[#0e7490]/85 to-[#f472b6]/60 text-slate-100 lg:flex-row'>
      <div className='pointer-events-none absolute inset-0'>
        <div className='absolute -left-24 top-8 h-72 w-72 rounded-full bg-primary/35 blur-3xl' />
        <div className='absolute bottom-[-120px] right-[-80px] h-96 w-96 rounded-full bg-secondary/30 blur-[200px]' />
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_65%)]' />
      </div>

      <aside className='relative z-10 flex h-full w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-6/12 xl:w-5/12'>
        <div className='absolute inset-y-14 left-0 -z-10 hidden w-60 rounded-3xl bg-primary/35 blur-3xl lg:block' />
        <div className='relative mx-auto w-full max-w-md space-y-8 rounded-[32px] border border-white/10 bg-slate-950/65 p-10 text-slate-100 shadow-[0_40px_140px_-80px_rgba(14,116,144,0.95)] backdrop-blur-2xl'>
          <div className='flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-slate-400/80'>
            <span>AquaReservas</span>
            <span>{currentDateLabel}</span>
          </div>

          <div className='flex items-center gap-3'>
            <div className='rounded-2xl bg-gradient-ocean p-3 shadow-lg shadow-primary/40 ring-4 ring-primary/10'>
              <Waves className='h-7 w-7 text-primary-foreground' />
            </div>
            <div>
              <p className='text-xs text-slate-400'>Bienvenido a</p>
              <h1 className='text-3xl font-bold text-white'>EquiTour</h1>
            </div>
          </div>

          <p className='text-sm text-slate-300'>Accede con tu cuenta para administrar operadores, ventas y flotillas en tiempo real.</p>

          <div className='flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3 shadow-inner shadow-primary/20'>
            <div>
              <p className='text-[10px] uppercase tracking-widest text-slate-400'>Modalidad actual</p>
              <p className='text-sm font-semibold text-white'>{modeCopy.title}</p>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={toggleMode}
              disabled={isLoading}
              className='text-primary-foreground transition hover:bg-primary/20 hover:text-primary-foreground'
            >
              {modeCopy.switchAction}
            </Button>
          </div>

          {!isOnline && (
            <Alert variant='destructive' className='border-destructive/40 bg-destructive/20 text-destructive-foreground'>
              <WifiOff className='h-4 w-4' />
              <AlertTitle>Sin conexion</AlertTitle>
              <AlertDescription>Revisa tu red antes de continuar.</AlertDescription>
            </Alert>
          )}

          {formError && (
            <Alert variant='destructive' className='border-destructive/40 bg-destructive/20 text-destructive-foreground'>
              <AlertTriangle className='h-4 w-4' />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className='space-y-4'>
            <p className='text-xs font-semibold uppercase tracking-wide text-slate-300'>Selecciona tu rol</p>
            <div className='grid grid-cols-2 gap-3'>
              {(['seller', 'admin'] as AppRole[]).map((roleOption) => {
                const isSelected = userType === roleOption;
                const isDisabled = mode === 'signup' && roleOption === 'admin';

                return (
                  <Button
                    key={roleOption}
                    type='button'
                    variant='outline'
                    onClick={() => setUserType(roleOption)}
                    className={`w-full justify-center rounded-xl border transition-all ${isSelected ? 'border-transparent bg-gradient-ocean text-primary-foreground shadow-lg shadow-primary/40' : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'}`}
                    disabled={isLoading || isDisabled}
                  >
                    {roleOption === 'seller' ? <User className='mr-2 h-4 w-4' /> : <Lock className='mr-2 h-4 w-4' />}
                    {roleLabel[roleOption]}
                  </Button>
                );
              })}
            </div>
            {mode === 'signup' ? (
              <p className='text-xs text-slate-400'>Los perfiles de administrador se asignan desde el panel de control.</p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className='space-y-5'>
            <div className='space-y-2'>
              <label htmlFor='email' className='text-xs font-semibold uppercase tracking-wide text-slate-300'>
                Correo electronico
              </label>
              <Input
                id='email'
                type='email'
                autoComplete='email'
                placeholder='usuario@aquareservas.com'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className='h-12 rounded-xl border-white/10 bg-slate-900/40 text-slate-100 placeholder:text-slate-400 focus:border-primary focus:bg-slate-900/60 focus:text-white'
                disabled={isLoading}
                required
              />
              {emailError ? (
                <p className='text-xs text-destructive'>{emailError}</p>
              ) : (
                <p className='text-xs text-slate-400'>Usa tu correo corporativo registrado.</p>
              )}
            </div>

            <div className='space-y-2'>
              <label htmlFor='password' className='text-xs font-semibold uppercase tracking-wide text-slate-300'>
                Contrasena
              </label>
              <Input
                id='password'
                type='password'
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder='********'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className='h-12 rounded-xl border-white/10 bg-slate-900/40 text-slate-100 placeholder:text-slate-400 focus:border-primary focus:bg-slate-900/60 focus:text-white'
                disabled={isLoading}
                required
              />
              {passwordError ? (
                <p className='text-xs text-destructive'>{passwordError}</p>
              ) : (
                <p className='text-xs text-slate-400'>Minimo {MIN_PASSWORD_LENGTH} caracteres. Usa letras y numeros.</p>
              )}
            </div>

            <Button
              type='submit'
              variant='ocean'
              size='lg'
              className='h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/40'
              disabled={isLoading}
            >
              {isLoading ? 'Procesando...' : modeCopy.button}
            </Button>
          </form>

          <div className='space-y-2 text-center text-sm'>
            <p className='text-slate-300'>
              {modeCopy.helper}{' '}
              <button
                type='button'
                className='text-primary hover:underline'
                onClick={toggleMode}
                disabled={isLoading}
              >
                {mode === 'signin' ? copy.signup.switchAction : copy.signin.switchAction}
              </button>
            </p>
            <p className='text-xs text-slate-400'>{helperHint}</p>
          </div>
        </div>
      </aside>

      <section className='relative z-10 hidden h-full flex-1 flex-col justify-between gap-12 overflow-hidden px-12 py-16 lg:flex'>
        <div className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.28),_transparent_70%)]' />

        <div className='relative max-w-xl space-y-4'>
          <Badge variant='secondary' className='border border-white/20 bg-white/25 text-slate-900 shadow-sm backdrop-blur'>
            Plataforma EquiTour
          </Badge>
          <h2 className='text-4xl font-semibold text-white drop-shadow'>Gestiona tu operacion acuatica sin esfuerzo.</h2>
          <p className='text-lg text-slate-100/80'>Ingresa para monitorear ventas, disponibilidad y equipo en un panel unificado.</p>
        </div>

        <div className='relative max-w-xl space-y-5 rounded-[28px] border border-white/10 bg-white/12 p-8 shadow-2xl shadow-primary/25 backdrop-blur-2xl'>
          {featureItems.map((feature) => (
            <div key={feature.title} className='flex items-center gap-4 rounded-2xl bg-slate-950/30 p-4 backdrop-blur-xl'>
              <div className='flex h-11 w-11 items-center justify-center rounded-full bg-gradient-ocean text-primary-foreground shadow-lg shadow-primary/30'>
                <feature.icon className='h-5 w-5' />
              </div>
              <div>
                <h3 className='text-base font-semibold text-white'>{feature.title}</h3>
                <p className='text-sm text-slate-200/90'>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
