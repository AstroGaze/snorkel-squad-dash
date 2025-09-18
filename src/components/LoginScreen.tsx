import { FormEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Waves, Fish, User, Lock } from 'lucide-react';
import snorkelHero from '@/assets/snorkel-hero.jpg';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseClient, getRoleFromMetadata, type AppRole } from '@/lib/supabaseClient';

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
    subtitle: 'Registra un nuevo perfil de operador',
    button: 'Registrarme',
    helper: 'Ya tienes cuenta?',
    switchAction: 'Inicia sesion',
  },
};

const roleLabel: Record<AppRole, string> = {
  admin: 'Administrador',
  seller: 'Vendedor',
};

const supabase = getSupabaseClient();

export const LoginScreen = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<AppRole>('seller');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const modeCopy = useMemo(() => copy[mode], [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Proporciona correo y contrasena.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          throw error;
        }

        const role = getRoleFromMetadata(data.user?.user_metadata);

        if (!role) {
          await supabase.auth.signOut();
          throw new Error('Tu cuenta no tiene un rol asignado. Contacta al administrador.');
        }

        if (role !== userType) {
          await supabase.auth.signOut();
          throw new Error('El rol seleccionado no coincide con el rol de tu cuenta.');
        }

        toast({
          title: 'Bienvenido',
          description: `Sesion iniciada como ${roleLabel[role]}.`,
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: userType },
          },
        });

        if (error) {
          throw error;
        }

        toast({
          title: 'Cuenta creada',
          description: 'Revisa tu correo para confirmar la cuenta si es necesario.',
        });
        setMode('signin');
      }

      setPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Hubo un problema al procesar tu solicitud.';
      setFormError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${snorkelHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-depth/60" />
      </div>

      <div className="absolute top-1/4 left-1/4 animate-float">
        <Fish className="h-8 w-8 text-primary-glow/30" />
      </div>
      <div className="absolute top-1/3 right-1/3 animate-wave">
        <Fish className="h-6 w-6 text-accent/40" />
      </div>
      <div className="absolute bottom-1/4 left-1/3 animate-float delay-1000">
        <Fish className="h-10 w-10 text-secondary/30" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-depth backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-gradient-ocean">
                <Waves className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-ocean bg-clip-text text-transparent">
              EquiTour
            </CardTitle>
            <CardDescription className="text-base">
              {modeCopy.subtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">{modeCopy.title}</h2>
              <Button variant="ghost" size="sm" onClick={toggleMode} disabled={isLoading}>
                {modeCopy.switchAction}
              </Button>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Rol</label>
              <div className="grid grid-cols-2 gap-3">
                {(['seller', 'admin'] as AppRole[]).map((roleOption) => (
                  <Button
                    key={roleOption}
                    type="button"
                    variant={userType === roleOption ? 'ocean' : 'outline'}
                    onClick={() => setUserType(roleOption)}
                    className="w-full"
                    disabled={isLoading}
                  >
                    {roleOption === 'seller' ? (
                      <User className="h-4 w-4 mr-2" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    {roleLabel[roleOption]}
                  </Button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Correo electronico
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-background/80 border-border/50 focus:bg-background"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contrasena
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-background/80 border-border/50 focus:bg-background"
                  disabled={isLoading}
                  required
                />
              </div>

              {formError ? (
                <p className="text-sm text-destructive text-center">{formError}</p>
              ) : null}

              <Button
                type="submit"
                variant="ocean"
                size="lg"
                className="w-full h-12 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Procesando...' : modeCopy.button}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {modeCopy.helper}{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={toggleMode}
                  disabled={isLoading}
                >
                  {mode === 'signin' ? copy.signup.switchAction : copy.signin.switchAction}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

