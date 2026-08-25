import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import DashboardStokDurumu from './pages/DashboardStokDurumu';
import StokFisForm from './pages/StokFisForm';
import Kartoteks from './pages/Kartoteks';
import HareketListesi from './pages/HareketListesi';
import Malzemeler from './pages/Malzemeler';
import Depolar from './pages/Depolar';
import Raporlar from './pages/Raporlar';
import Profil from './pages/Profil';

function App() {
  return (
    <Router>
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardStokDurumu />} />
                <Route
                  path="fis-olustur"
                  element={
                    <ProtectedRoute roles={['Admin', 'DepoSorumlusu', 'DepoPersoneli']}>
                      <StokFisForm />
                    </ProtectedRoute>
                  }
                />
                <Route path="kartoteks" element={<Kartoteks />} />
                <Route path="hareketler" element={<HareketListesi />} />
                <Route
                  path="malzemeler"
                  element={
                    <ProtectedRoute roles={['Admin', 'DepoSorumlusu']}>
                      <Malzemeler />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="depolar"
                  element={
                    <ProtectedRoute roles={['Admin', 'DepoSorumlusu']}>
                      <Depolar />
                    </ProtectedRoute>
                  }
                />
                <Route path="raporlar" element={<Raporlar />} />
                <Route path="profil" element={<Profil />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
