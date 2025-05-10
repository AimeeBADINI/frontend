import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Importation de useNavigate
import './SalesHistory.css';

const SalesHistory = () => {
    const navigate = useNavigate(); // Initialisation de useNavigate
    const [salesData, setSalesData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

    const fetchSalesData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/ventes/par-jour-categorie', {
                params: {
                    start: dateRange.start,
                    end: dateRange.end
                }
            });
            console.log('Données reçues :', response.data); // Débogage
            setSalesData(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Erreur lors de la récupération des données de vente:', err);
            setError('Impossible de charger les données de vente');
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchSalesData();
    }, [fetchSalesData]);

    const toggleDetails = (date, categorie) => {
        setExpandedCategories(prev => ({
            ...prev,
            [`${date}-${categorie}`]: !prev[`${date}-${categorie}`]
        }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedSalesData = useCallback(() => {
        const sortableItems = Object.entries(salesData);
        if (sortConfig.key === 'date') {
            sortableItems.sort((a, b) => {
                const dateA = new Date(a[0]);
                const dateB = new Date(b[0]);
                if (sortConfig.direction === 'asc') {
                    return dateA - dateB;
                } else {
                    return dateB - dateA;
                }
            });
        }
        return Object.fromEntries(sortableItems);
    }, [salesData, sortConfig]);

    const calculateGrandTotal = () => {
        let totalQuantity = 0;
        let totalAmount = 0;
        
        Object.values(salesData).forEach(categories => {
            categories.forEach(category => {
                totalQuantity += Number(category.total_quantite);
                totalAmount += Number(category.total_montant);
            });
        });
        
        return { totalQuantity, totalAmount };
    };

    const grandTotal = calculateGrandTotal();

    if (loading) return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Chargement des données de vente...</p>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={fetchSalesData} className="retry-button">
                Réessayer
            </button>
        </div>
    );

    return (
        <div className="sales-report-container">
            <div className="report-header">
                <h2>Rapport des ventes par jour et catégorie</h2>
                <div className="date-range-selector">
                    <div className="date-input">
                        <label htmlFor="start">Du :</label>
                        <input
                            type="date"
                            id="start"
                            name="start"
                            value={dateRange.start}
                            onChange={handleDateChange}
                            max={dateRange.end}
                        />
                    </div>
                    <div className="date-input">
                        <label htmlFor="end">Au :</label>
                        <input
                            type="date"
                            id="end"
                            name="end"
                            value={dateRange.end}
                            onChange={handleDateChange}
                            min={dateRange.start}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <button onClick={fetchSalesData} className="refresh-button">
                        Actualiser
                    </button>
                </div>
            </div>

            {/* Bouton de retour vers Redirect */}
            <div className="back-button-container">
                <button onClick={() => navigate('/redirect')} className="back-button">
                    Retour
                </button>
            </div>

            {Object.keys(salesData).length === 0 ? (
                <div className="no-data">
                    <p>Aucune vente enregistrée pour cette période</p>
                </div>
            ) : (
                <>
                    <div className="grand-total">
                        <div className="total-card">
                            <h4>Total général</h4>
                            <div className="total-values">
                                <span>Quantité: <strong>{grandTotal.totalQuantity}</strong></span>
                                <span>Montant: <strong>{grandTotal.totalAmount.toFixed(2)} €</strong></span>
                            </div>
                        </div>
                    </div>

                    <div className="sales-report">
                        {Object.entries(sortedSalesData()).map(([date, categories]) => (
                            <div key={date} className="daily-report">
                                <div className="daily-header">
                                    <h3>{formatDate(date)}</h3>
                                    <span className="daily-total">
                                        Total journalier: {categories
                                            .reduce((sum, cat) => sum + Number(cat.total_montant), 0)
                                            .toFixed(2)} €
                                    </span>
                                </div>
                                <table className="sales-table">
                                    <thead>
                                        <tr>
                                            <th onClick={() => requestSort('categorie')}>
                                                Catégorie {sortConfig.key === 'categorie' && (
                                                    sortConfig.direction === 'asc' ? '↑' : '↓'
                                                )}
                                            </th>
                                            <th>Quantité vendue</th>
                                            <th>Montant total (€)</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.map((category, index) => (
                                            <React.Fragment key={index}>
                                                <tr>
                                                    <td>{category.categorie}</td>
                                                    <td>{category.total_quantite}</td>
                                                    <td>{Number(category.total_montant).toFixed(2)}</td>
                                                    <td>
                                                        <button
                                                            onClick={() => toggleDetails(date, category.categorie)}
                                                            className="details-button"
                                                            disabled={!category.details || category.details.length === 0}
                                                        >
                                                            {expandedCategories[`${date}-${category.categorie}`] 
                                                                ? 'Masquer' : 'Détails'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedCategories[`${date}-${category.categorie}`] && category.details && (
                                                    <tr className="details-row">
                                                        <td colSpan="4">
                                                            <div className="details-container">
                                                                <h4>Détails des ventes - {category.categorie}</h4>
                                                                {category.details.length > 0 ? (
                                                                    <table className="details-table">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Produit</th>
                                                                                <th>Quantité</th>
                                                                                <th>Prix unitaire</th>
                                                                                <th>Total</th>
                                                                                <th>Heure</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {category.details.map((detail, idx) => (
                                                                                <tr key={idx}>
                                                                                    <td>{detail.produit_nom}</td>
                                                                                    <td>{detail.quantite}</td>
                                                                                    <td>{parseFloat(detail.prix_unitaire).toFixed(2)} €</td>
                                                                                    <td>{(detail.quantite * detail.prix_unitaire).toFixed(2)} €</td>
                                                                                    <td>
                                                                                        {new Date(detail.created_at).toLocaleTimeString('fr-FR', {
                                                                                            hour: '2-digit',
                                                                                            minute: '2-digit'
                                                                                        })}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                ) : (
                                                                    <p>Aucun détail disponible pour cette catégorie.</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                        <tr className="total-row">
                                            <td>Total journalier</td>
                                            <td>{categories.reduce((sum, cat) => sum + Number(cat.total_quantite), 0)}</td>
                                            <td>
                                                {categories
                                                    .reduce((sum, cat) => sum + Number(cat.total_montant), 0)
                                                    .toFixed(2)} €
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default SalesHistory;
