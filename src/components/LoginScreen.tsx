import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves, Fish, User, Lock } from "lucide-react";
import snorkelHero from "@/assets/snorkel-hero.jpg";

interface LoginScreenProps {
  onLogin: (userType: 'admin' | 'seller') => void;
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<'admin' | 'seller'>('seller');

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${snorkelHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-depth/60"></div>
      </div>
      
      {/* Floating animations */}
      <div className="absolute top-1/4 left-1/4 animate-float">
        <Fish className="h-8 w-8 text-primary-glow/30" />
      </div>
      <div className="absolute top-1/3 right-1/3 animate-wave">
        <Fish className="h-6 w-6 text-accent/40" />
      </div>
      <div className="absolute bottom-1/4 left-1/3 animate-float delay-1000">
        <Fish className="h-10 w-10 text-secondary/30" />
      </div>

      {/* Login Form */}
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
              Sistema de Reservaciones de Snorkel
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* User Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Tipo de Usuario</label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={userType === 'seller' ? 'ocean' : 'outline'}
                  onClick={() => setUserType('seller')}
                  className="w-full"
                >
                  <User className="h-4 w-4 mr-2" />
                  Vendedor
                </Button>
                <Button
                  type="button"
                  variant={userType === 'admin' ? 'ocean' : 'outline'}
                  onClick={() => setUserType('admin')}
                  className="w-full"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Administrador
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Correo Electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-background/80 border-border/50 focus:bg-background"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-background/80 border-border/50 focus:bg-background"
                />
              </div>
            </div>
            
            <Button 
              variant="ocean" 
              size="lg" 
              className="w-full h-12 text-base font-semibold"
              onClick={() => onLogin(userType)}
            >
              Iniciar Sesión como {userType === 'admin' ? 'Administrador' : 'Vendedor'}
            </Button>
            
            <div className="text-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};