import { useState } from "react";
import { LoginScreen } from "@/components/LoginScreen";
import { Dashboard } from "@/components/Dashboard";
import { SalesView } from "@/components/SalesView";
import { ThemeToggle } from "@/components/theme-toggle";

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'seller'>('seller');

  const handleLogin = (type: 'admin' | 'seller') => {
    setUserType(type);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserType('seller');
  };

  return (
    <>
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {!isLoggedIn ? (
        <LoginScreen onLogin={handleLogin} />
      ) : userType === 'admin' ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <SalesView onBack={handleLogout} />
      )}
    </>
  );
};

export default Index;
