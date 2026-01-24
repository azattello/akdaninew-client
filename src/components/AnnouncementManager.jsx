import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../action/announcement';
import { showToast } from './Toast';
import '../components/styles/announcement.css';
import './dashboard/css/admin.css';

const AnnouncementManager = () => {
  const dispatch = useDispatch();
  const { announcements, loading } = useSelector(state => state.announcements);
  const currentUser = useSelector(state => state.user.currentUser);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image: ''
  });

  useEffect(() => {
    dispatch(fetchAnnouncements());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      showToast('Заполните обязательные поля', 'error');
      return;
    }

    try {
      if (editingId) {
        await dispatch(updateAnnouncement(editingId, formData));
        showToast('Объявление обновлено', 'success');
      } else {
        await dispatch(createAnnouncement(formData));
        showToast('Объявление создано и отправлено всем пользователям', 'success');
      }
      
      setFormData({
        title: '',
        message: '',
        image: ''
      });
      setEditingId(null);
      setShowForm(false);
      dispatch(fetchAnnouncements());
    } catch (error) {
      showToast('Ошибка при сохранении объявления', 'error');
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      message: announcement.message,
      image: announcement.image || ''
    });
    setEditingId(announcement._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены?')) {
      try {
        await dispatch(deleteAnnouncement(id));
        showToast('Объявление удалено', 'success');
      } catch (error) {
        showToast('Ошибка при удалении объявления', 'error');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      message: '',
      image: ''
    });
  };

  if (currentUser?.role !== 'admin') {
    return <div className="announcement-manager"><p>Доступ запрещен</p></div>;
  }

  return (
    <div className="mainAdmin">
      <div className="announcement-manager" style={{ width: '100%', maxWidth: '100%' }}>
      <div className="announcements-header">
        <h1>Управление объявлениями</h1>
        <button className="btn-create" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Закрыть форму' : '+ Новое объявление'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="announcement-form">
          <div className="form-group">
            <label htmlFor="title">Заголовок *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Введите заголовок"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Сообщение *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Введите сообщение"
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">URL изображения</label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save">
              {editingId ? '💾 Обновить' : '💾 Создать'}
            </button>
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="announcements-list">
        <h2>Объявления ({announcements.length})</h2>
        {loading ? (
          <p>Загрузка...</p>
        ) : announcements.length === 0 ? (
          <p>Объявлений нет</p>
        ) : (
          <div className="announcements-grid">
            {announcements.map(announcement => (
              <div key={announcement._id} className={`announcement-card priority-${announcement.priority}`}>
                {announcement.image && (
                  <div className="announcement-image">
                    <img src={announcement.image} alt={announcement.title} />
                  </div>
                )}
                <div className="announcement-content">
                  <h3>{announcement.title}</h3>
                  <p className="message">{announcement.message}</p>
                  {announcement.description && (
                    <p className="description">{announcement.description}</p>
                  )}
                  <div className="announcement-meta">
                    <span className={`priority priority-${announcement.priority}`}>
                      {announcement.priority === 'high' && '🔴'}
                      {announcement.priority === 'medium' && '🟡'}
                      {announcement.priority === 'low' && '🟢'}
                    </span>
                    <span className="date">{new Date(announcement.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
                <div className="announcement-actions">
                  <button className="btn-edit" onClick={() => handleEdit(announcement)}>
                    ✏️
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(announcement._id)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default AnnouncementManager;
