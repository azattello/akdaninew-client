import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import logo from "../assets/img/logo.jpg";
import config from "../config";
import "./styles/home.css";

const Home = () => {
  const isAuth = useSelector((state) => state.user.isAuth);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${config.apiUrl}/api/banner/getBanner`);
        if (res.data) {
          setBanner(res.data);
        }
      } catch (err) {
        console.error('Ошибка при получении баннера:', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="home-container">
      {!loading && banner && banner.imageUrl && (
        <div className="home-banner">
          <img src={banner.imageUrl} alt="Баннер" className="banner-image" />
          {banner.title && <h2 className="banner-title">{banner.title}</h2>}
          {banner.description && <p className="banner-description">{banner.description}</p>}
        </div>
      )}

      <div className="home-card">
        <img src={logo} className="home-logo" alt="Логотип" />
        <h1 className="home-title">{config.nameCargo}</h1>
        <p className="home-subtitle">
          Надёжный карго-сервис с отслеживанием и прозрачной логистикой
        </p>

        <div className="home-buttons">
          {!isAuth && (
            <>
              <Link to="/login" className="home-btn primary">
                Войти
              </Link>
              <Link to="/registration" className="home-btn secondary">
                Регистрация
              </Link>
            </>
          )}
          {isAuth && (
            <Link to="/main" className="home-btn primary">
              Перейти в систему
            </Link>
          )}
        </div>

        <div className="home-footer">
          <Link to="/public-offer" className="home-footer-link">
            Публичная оферта
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
