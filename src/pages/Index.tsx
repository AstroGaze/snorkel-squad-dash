import { LoginScreen } from '@/components/LoginScreen';
import { Dashboard } from '@/components/Dashboard';
import { SalesView } from '@/components/SalesView';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { session, role, loading, signOut } = useAuth();

  const handleLogout = () => {
    signOut().catch((error) => {
      console.error('Error while signing out', error);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-surface text-foreground">
        Cargando...
      </div>
    );
  }

  if (!session || !role) {
    return <LoginScreen />;
  }

  return role === 'admin' ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <SalesView onBack={handleLogout} sessionToken={session.token} />
  );
};

export default Index;
