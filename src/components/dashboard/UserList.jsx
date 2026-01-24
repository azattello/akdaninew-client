import React, { useEffect, useState } from "react";
import './css/admin.css';
import search from "../../assets/img/search.png";
import axios from 'axios';
import config from "../../config";
import { getFilials, getFilialByUserPhone  } from "../../action/filial";
import { useSelector } from 'react-redux';
import QRScanner from "./QRScanner";
import UserCard from './UserCard';
import {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markInvoiceAsPaid
} from '../../action/invoice';
import { showToast } from '../Toast';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(100);
  const [sortByDate, setSortByDate] = useState('latest'); // Изначально сортируем по последнему добавленному
  const [searchTerm, setSearchTerm] = useState('');
  const [sortByActivity, setSortByActivity] = useState(false);
  const [showByFilialSort, setShowByFilialSort] = useState(false); // Состояние для отображения выпадающего меню для фильтра по филиалу
  const [filials, setFilials] = useState([]); // Список филиалов
  const [sortByFilial, setSortByFilial] = useState(''); // Новый фильтр по филиалу
  
  const [selectedFilial, setSelectedFilial] = useState(''); // Новый фильтр по филиалу
  
  const [totalUsers, setTotalUsers] = useState(0);
  
  const [sortByRole, setSortByRole] = useState('');
  const [showByRoleSort, setShowByRoleSort] = useState(false); // Для управления видимостью всплывающего окна

  // Состояния для модального окна и редактируемого пользователя
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [personalRate, setPersonalRate] = useState('');


  // Состояния для модального окна сброса пароля
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  // invoice:
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceUser, setInvoiceUser] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    itemCount: '',
    totalWeight: '',
    totalAmount: '',
    date: ''
  });
  const [invoiceError, setInvoiceError] = useState('');
  const [invoiceSuccess, setInvoiceSuccess] = useState('');

  const [editInvoiceId, setEditInvoiceId] = useState(null);
  const [editForm, setEditForm] = useState({ itemCount: '', totalWeight: '', totalAmount: '', date: '' });
  
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const role = useSelector(state => state.user.currentUser.role);
  const userPhone = useSelector(state => state.user.currentUser.phone);
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedId, setScannedId] = useState("");
  
  console.log(role)

  // Профиль модалки (детальный) и фокус-карточка
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // При загрузке: если есть focusUserId — подгружаем конкретного пользователя (QR -> админ)
  useEffect(() => {
    const focusId = sessionStorage.getItem('focusUserId') || sessionStorage.getItem('focusUser');
    const focusData = sessionStorage.getItem('focusUserData');

    if (focusId || focusData) {
      (async () => {
        try {
          // если есть сохранённые данные — используем их, чтобы избежать повторных запросов
          if (focusData) {
            const parsed = JSON.parse(focusData);
            if (parsed && (parsed.user || parsed.tracksByStatus)) {
              setProfileData(parsed);
              setShowProfileCard(true);
              return;
            }
          }

          // если это id — используем прямой fullProfile
          if (focusId && /^[0-9a-fA-F]{24}$/.test(String(focusId))) {
            openUserDetails(focusId, { inline: true });
          } else if (focusId) {
            // fallback — попробуем найти по personalId через admin endpoint
            const res = await axios.get(`${config.apiUrl}/api/user/byPersonalId/admin/${encodeURIComponent(focusId)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }});
            if (res.data && res.data.user) {
              const userId = res.data.user._id || res.data.user.id;
              if (userId) openUserDetails(userId, { inline: true });
            }
          }
        } catch (err) {
          console.error('Ошибка при поиске фокусного пользователя:', err.message);
        } finally {
          sessionStorage.removeItem('focusUserId');
          sessionStorage.removeItem('focusUser');
          sessionStorage.removeItem('focusUserData');
        }
      })();
    }

    const fetchFilialData = async () => {
      try {
        const data = await getFilialByUserPhone(userPhone);
        console.log(data.filialText); // Исправлено здесь
        setSortByFilial(data.filialText)

      } catch (error) {
        console.error('Ошибка при загрузке данных о филиале:', error);
      }
    };
  
    if (role === "filial") {
      fetchFilialData();
    }
  }, [userPhone,role]);

  // Открыть детальный профиль пользователя (админский view)
  const openUserDetails = async (userId, opts = {}) => {
    try {
      setProfileLoading(true);
      const resp = await axios.get(`${config.apiUrl}/api/user/${encodeURIComponent(userId)}/fullProfile`);
      setProfileData(resp.data);
      if (opts.inline) {
        setShowProfileCard(true);
      } else {
        setShowProfileModal(true);
      }
    } catch (err) {
      console.error('Ошибка при загрузке полного профиля:', err?.response?.data || err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setProfileData(null);
  };

  const closeProfileCard = () => {
    setShowProfileCard(false);
    setProfileData(null);
  };



  useEffect(() => {
    // Загружаем список филиалов при загрузке компонента
    const fetchFilials = async () => {
      const allFilials = await getFilials();
      setFilials(allFilials);
    };
    fetchFilials();
  }, []);

  const handleScan = (phoneNumber) => {
    setScannedId(phoneNumber);
    setIsScannerOpen(false);

    // Ищем пользователя по номеру телефона из QR кода
    (async () => {
      try {
        const res = await axios.get(`${config.apiUrl}/api/user/search?phone=${encodeURIComponent(phoneNumber)}`, { 
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
        });
        if (res.data && res.data.user) {
          const uid = res.data.user._id || res.data.user.id;
          openUserDetails(uid, { inline: true });
          showToast(`Найден пользователь: ${res.data.user.name} ${res.data.user.surname}`, 'success');
          return;
        }
        showToast(`Пользователь с номером ${phoneNumber} не найден`, 'error');
      } catch (err) {
        console.error('Ошибка при поиске пользователя через скан:', err?.response?.data || err.message);
        showToast(`Пользователь с номером ${phoneNumber} не найден`, 'error');
      }
    })();
  };


  // Функция для установки нового значения currentPage
  const setPage = (newPage) => {
    setCurrentPage(newPage <= 0 ? 1 : newPage);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/api/user/users`, {
          params: {
            page: currentPage,
            limit: perPage,
            search: searchTerm,
            sortByDate: sortByDate,
            sortByActivity: sortByActivity,
            filterByRole : sortByRole,
            filterByFilial: sortByFilial, // Фильтрация по филиалу
          }
        });

        setUsers(response.data.users);
        setTotalUsers(response.data.totalCount); // Обновление общего количества пользователей
      } catch (error) {
        console.error('Ошибка при получении пользователей:', error.message);
      }
    };

    fetchUsers();
  }, [currentPage, perPage, sortByDate, searchTerm, sortByActivity, sortByRole, sortByFilial]);

  const handleSortByFilial = (filial) => {
    setSortByFilial(filial);
    setShowByFilialSort(false);
    setCurrentPage(1);
  };

  const handlePageChange = (e) => {
    setCurrentPage(parseInt(e.target.value, 10));
  };

  const handlePerPageChange = (e) => {
    setPerPage(parseInt(e.target.value, 10));
  };

  const handlePageChangePlus = () => {
    setPage(currentPage + 1);
  };

  const handlePageChangeMinus = () => {
    setPage(currentPage - 1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Обновляем поисковый запрос при изменении текста в поле поиска
    setPage(1);
  };

  const handleSortByDate = (type) => {
    setSortByDate(type);
    setSortByActivity(false);
    setCurrentPage(1); // При изменении типа сортировки сбрасываем страницу на первую
  };

  const handleSortByActivity = () => {
    setSortByActivity(!sortByActivity);
    setSortByDate('');
    setCurrentPage(1);
  };

  const toggleRoleSort = () => {
    setShowByRoleSort(!showByRoleSort);
  };


  const handleSortByRole = (role) => {
    setSortByRole(role);
    setShowByRoleSort(false);
    setCurrentPage(1);
  };




  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser(null);
  };

  const handleSaveChanges = async () => {
    try {
      await axios.post(`${config.apiUrl}/api/user/${currentUser._id}/updatePersonalRate`, {
        personalRate,
      });

      
      

      alert('Изменения успешно сохранены');
      setIsModalOpen(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('Ошибка при сохранении изменений:', error.message);
      alert('Ошибка при сохранении изменений');
    }
  };

  // Открытие модального окна для сброса пароля
  const openResetModal = (userId) => {
    setSelectedUserId(userId);
    setNewPassword('');
    setModalError('');
    setModalSuccess('');
    setShowResetModal(true);
  };

  // Закрытие модального окна
  const closeResetModal = () => {
    setShowResetModal(false);
  };

  // Обработка изменения нового пароля
  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  // Функция сброса пароля
  const handleResetPassword = async () => {
    if (newPassword && (newPassword.length < 4 || newPassword.length > 20)) {
      setModalError("Пароль должен содержать от 4 до 20 символов");
      return;
    }

    try {
      await axios.put(`${config.apiUrl}/api/user/update/${selectedUserId}`, {
        newPassword,
        filial: selectedFilial,
      });

      setModalSuccess("Данные успешно обновлены");
      // setTimeout(() => {
      //   showResetModal()
      // }, 1500);
    } catch (error) {
      console.error("Ошибка при обновлении:", error);
      setModalError("Ошибка при обновлении данных");
    }
  };


  // Открытие модалки счёта
const openInvoiceModal = (user) => {
  setInvoiceUser(user);
  setInvoiceForm({ itemCount: '', totalWeight: '', totalAmount: '', date: '' });
  setInvoiceError('');
  setInvoiceSuccess('');
  setShowInvoiceModal(true);
};

// Обработка изменения формы счёта
const handleInvoiceChange = (e) => {
  const { name, value } = e.target;
  setInvoiceForm(prev => ({ ...prev, [name]: value }));
};

// Отправка нового счёта
const submitInvoice = async () => {
  const { itemCount, totalWeight, totalAmount, date } = invoiceForm;
  if (!itemCount || !totalWeight || !totalAmount || !date) {
    setInvoiceError('Заполните все поля');
    return;
  }

  try {
    const data = await createInvoice(invoiceUser._id, invoiceForm); // используем API функцию
    setInvoiceSuccess('Счёт успешно создан');
    setTimeout(() => setInvoiceSuccess(''), 3000);

    setInvoiceForm({ itemCount: '', totalWeight: '', totalAmount: '', date: '' });

    // Обновление состояния пользователя (обновлённый invoiceUser)
    const updatedUser = { ...invoiceUser };
    const newInvoice = {
      ...invoiceForm,
      _id: data.invoice._id,
      status: 'pending',
      date: invoiceForm.date
    };

    updatedUser.invoices = Array.isArray(updatedUser.invoices)
      ? [newInvoice, ...updatedUser.invoices]
      : [newInvoice];

    setInvoiceUser(updatedUser);
  } catch (error) {
    console.error(error);
    setInvoiceError('Ошибка при создании счёта');
  }
};


const markAsPaidHandler = async (invoiceId) => {
  try {
    await markInvoiceAsPaid(invoiceUser._id, invoiceId);
    const updatedUser = { ...invoiceUser };
    updatedUser.invoices = updatedUser.invoices.map(inv =>
      inv._id === invoiceId ? { ...inv, status: 'paid' } : inv
    );
    setInvoiceUser(updatedUser);
  } catch (error) {
    console.error(error);
    alert('Ошибка при оплате счёта');
  }
};

const deleteInvoiceHandler = async (invoiceId) => {
  try {
    await deleteInvoice(invoiceUser._id, invoiceId);
    const updatedUser = { ...invoiceUser };
    updatedUser.invoices = updatedUser.invoices.filter(inv => inv._id !== invoiceId);
    setInvoiceUser(updatedUser);
  } catch (error) {
    console.error(error);
    alert('Ошибка при удалении счёта');
  }
};

const startEditInvoice = (invoice) => {
  setEditInvoiceId(invoice._id);
  setEditForm({
    itemCount: invoice.itemCount,
    totalWeight: invoice.totalWeight,
    totalAmount: invoice.totalAmount,
    date: invoice.date.slice(0, 10)
  });
};

const saveEditedInvoice = async () => {
  try {
    const updated = await updateInvoice(invoiceUser._id, editInvoiceId, editForm);
    const updatedUser = { ...invoiceUser };
    updatedUser.invoices = updatedUser.invoices.map(inv =>
      inv._id === editInvoiceId ? updated.invoice : inv
    );
    setInvoiceUser(updatedUser);
    setEditInvoiceId(null);
  } catch (error) {
    console.error(error);
    alert('Ошибка при редактировании счёта');
  }
};

const cancelEdit = () => {
  setEditInvoiceId(null);
};

  return (
    <div className="users-container">
      <div className="header-bar">
        <div className="search-bar">
          <img src={search} alt="" className="searchIcon" />
          <input
            type="text"
            className="searchInput"
            placeholder="Поиск..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {role === 'admin' ? (
          <button
            onClick={() => setIsScannerOpen(true)}
            style={{
              padding: "8px 12px",
              marginBottom: "12px",
              backgroundColor: "#1f800c",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Сканировать QR
          </button>
        ) : (
          <div style={{ color: '#666', fontSize: 13, padding: '8px 12px' }}>Сканирование QR доступно только администраторам</div>
        )}

        {isScannerOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              maxWidth: "500px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <h3>Сканирование QR-кода</h3>
            <QRScanner onScan={handleScan} />
            <button
              onClick={() => setIsScannerOpen(false)}
              style={{
                marginTop: "12px",
                padding: "6px 12px",
                backgroundColor: "red",
                color: "white",
                border: "none",
                borderRadius: "6px",
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {scannedId && (
        <p style={{ marginTop: "12px" }}>
          Последний отсканированный ID: <b>{scannedId}</b>
        </p>
      )}

        <div className="filter-bar">
          <div
            className={`filter-point ${sortByDate === 'latest' ? 'filter-point-active' : ''}`}
            onClick={() => handleSortByDate('latest')}
          >
            Свежие по дате
          </div>
          <div
            className={`filter-point ${sortByDate === 'oldest' ? 'filter-point-active' : ''}`}
            onClick={() => handleSortByDate('oldest')}
          >
            Старые по дате
          </div>
          <div
            className={`filter-point ${sortByActivity ? 'filter-point-active' : ''}`}
            onClick={handleSortByActivity}
          >
            Сортировка по активности
          </div>


         

          <div className="status-filter">
                <div className="filter-point" onClick={toggleRoleSort}>
                        {sortByRole || 'Роль'} ↓
                    </div>
                    {showByRoleSort && (
                        <div className="statuses-popup">                                   
                        <div className="filter-point-status" onClick={() => handleSortByRole('')}>
                                Все
                            </div>
                            <div className="filter-point-status" onClick={() => handleSortByRole('client')}>
                            client
                            </div>
                            <div className="filter-point-status" onClick={() => handleSortByRole('filial')}>
                              filial
                            </div>
                            <div className="filter-point-status" onClick={() => handleSortByRole('admin')}>
                              admin
                            </div>

                        </div>
                    )}
            </div>

            {role === 'admin' && (
            <>
              <div className="status-filter">
                <div className="filter-point" onClick={() => setShowByFilialSort(!showByFilialSort)}>
                  {sortByFilial || 'По филиалам'} ↓
                </div>
                {showByFilialSort && (
                  <div className="statuses-popup">
                    <div className="filter-point-status" onClick={() => handleSortByFilial('')}>
                      Все филиалы
                    </div>
                    {filials.map(filial => (
                      <div
                        key={filial.filial._id}
                        className="filter-point-status"
                        onClick={() => handleSortByFilial(filial.filial.filialText)}
                      >
                        {filial.filial.filialText}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

        </div>


        
      </div>

      {/* Если есть focus-карта — показываем её */}
      {showProfileCard && profileData && (
        <UserCard profileData={profileData} onClose={closeProfileCard} />
      )}

      <p className='totalCount'>Найдено: {totalUsers}</p>


      <div className="table-user">
        <table className="table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Номер</th>
              <th>Дата регистрации</th>
              <th>Общее кол-во</th>
              <th>Роль</th>
              <th>Счета</th>
              <th>Действия</th>

            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={index}>
                <td><button className="link-like" onClick={() => openUserDetails(user._id)}>{user.name}</button></td>
                <td>{user.surname}</td>
                <td>{user.phone}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>{user.bookmarkCount + user.archiveCount}</td>
                <td>{user.role}</td>
                <td>
                  <button className="invoice-button" onClick={() => openInvoiceModal(user)}>Счета</button>
                </td>
                <td>
                  <button className="sbros-button"  onClick={() => openResetModal(user._id)}>Изменить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

            {/* Модальное окно для редактирования пользователя */}
            {isModalOpen && (
            <div className="modal">
              <div className="modal-content">
                <h2>Редактирование пользователя</h2>
                <div className="modal-fields">
                  <div className="modal-field">
                    <label>Имя:</label>
                    <span>{currentUser.name}</span>
                  </div>
                  <div className="modal-field">
                    <label>Фамилия:</label>
                    <span>{currentUser.surname}</span>
                  </div>
                  <div className="modal-field">
                    <label>Номер:</label>
                    <span>{currentUser.phone}</span>
                  </div>
                  <div className="modal-field">
                    <label>Личный тариф пользователя:</label>
                    <input
                      type="text"
                      value={personalRate}
                      onChange={(e) => setPersonalRate(e.target.value)}
                    />
                   <p>{currentUser.personalRate ? currentUser.personalRate : ""}</p>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button className="btn save-btn" onClick={handleSaveChanges}>
                    Сохранить изменения
                  </button>
                  <button className="btn cancel-btn" onClick={handleCloseModal}>
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}




        <div className="page-point-bar">
          <div className="page-point" onClick={handlePageChangeMinus}>
            Предыдущая страница
          </div>
          <div className="page-point">
            <label htmlFor="page">Номер страницы: </label>
            <input type="number" id="page" value={currentPage} onChange={handlePageChange} />
          </div>
          <div className="page-point">
            <label htmlFor="perPage">Кол-во: </label>
            <input type="number" id="perPage" value={perPage} onChange={handlePerPageChange} />
          </div>
          <div className="page-point" onClick={handlePageChangePlus}>
            Следующая страница
          </div>
        </div>


          {/* Модальное окно для сброса пароля */}
      {showResetModal && (
        <div className="modal-overlay2">
          <div className="modal2">
            <h3>Сброс пароля</h3>
            <input
              type="password"
              placeholder="Введите новый пароль"
              value={newPassword}
              onChange={handleNewPasswordChange}
            />
            {modalError && <p className="error2">{modalError}</p>}
            {modalSuccess && <p className="success2">{modalSuccess}</p>}

            {/* Выбор филиала */}
            <label className="block mb-2">Выберите филиал:</label>
            <select
              className="w-full p-2 border rounded mb-4"
              value={selectedFilial}
              onChange={(e) => setSelectedFilial(e.target.value)}
            >
              <option value="">Не выбрано</option> {/* Новый вариант по умолчанию */}
              {filials.map((filial) => (
                <option key={filial.filial._id} value={filial.filial._id}>
                  {filial.filial.filialText}
                </option>
              ))}
            </select>

            
            <div className="modal-buttons2">
              <button onClick={handleResetPassword}>Сохранить</button>
              <button onClick={closeResetModal}>Отмена</button>
            </div>

            <hr />
            <button className="btn-red" onClick={() => setShowConfirmDelete(true)}>Удалить профиль</button>

            {showConfirmDelete && (
              <div className="confirm-delete">
                <p>Вы уверены, что хотите удалить пользователя?</p>
                <button className="btn-red" onClick={async () => {
                  try {
                    await axios.delete(`${config.apiUrl}/api/user/delete/${selectedUserId}`);
                    alert('Пользователь удалён');
                    setShowResetModal(false);
                    setShowConfirmDelete(false);
                    // Обнови список пользователей
                    setUsers(prev => prev.filter(u => u._id !== selectedUserId));
                  } catch (err) {
                    alert('Ошибка при удалении пользователя');
                    console.error(err);
                  }
                }}>Да, удалить</button>
                <button className="btn-cancel" onClick={() => setShowConfirmDelete(false)}>Отмена</button>
              </div>
            )}

          </div>
        </div>
      )}

      {showInvoiceModal && (
        <div className="modal-overlay3">
          <div className="modal3">
            <div className="modal3-header">
            <h3>Добавить счёт для {invoiceUser.name}</h3>
            <p className="close" onClick={() => setShowInvoiceModal(false)}></p>
            </div>
            <input type="number" name="itemCount" placeholder="Кол-во товаров" value={invoiceForm.itemCount} onChange={handleInvoiceChange} />
            <input type="number" name="totalWeight" placeholder="Общий вес" value={invoiceForm.totalWeight} onChange={handleInvoiceChange} />
            <input type="number" name="totalAmount" placeholder="Общая сумма" value={invoiceForm.totalAmount} onChange={handleInvoiceChange} />
            <input type="date" name="date" value={invoiceForm.date} onChange={handleInvoiceChange} />

            {invoiceError && <p className="error">{invoiceError}</p>}
            {invoiceSuccess && <p className="success">{invoiceSuccess}</p>}

            <button className="btn-green" onClick={submitInvoice}>Отправить счёт</button>
            
            <hr />
            <h4>
            <br />
            История счетов
            <br />
            </h4>
            {invoiceUser.invoices && invoiceUser.invoices.map((inv, i) => (
              <div key={i} className={`invoice-entry ${inv.status === 'paid' ? 'paid' : 'pending'}`}>
                {editInvoiceId === inv._id ? (
                  <>
                    <input type="number" name="itemCount" value={editForm.itemCount} onChange={e => setEditForm({ ...editForm, itemCount: e.target.value })} />
                    <input type="number" name="totalWeight" value={editForm.totalWeight} onChange={e => setEditForm({ ...editForm, totalWeight: e.target.value })} />
                    <input type="number" name="totalAmount" value={editForm.totalAmount} onChange={e => setEditForm({ ...editForm, totalAmount: e.target.value })} />
                    <input type="date" name="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
                    <button className="btn-green" onClick={saveEditedInvoice}>Сохранить</button>
                    <button className="btn-red" onClick={cancelEdit}>Отмена</button>
                  </>
                ) : (
                  <>
                    <p>{formatDate(inv.date)} - {inv.itemCount} шт, {inv.totalWeight} кг, {inv.totalAmount} тг</p>
                    <p>Статус: {inv.status === 'paid' ? 'Оплачено' : 'Не оплачено'}</p>
                    {inv.status === 'pending' && (
                      <>
                        <button  className="btn-green" onClick={() => markAsPaidHandler(inv._id)}>Подтвердить</button>
                        <button  className="btn-blue" onClick={() => startEditInvoice(inv)}>Изменить</button>
                      </>
                    )}
                    <button className="btn-red" onClick={() => deleteInvoiceHandler(inv._id)}>Удалить</button>
                  </>
                )}
              </div>
            ))}

          </div>
        </div>
      )}

      {/* Детальный профиль пользователя (открывается админом через QR или кликом) */}
      {showProfileModal && (
        <div className="modal-overlay2">
          <div className="modal-profile">
            <div className="modal-profile-header">
              <h3>Профиль: {profileData?.user?.name} {profileData?.user?.surname}</h3>
              <button className="close" onClick={closeProfileModal}>Закрыть</button>
            </div>

            {profileLoading ? (
              <p>Загрузка...</p>
            ) : (
              <div className="profile-grid">
                <div className="profile-col">
                  <h4>Информация</h4>
                  <p><strong>PersonalId:</strong> {profileData?.user?.personalId}</p>
                  <p><strong>Телефон:</strong> {profileData?.user?.phone}</p>
                  <p><strong>Филиал:</strong> {profileData?.user?.selectedFilial}</p>
                  <p><strong>Роль:</strong> {profileData?.user?.role}</p>
                  <p><strong>Дата регистрации:</strong> {formatDate(profileData?.user?.createdAt)}</p>
                </div>

                <div className="profile-col">
                  <h4>Счета</h4>
                  {profileData?.invoices && profileData.invoices.length ? (
                    profileData.invoices.map((inv, i) => (
                      <div key={i} className={`invoice-entry ${inv.status === 'paid' ? 'paid' : 'pending'}`}>
                        <p>{formatDate(inv.date)} - {inv.itemCount} шт, {inv.totalWeight} кг, {inv.totalAmount} тг</p>
                        <p>Статус: {inv.status}</p>
                      </div>
                    ))
                  ) : (
                    <p>Счета отсутствуют</p>
                  )}
                </div>

                <div className="profile-col">
                  <h4>Треки (по статусам)</h4>
                  {profileData?.tracksByStatus && Object.keys(profileData.tracksByStatus).length ? (
                    Object.entries(profileData.tracksByStatus).map(([status, tracks]) => (
                      <div key={status} className="status-group">
                        <h5>{status} ({tracks.length})</h5>
                        {tracks.map((t, idx) => (
                          <div key={idx} className="track-entry">
                            <p><strong>{t.track}</strong> {t.notFound && <em>(Добавлен вручную)</em>}</p>
                            {!t.notFound && t.status && <p>Текущий статус: {t.status.statusText}</p>}
                            {t.history && t.history.length ? (
                              <details>
                                <summary>История ({t.history.length})</summary>
                                <ul>
                                  {t.history.map((h, j) => (
                                    <li key={j}>{new Date(h.date).toLocaleString()} - {h.statusText || (h.status && h.status.statusText) || h.description || ''}</li>
                                  ))}
                                </ul>
                              </details>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <p>Треки отсутствуют</p>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default UserList;
