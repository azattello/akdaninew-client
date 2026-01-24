import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './components/styles/global.css';
import Home from "./components/Home";
import Registration from "./components/Registration";
import Login from "./components/Login";
import Main from "./components/Main";
import Parcels from "./components/Parcels";
import Notification from "./components/Notification";
import Profile from "./components/Profile";
import LostClient from "./components/LostClient";
import Dashboard from "./components/dashboard/Dashboard";
import ArchivePage from "./components/ArchivePage";
import { useDispatch } from "react-redux";
import { auth } from "./action/user";
import { useSelector } from 'react-redux';
import NotFound from "./components/NotFound";
import Referral from "./components/Referral";
import ProtectedRoute from "./components/ProtectedRoute";
import AnnouncementManager from "./components/AnnouncementManager";
// Pages
import Bonuses from './components/pages/Bonuses';
import Filials from './components/pages/Filials';
import Invoices from './components/pages/Invoices';
import Warehouse from './components/pages/Warehouse';
import QRPage from './components/pages/QRPage';
import Terms from './components/pages/Terms';
import Contacts from './components/pages/Contacts';
import Settings from './components/pages/Settings';
import Manager from './components/pages/Manager';
import PublicOffer from './components/pages/PublicOffer';

import './i18n'; // Подключение i18n для инициализации

// Global UI helpers
import Toast from './components/Toast';
import Confirm from './components/Confirm';

function App() {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем авторизацию при загрузке и ждём результата
    const checkAuth = async () => {
      await dispatch(auth());
      setIsLoading(false);
    };
    checkAuth();
  }, [dispatch]);

  const isAuth = useSelector(state => state.user.isAuth);

  // Во время загрузки показываем заглушку
  if (isLoading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
      <p>Загрузка...</p>
    </div>;
  }

  return (
    <Router>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/" element={<Home />} />
        <Route path="/public-offer" element={<PublicOffer />} />
        <Route path="/login" element={isAuth ? <Navigate to="/main" /> : <Login />} />
        <Route path="/registration" element={isAuth ? <Navigate to="/main" /> : <Registration />} />
        
        {/* Защищенные маршруты (доступны только авторизованным пользователям) */}
        <Route path="/main" element={<ProtectedRoute><Main /></ProtectedRoute>} />
        <Route path="/parcels" element={<ProtectedRoute><Parcels /></ProtectedRoute>} />
        <Route path="/notification" element={<ProtectedRoute><Notification /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/lost" element={<ProtectedRoute><LostClient /></ProtectedRoute>} />
        <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
        <Route path="/archive" element={<ProtectedRoute><ArchivePage /></ProtectedRoute>} />

        {/* Pages for main menu (защищенные) */}
        <Route path="/bonus" element={<ProtectedRoute><Bonuses /></ProtectedRoute>} />
        <Route path="/filials" element={<ProtectedRoute><Filials /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path="/warehouse" element={<ProtectedRoute><Warehouse /></ProtectedRoute>} />
        <Route path="/qr" element={<ProtectedRoute><QRPage /></ProtectedRoute>} />
        <Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
        <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/manager" element={<ProtectedRoute><Manager /></ProtectedRoute>} />
        <Route path="/admin/announcements" element={<ProtectedRoute><AnnouncementManager /></ProtectedRoute>} />
        
        {/* Обработка всех остальных маршрутов */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Global overlays */}
      <Toast />
      <Confirm />
    </Router>
  );
}

export default App;
