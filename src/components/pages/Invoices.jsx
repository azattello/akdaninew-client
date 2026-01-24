import React, { useEffect, useState } from 'react';
import BasePage from './BasePage';
import axios from 'axios';
import config from '../../config';

export default function Invoices() {
  const [invoices, setInvoices] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${config.apiUrl}/api/auth/invoices`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setInvoices(res.data.invoices || []);
      } catch (err) {
        if (err.response && err.response.status === 204) setInvoices([]);
        else console.error('Ошибка при получении счетов:', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <BasePage title="Счета">
      <div className="page-card">
        <h3>Счета</h3>
        {loading && <p>Загрузка...</p>}
        {!loading && (invoices && invoices.length ? (
          <div>
            {invoices.map((inv, i) => (
              <div key={i} className={`invoice-entry ${inv.status === 'paid' ? 'paid' : 'pending'}`} style={{ padding: 8, marginBottom: 8 }}>
                <p>{new Date(inv.date).toLocaleDateString()} - {inv.itemCount} шт, {inv.totalWeight} кг, {inv.totalAmount} тг</p>
                <p>Статус: {inv.status}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Счета отсутствуют</p>
        ))}
      </div>
    </BasePage>
  );
}
