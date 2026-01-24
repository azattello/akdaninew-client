import React, { useEffect, useState } from "react";
import './css/admin.css';
import { addFilial, getFilials, deleteFilial } from '../../action/filial';
import axios from 'axios';
import config from '../../config';
import { showToast } from '../Toast';
import { openConfirm } from '../Confirm';

const FilialList = () => {
    const [filialText, setFilialText] = useState('');
    const [filialId, setFilialId] = useState('');
    const [filialAddress, setFilialAddress] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [filials, setFilials] = useState([]);
    const [editMode, setEditMode] = useState(false); // Для редактирования филиала
    const [editingFilialId, setEditingFilialId] = useState(null); // ID редактируемого филиала

    useEffect(() => {
        fetchFilials();
    }, []);

    const fetchFilials = async () => {
        const allFilials = await getFilials();
        setFilials(allFilials);
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
  
      try {
          if (editMode) {
              // Обновление филиала
              
              await axios.put(`${config.apiUrl}/api/filial/updateFilial/${editingFilialId}`, {
                  filialText,
                  userPhone,
                  filialId,
                  filialAddress
              });
              alert('Филиал успешно обновлен');
          } else {
              // Добавление нового филиала
              await addFilial(filialId, filialText, userPhone, filialAddress);
              alert('Новый филиал успешно добавлен');
          }
  
          // Очищаем поля и обновляем список филиалов
          setFilialText('');
          setUserPhone('');
          setFilialId('');
          setFilialAddress('');
          setEditMode(false);
          setEditingFilialId(null);
          fetchFilials();
      } catch (error) {
          console.error('Ошибка при добавлении/редактировании филиала:', error);
          // Вывод сообщения об ошибке через alert
          if (error.response && error.response.data && error.response.data.message) {
              alert(`Ошибка: ${error.response.data.message}`);
          } else {
              alert('Произошла ошибка при добавлении/редактировании филиала');
          }
      }
  };

    const handleEdit = (filial) => {
        setFilialText(filial.filial.filialText);
        setUserPhone(filial.filial.userPhone);
        setFilialId(filial.filial.filialId);
        setFilialAddress(filial.filial.filialAddress);
        setEditingFilialId(filial.filial._id);
        setEditMode(true);
    };

    const handleDelete = async (filialId) => {
      const isConfirmed = await openConfirm('Вы уверены, что хотите удалить этот филиал?');
      if (!isConfirmed) return;
  
      try {
          await deleteFilial(filialId);
          showToast('Филиал успешно удален', 'success');
          fetchFilials();
      } catch (error) {
          console.error('Ошибка при удалении филиала:', error);
          // Вывод сообщения об ошибке через toast
          if (error.response && error.response.data && error.response.data.message) {
              showToast(`Ошибка: ${error.response.data.message}`, 'error');
          } else {
              showToast('Произошла ошибка при удалении филиала', 'error');
          }
      }
  };
  

    return (
        <div className="status-list">
            <h1 className="status-list-title">Филиалы</h1>

            <form className="form-filialAdd" onSubmit={handleSubmit}>
                <input 
                    className="input-filialAdd"
                    type="text"
                    value={filialText}
                    onChange={(e) => setFilialText(e.target.value)}
                    placeholder="Введите название филиала"
                />
                <input
                    className="input-filialAdd"
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="Введите номер телефона пользователя"
                />
                <input
                    className="input-filialAdd"
                    type="text"
                    value={filialId}
                    onChange={(e) => setFilialId(e.target.value)}
                    placeholder="Введите ID филиала"
                />
                <input
                    className="input-filialAdd"
                    type="text"
                    value={filialAddress}
                    onChange={(e) => setFilialAddress(e.target.value)}
                    placeholder="Введите адрес филиала"
                />
                <button className="filialAdd-button" type="submit">
                    {editMode ? 'Обновить филиал' : 'Добавить филиал'}
                </button>
            </form>

            <ul>
                {filials.map((filial) => (
                    <div className="filial-el" key={filial.filial._id}>
                        <p>Название филиала: {filial.filial.filialText} <br /> Номер телефона: {filial.filial.userPhone} <br /> Адрес филиала: {filial.filial.filialAddress} <br /> ID филиала: {filial.filial.filialId}</p>        
                        <div class="filial-buttons">
                          <button className="filial-button edit" onClick={() => handleEdit(filial)}>Редактировать</button>
                          <button className="filial-button delete" onClick={() => handleDelete(filial.filial._id)}>Удалить</button>
                        </div>
                    </div>
                ))}
            </ul>
        </div>
    );
};

export default FilialList;
