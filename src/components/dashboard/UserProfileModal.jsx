import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import './css/user-profile-modal.css';

export default function UserProfileModal({ profileData, loading: initialLoading, onClose }) {
  const [viewMode, setViewMode] = useState('info'); // 'info' или 'tracks'
  const [fullProfile, setFullProfile] = useState(profileData);
  const [loading, setLoading] = useState(initialLoading);
  const [showPassword, setShowPassword] = useState(false); // для показа/скрытия пароля

  // Загружаем полный профиль с треками
  useEffect(() => {
    const loadFullProfile = async () => {
      if (!profileData || !profileData.user || profileData.tracksByStatus) {
        setFullProfile(profileData);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${config.apiUrl}/api/user/${encodeURIComponent(profileData.user._id || profileData.user.id)}/fullProfile`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        setFullProfile(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке полного профиля:', error);
        setFullProfile(profileData);
      } finally {
        setLoading(false);
      }
    };

    loadFullProfile();
  }, [profileData]);

  if (!fullProfile || !fullProfile.user) {
    return null;
  }

  const user = fullProfile.user;
  const invoices = fullProfile.invoices || [];
  const tracksByStatus = fullProfile.tracksByStatus || {};
  
  // Подсчитаем общее количество треков
  const totalTracks = Object.values(tracksByStatus).reduce((sum, tracks) => sum + tracks.length, 0);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal-container">
        {/* Header */}
        <div className="profile-modal-header">
          <div className="header-content">
            <div className="avatar-section">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt="avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">{(user.name || '')[0]}</div>
              )}
            </div>
            <div className="header-info">
              <h2 className="user-full-name">{user.name} {user.surname}</h2>
              <p className="user-meta">
                {user.selectedFilial || 'Филиал не указан'} • 
                <span className="user-role">{user.role}</span>
              </p>
              <p className="user-phone">📞 {user.phone}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Main Content */}
        <div className="profile-modal-content">
          {loading ? (
            <div className="loading-state">Загрузка...</div>
          ) : (
            <>
              {viewMode === 'info' ? (
                // ===== ВКЛАДКА ИНФОРМАЦИИ =====
                <>
                  {/* Info Grid */}
                  <div className="info-section">
                    <h3>Информация</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">PersonalID</span>
                        <strong className="info-value">{user.personalId || '—'}</strong>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Дата регистрации</span>
                        <strong className="info-value">{formatDate(user.createdAt)}</strong>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Пароль</span>
                        <div className="password-field">
                          <span className="password-value">
                            {showPassword ? user.password : '•'.repeat(Math.min(user.password?.length || 0, 12))}
                          </span>
                          <button 
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                          >
                            {showPassword ? '👁️' : '🔒'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Invoices Section */}
                  <div className="invoices-section">
                    <h3>Счета</h3>
                    {invoices && invoices.length > 0 ? (
                      <div className="invoices-list">
                        {invoices.map((inv, i) => (
                          <div key={i} className={`invoice-item ${inv.status === 'paid' ? 'paid' : 'pending'}`}>
                            <div className="invoice-main">
                              <div className="invoice-date">{formatDate(inv.date)}</div>
                              <div className="invoice-details">
                                {inv.itemCount} шт • {inv.totalWeight} кг • {inv.totalAmount} тг
                              </div>
                            </div>
                            <div className={`invoice-status ${inv.status}`}>
                              {inv.status === 'paid' ? '✓ Оплачено' : '⏳ Ожидает'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-state">Счета отсутствуют</p>
                    )}
                  </div>

                  {/* Tracks Button */}
                  <div className="tracks-button-section">
                    <button 
                      className="view-tracks-btn"
                      onClick={() => setViewMode('tracks')}
                    >
                      📦 Треки ({totalTracks})
                    </button>
                  </div>
                </>
              ) : (
                // ===== ВКЛАДКА ТРЕКОВ =====
                <div className="tracks-detailed-view">
                  <div className="tracks-header">
                    <h2>Треки клиента</h2>
                    <p className="tracks-count-info">Всего треков: {totalTracks}</p>
                  </div>

                  {Object.keys(tracksByStatus).length > 0 ? (
                    <div className="tracks-detailed-list">
                      {Object.entries(tracksByStatus).map(([status, tracks]) => (
                        <div key={status} className="status-section">
                          <div className="status-title">
                            <h3>{status}</h3>
                            <span className="status-count">{tracks.length}</span>
                          </div>
                          <div className="status-tracks">
                            {tracks.map((t, idx) => (
                              <div key={idx} className="track-detail-card">
                                <div className="track-card-header">
                                  <div className="track-number-large">{t.track}</div>
                                  {t.notFound && <span className="track-badge">Вручную</span>}
                                </div>
                                <div className="track-card-body">
                                  {/* Текущий статус */}
                                  {t.status && !t.notFound && (
                                    <div className="track-field">
                                      <span className="field-label">Текущий статус:</span>
                                      <span className="field-value">{t.status.statusText || t.status._id}</span>
                                    </div>
                                  )}

                                  {/* История статусов */}
                                  {t.history && t.history.length > 0 && (
                                    <div className="track-history-section">
                                      <span className="field-label">История обновлений:</span>
                                      <div className="history-timeline">
                                        {t.history.map((entry, hIdx) => (
                                          <div key={hIdx} className="history-entry">
                                            <div className="history-date">
                                              {formatDate(entry.date)}
                                            </div>
                                            <div className="history-status">
                                              {entry.status?.statusText || entry.status?._id || 'Неизвестен'}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Информация о добавлении */}
                                  {t.createdAt && (
                                    <div className="track-field">
                                      <span className="field-label">Добавлена:</span>
                                      <span className="field-value">{formatDate(t.createdAt)}</span>
                                    </div>
                                  )}

                                  {/* Для вручную добавленных треков */}
                                  {t.notFound && (
                                    <div className="track-field">
                                      <span className="field-label">Тип:</span>
                                      <span className="field-value">Добавлен вручную</span>
                                    </div>
                                  )}

                                  {/* Описание если есть */}
                                  {t.description && (
                                    <div className="track-field">
                                      <span className="field-label">Описание:</span>
                                      <span className="field-value">{t.description}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">Треки отсутствуют</p>
                  )}

                  <button 
                    className="back-btn"
                    onClick={() => setViewMode('info')}
                  >
                    ← Вернуться к информации
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
