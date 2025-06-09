import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './SalesHistory.css';

const SalesHistory = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [filterYear, setFilterYear] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/sales/history')
      .then(res => {
        setHistory(res.data);
        setFilteredHistory(res.data);
      })
      .catch(err => console.error('Erreur chargement historique:', err));
  }, []);

  useEffect(() => {
    let filtered = history;

    if (filterYear) {
      filtered = filtered.filter(h => h.annee.toString() === filterYear);
    }

    if (filterCategory) {
      filtered = filtered.map(yearData => ({
        ...yearData,
        mois: yearData.mois.map(monthData => ({
          ...monthData,
          jours: monthData.jours.map(dayData => ({
            ...dayData,
            categories: dayData.categories.filter(cat => cat.categorie === filterCategory)
          })).filter(dayData => dayData.categories.length > 0)
        })).filter(monthData => monthData.jours.length > 0)
      })).filter(yearData => yearData.mois.length > 0);
    }

    setFilteredHistory(filtered);
  }, [filterYear, filterCategory, history]);

  const handleCategoryClick = async (categorie, annee, mois, jour) => {
    const formattedDate = `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
    const key = `${formattedDate}-${categorie}`;

    if (selectedDetails[key]) {
      setSelectedDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[key];
        return newDetails;
      });
      return;
    }

    try {
      setLoadingDetails(true);
      const res = await axios.get('http://localhost:5000/api/sales/category-details-simple', {
        params: { categorie, jour: formattedDate }
      });
      setSelectedDetails(prev => ({
        ...prev,
        [key]: res.data
      }));
    } catch (err) {
      console.error('Erreur chargement détails:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatPrice = (value) => {
    const num = Number(value);
    return isNaN(num) ? '0.00 DH' : num.toFixed(2) + ' DH';
  };

  const availableYears = Array.from(new Set(history.map(h => h.annee.toString())));
  const availableCategories = Array.from(new Set(
    history.flatMap(h =>
      h.mois.flatMap(m =>
        m.jours.flatMap(j =>
          j.categories.map(c => c.categorie)
        )
      )
    )
  ));

  return (
    <div className="sales-history-container">
      <h1 className="sales-history-title">Historique des ventes</h1>

      <div className="sales-history-filters">
        <select
          className="sales-history-filter-btn"
          value={filterYear}
          onChange={e => setFilterYear(e.target.value)}
          aria-label="Filtrer par année"
        >
          <option value=''>Toutes les années</option>
          {availableYears.map(annee => (
            <option key={annee} value={annee}>{annee}</option>
          ))}
        </select>

        <select
          className="sales-history-filter-btn"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          aria-label="Filtrer par catégorie"
        >
          <option value=''>Toutes les catégories</option>
          {availableCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {filteredHistory.length === 0 && (
        <p className="sales-history-message">Aucune donnée disponible pour ce filtre.</p>
      )}

      {filteredHistory.map(({ annee, mois }) => (
        <div key={annee} className="date-group">
          <h2>Année {annee}</h2>

          {mois.map(({ mois, jours }) => (
            <div key={mois} className="month-section">
              <h3>Mois {String(mois).padStart(2, '0')}</h3>

              <table className="sales-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Qté</th>
                    <th>Total</th>
                    <th>Catégories</th>
                  </tr>
                </thead>
                <tbody>
                  {jours.map(({ jour, categories, total_journalier, total_prix_journalier }) => (
                    <tr key={jour}>
                      <td>{String(jour).padStart(2, '0')}/{String(mois).padStart(2, '0')}/{annee}</td>
                      <td>{total_journalier}</td>
                      <td>{formatPrice(total_prix_journalier)}</td>
                      <td>
                        <ul style={{listStyleType: 'none', paddingLeft: 0, margin: 0}}>
                          {categories.map(({ categorie, quantite_totale, total_prix_par_categorie }) => {
                            const formattedDate = `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
                            const detailKey = `${formattedDate}-${categorie}`;
                            return (
                              <li
                                key={detailKey}
                                className="category-item"
                                style={{cursor: 'pointer', color: '#33691e', marginBottom: '6px'}}
                                onClick={() => handleCategoryClick(categorie, annee, mois, jour)}
                                title="Cliquez pour afficher les détails"
                              >
                                📦 <strong>{categorie}</strong> — Qté : {quantite_totale} — {formatPrice(total_prix_par_categorie)}

                                {selectedDetails[detailKey] && (
                                  <ul className="details" style={{marginTop: '5px', paddingLeft: '15px'}}>
                                    <li><em>Détails de la catégorie :</em></li>
                                    {selectedDetails[detailKey].map(prod => (
                                      <li key={prod.id}>
                                        {prod.nom} — Qté : {prod.quantite_totale} — Prix unitaire : {formatPrice(prod.prix_unitaire)} — Total : {formatPrice(prod.total_prix)}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}

      {loadingDetails && <p className="sales-history-message">Chargement des détails...</p>}
    </div>
  );
};

export default SalesHistory;
