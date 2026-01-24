import React, { useEffect, useState } from 'react';
import BasePage from './BasePage';
import axios from 'axios';
import config from '../../config';
import '../styles/pages.css';

export default function Warehouse() {
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${config.apiUrl}/api/settings/getSettings`);
        setWarehouseAddress(res.data.warehouseAddress || res.data.chinaAddress || '');
      } catch (err) {
        console.error('Ошибка при получении настроек:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(warehouseAddress || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Адрес склада AK-DANI-CARGO',
        text: warehouseAddress,
      });
    }
  };

  return (
    <BasePage title="Склад">
      <div className="warehouse-container">
        {loading ? (
          <div className="loading">Загрузка информации о складе...</div>
        ) : (
          <>
            <div className="warehouse-header">
              <h1>Наш склад в Китае</h1>
              <p>Отправьте посылку на этот адрес для дальнейшей доставки в Казахстан</p>
            </div>

            <div className="warehouse-info">
              <div className="warehouse-card">
                <div className="warehouse-icon">🏭</div>
                <h3>Адрес склада</h3>
                <div className="address-box">
                  <p className="address-text">{warehouseAddress || 'Адрес не задан'}</p>
                  <div className="address-actions">
                    <button 
                      className="btn-copy"
                      onClick={handleCopy}
                    >
                      {copied ? '✓ Скопировано' : '📋 Скопировать'}
                    </button>
                    {navigator.share && (
                      <button 
                        className="btn-share"
                        onClick={handleShare}
                      >
                        🔗 Поделиться
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="warehouse-instructions">
              <h3>Как отправить посылку?</h3>
              <div className="steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Скопируйте адрес</h4>
                    <p>Нажмите кнопку "Скопировать" и скопируйте полный адрес нашего склада</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Оформите доставку</h4>
                    <p>Оформите доставку через местную логистическую компанию или доставку лично</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Получите трек-номер</h4>
                    <p>Отправьте нам номер отслеживания через чат с менеджером</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Отслеживайте груз</h4>
                    <p>Смотрите статус доставки в своем личном кабинете в разделе "Посылки"</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="warehouse-tips">
              <h3>💡 Полезные советы</h3>
              <ul>
                <li>✓ Убедитесь, что посылка хорошо упакована</li>
                <li>✓ Указывайте правильные размеры и вес</li>
                <li>✓ Проверьте список запрещенного содержимого</li>
                <li>✓ Сохраняйте чеки и документы доставки</li>
                <li>✓ Уведомляйте нас как можно раньше о отправке</li>
              </ul>
            </div>

            <div className="warehouse-contact">
              <p>Вопросы по адресу складу? Свяжитесь с нашей поддержкой через менеджера</p>
              <button className="btn-contact">💬 Написать менеджеру</button>
            </div>
          </>
        )}
      </div>
    </BasePage>
  );
}
