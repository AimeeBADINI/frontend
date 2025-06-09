
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import PaymentIcon from '@mui/icons-material/Payment';
import PrintIcon from '@mui/icons-material/Print';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';
import CakeIcon from '@mui/icons-material/Cake';
import './styles.css';

function Caisse() {
    const navigate = useNavigate();
    const [produits, setProduits] = useState([]);
    const [panier, setPanier] = useState([]);
    const [lastSaleId, setLastSaleId] = useState(null);
    const [lastPanier, setLastPanier] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('Tous');
    const [searchQuery, setSearchQuery] = useState('');
    const [numTickets, setNumTickets] = useState(1);
    const [errorMessage, setErrorMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [calcDisplay, setCalcDisplay] = useState('0');
    const [currentValue, setCurrentValue] = useState(0);
    const [previousValue, setPreviousValue] = useState(null);
    const [operator, setOperator] = useState(null);
    const [clearDisplay, setClearDisplay] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Espèces');

    useEffect(() => {
        axios.get('http://localhost:5000/api/produits')
            .then(response => {
                const formattedProducts = response.data.map(product => ({
                    ...product,
                    prix_unitaire: parseFloat(product.prix_unitaire) || 0,
                    prix_base: parseFloat(product.prix_unitaire) || 0
                }));
                setProduits(Array.isArray(formattedProducts) ? formattedProducts : []);
            })
            .catch(error => {
                console.error('Erreur lors du chargement des produits:', error);
                setErrorMessage('Impossible de charger les produits. Vérifiez la connexion au serveur.');
            });
    }, []);

    const updateCategory = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/produits/update-tartes-to-entremets');
            alert(response.data.message);
            const res = await axios.get('http://localhost:5000/api/produits');
            setProduits(Array.isArray(res.data) ? res.data.map(product => ({
                ...product,
                prix_unitaire: parseFloat(product.prix_unitaire) || 0,
                prix_base: parseFloat(product.prix_unitaire) || 0
            })) : []);
        } catch (err) {
            console.error('Erreur lors de la mise à jour de la catégorie :', err);
            setErrorMessage('Erreur lors de la mise à jour de la catégorie.');
        }
    };

    const performCalculation = (prev, curr, op) => {
        switch (op) {
            case '+': return prev + curr;
            case '-': return prev - curr;
            case '×': return prev * curr;
            case '÷': return curr !== 0 ? prev / curr : 'Erreur';
            default: return curr;
        }
    };

    const handleCalculatorInput = (value) => {
        if (/[0-9]/.test(value) || value === '.') {
            if (calcDisplay === 'Erreur') {
                setCalcDisplay(value === '.' ? '0.' : value);
                setCurrentValue(value === '.' ? '0.' : value);
                setClearDisplay(false);
                return;
            }
            if (clearDisplay || calcDisplay === '0') {
                const newDisplay = value === '.' ? '0.' : value;
                setCalcDisplay(newDisplay);
                setCurrentValue(newDisplay);
                setClearDisplay(false);
            } else {
                if (value === '.' && calcDisplay.includes('.')) return;
                const newDisplay = calcDisplay + value;
                setCalcDisplay(newDisplay);
                setCurrentValue(newDisplay);
            }
            return;
        }

        if (value === 'C') {
            setCalcDisplay('0');
            setCurrentValue(0);
            setPreviousValue(null);
            setOperator(null);
            setClearDisplay(false);
            return;
        }

        if (value === 'CE') {
            setCalcDisplay('0');
            setCurrentValue(0);
            return;
        }

        if (value === '±') {
            if (calcDisplay === 'Erreur' || calcDisplay === '0') return;
            const newValue = (parseFloat(calcDisplay) * -1).toString();
            setCalcDisplay(newValue);
            setCurrentValue(newValue);
            return;
        }

        if (value === '%') {
            if (calcDisplay === 'Erreur') return;
            const current = parseFloat(calcDisplay);
            if (previousValue !== null && operator) {
                const percentage = (previousValue * current) / 100;
                let result;
                switch (operator) {
                    case '+': result = previousValue + percentage; break;
                    case '-': result = previousValue - percentage; break;
                    case '×': result = percentage; break;
                    case '÷': result = percentage !== 0 ? previousValue / percentage : 'Erreur'; break;
                    default: return;
                }
                if (result === 'Erreur') {
                    setCalcDisplay('Erreur');
                    setCurrentValue(0);
                    setPreviousValue(null);
                    setOperator(null);
                    setClearDisplay(false);
                    return;
                }
                setCalcDisplay(result.toFixed(2));
                setCurrentValue(result);
                setPreviousValue(null);
                setOperator(null);
                setClearDisplay(true);
            } else {
                const percentage = current / 100;
                setCalcDisplay(percentage.toFixed(4));
                setCurrentValue(percentage);
            }
            return;
        }

        if (['+', '-', '×', '÷'].includes(value)) {
            if (calcDisplay === 'Erreur') return;
            const current = parseFloat(calcDisplay);
            if (previousValue !== null && operator && !clearDisplay) {
                const result = performCalculation(previousValue, current, operator);
                if (result === 'Erreur') {
                    setCalcDisplay('Erreur');
                    setCurrentValue(0);
                    setPreviousValue(null);
                    setOperator(null);
                    return;
                }
                setCalcDisplay(result.toFixed(2));
                setCurrentValue(result);
                setPreviousValue(result);
            } else {
                setPreviousValue(current);
            }
            setOperator(value);
            setClearDisplay(true);
            return;
        }

        if (value === '=') {
            if (calcDisplay === 'Erreur' || previousValue === null || operator === null) return;
            const current = parseFloat(calcDisplay);
            const result = performCalculation(previousValue, current, operator);
            if (result === 'Erreur') {
                setCalcDisplay('Erreur');
                setCurrentValue(0);
                setPreviousValue(null);
                setOperator(null);
                return;
            }
            setCalcDisplay(result.toFixed(2));
            setCurrentValue(result);
            setPreviousValue(null);
            setOperator(null);
            setClearDisplay(true);
        }
    };

    const ajouterAuPanier = (produit) => {
        const isGateauxSoiree = produit.categorie === 'GÂTEAUX SOIRÉE';
        const unit = isGateauxSoiree ? 'kg' : 'unité';
        const existingItem = panier.find(item => item.id === produit.id && item.unit === unit);
        let updatedPanier;

        if (existingItem) {
            updatedPanier = panier.map(item =>
                item.id === produit.id && item.unit === unit
                    ? { ...item, quantite: item.quantite + 1 }
                    : item
            );
        } else {
            updatedPanier = [...panier, {
                id: produit.id,
                nom: produit.nom,
                prix_unitaire: parseFloat(produit.prix_unitaire) || 0,
                prix_base: parseFloat(produit.prix_unitaire) || 0,
                image_url: produit.image_url,
                categorie: produit.categorie === 'pasteles' || produit.categorie === 'gateaux' ? 'GÂTEAUX SOIRÉE' : produit.categorie,
                quantite: 1,
                unit: unit
            }];
        }
        setPanier(updatedPanier);
        setErrorMessage('');
    };

    const modifierQuantite = (idProduit, nouvelleQuantite, nouvelleUnite) => {
        const parsedQuantity = parseFloat(nouvelleQuantite);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            setErrorMessage('La quantité doit être un nombre positif.');
            return;
        }
        if (nouvelleUnite !== 'kg' && nouvelleUnite !== 'g' && nouvelleUnite !== 'unité') {
            setErrorMessage('Unité invalide. Utilisez kg, g ou unité.');
            return;
        }

        setPanier(panier.map(item => {
            if (item.id === idProduit) {
                const isGateauxSoiree = item.categorie === 'GÂTEAUX SOIRÉE';
                let prix_unitaire = item.prix_base;

                if (isGateauxSoiree && nouvelleUnite === 'g') {
                    prix_unitaire = item.prix_base / 1000;
                } else if (isGateauxSoiree && nouvelleUnite === 'kg') {
                    prix_unitaire = item.prix_base;
                }

                return {
                    ...item,
                    quantite: parsedQuantity,
                    prix_unitaire,
                    unit: isGateauxSoiree ? nouvelleUnite : 'unité'
                };
            }
            return item;
        }));
        setErrorMessage('');
    };

    const handleDoubleClick = (item) => {
        const isGateauxSoiree = item.categorie === 'GÂTEAUX SOIRÉE';
        let nouvelleUnite = item.unit;
        if (isGateauxSoiree) {
            const unitePrompt = prompt(`Choisir l'unité pour ${item.nom} (g pour grammes, kg pour kilogrammes):`, item.unit || 'kg');
            nouvelleUnite = unitePrompt === 'g' ? 'g' : 'kg';
        }
        const nouvelleQuantite = prompt(`Entrer la quantité pour ${item.nom} (${nouvelleUnite || 'unité'}):`, item.quantite);
        if (nouvelleQuantite !== null) {
            modifierQuantite(item.id, nouvelleQuantite, nouvelleUnite);
        }
    };

    const supprimerDuPanier = (idProduit, unit) => {
        setPanier(panier.filter(item => !(item.id === idProduit && item.unit === unit)));
        setErrorMessage('');
    };

    const viderPanier = () => {
        if (window.confirm('Vider le panier ?')) {
            setPanier([]);
            setNumTickets(1);
            setErrorMessage('');
        }
    };

    const calculerTotal = (cartItems = panier) => {
        return parseFloat(cartItems.reduce((sum, item) => sum + item.prix_unitaire * item.quantite, 0).toFixed(2));
    };

    const finaliserVente = async () => {
        if (panier.length === 0) {
            setErrorMessage('Le panier est vide.');
            return;
        }

        if (!window.confirm('Confirmer le paiement ?')) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage('');

        const saleData = {
            items: panier.map(item => ({
                productId: item.id,
                quantity: item.quantite,
                prix_unitaire: item.prix_unitaire,
                unit: item.unit || 'unité',
                categorie: item.categorie === 'pasteles' || item.categorie === 'gateaux' ? 'GÂTEAUX SOIRÉE' : item.categorie
            })),
            total: calculerTotal(),
            payment_method: paymentMethod
        };

        try {
            const res = await axios.post('http://localhost:5000/api/sales', saleData);
            alert('Vente enregistrée avec succès');
            setLastSaleId(res.data.saleId);
            setLastPanier([...panier]);
            setPanier([]);
            setNumTickets(1);
        } catch (err) {
            console.error('Erreur lors de l\'enregistrement de la vente:', err);
            setErrorMessage('Erreur lors de l\'enregistrement de la vente ou de l\'impression. Vérifiez la connexion au serveur.');
        } finally {
            setIsProcessing(false);
        }
    };

    const generateInvoice = (saleId, cartItems) => {
        return new Promise((resolve, reject) => {
            try {
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: [80, 150 + cartItems.length * 10]
                });

                doc.setFont('Helvetica', 'normal');
                doc.setFontSize(12);
                doc.text('Pâtisserie Délices', 40, 10, { align: 'center' });
                doc.setFontSize(8);
                doc.text('123 Rue des Délices, Paris', 40, 15, { align: 'center' });
                doc.text('Tél: +33 1 23 45 67 89', 40, 20, { align: 'center' });

                doc.setFontSize(9);
                doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 5, 30);
                doc.text(`Heure: ${new Date().toLocaleTimeString('fr-FR')}`, 5, 35);

                doc.setFontSize(8);
                let y = 45;
                doc.setLineWidth(0.2);
                doc.setDrawColor(200, 160, 140);
                doc.line(5, y - 5, 75, y - 5);
                doc.text('Produit', 5, y);
                doc.text('Prix (DH)', 25, y);
                doc.text('Qté', 45, y);
                doc.text('Total (DH)', 60, y);
                y += 5;
                doc.line(5, y, 75, y);
                y += 5;

                cartItems.forEach(item => {
                    const totalItem = (item.prix_unitaire * item.quantite).toFixed(2);
                    const nom = item.nom.length > 20 ? item.nom.substring(0, 18) + '...' : item.nom;
                    const categorie = item.categorie === 'pasteles' || item.categorie === 'gateaux' ? 'GÂTEAUX SOIRÉE' : item.categorie;
                    doc.text(`${nom} (${categorie === 'GÂTEAUX SOIRÉE' ? item.unit : 'unité'})`, 5, y);
                    doc.text(item.prix_unitaire.toFixed(2), 25, y);
                    doc.text(`${item.quantite} ${categorie === 'GÂTEAUX SOIRÉE' ? item.unit : ''}`, 45, y);
                    doc.text(totalItem, 60, y);
                    y += 7;
                });

                y += 5;
                doc.line(5, y - 5, 75, y - 5);
                doc.setFontSize(9);
                doc.text(`Total: ${calculerTotal(cartItems)} DH`, 50, y);
                y += 5;
                doc.setFontSize(8);
                doc.text(`Mode de paiement: ${paymentMethod}`, 5, y);
                y += 5;
                doc.text('Merci de votre visite !', 40, y, { align: 'center' });

                const pdfBlob = doc.output('blob');
                resolve(pdfBlob);
            } catch (err) {
                reject(err);
            }
        });
    };

    const downloadLastInvoice = async () => {
        if (!lastSaleId || lastPanier.length === 0) {
            setErrorMessage('Aucune facture récente à télécharger.');
            return;
        }

        try {
            const updatedLastPanier = lastPanier.map(item => ({
                ...item,
                categorie: item.categorie === 'pasteles' || item.categorie === 'gateaux' ? 'GÂTEAUX SOIRÉE' : item.categorie
            }));
            const pdfBlob = await generateInvoice(lastSaleId, updatedLastPanier);
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ticket.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setErrorMessage('');
        } catch (err) {
            console.error('Erreur lors du téléchargement du PDF:', err);
            setErrorMessage('Erreur lors du téléchargement du PDF.');
        }
    };

    const printLastInvoice = async () => {
        if (panier.length === 0) {
            setErrorMessage('Le panier est vide. Ajoutez des articles pour imprimer un ticket.');
            return;
        }

        const parsedNumTickets = parseInt(numTickets);
        if (isNaN(parsedNumTickets) || parsedNumTickets < 1) {
            setErrorMessage('Le nombre de tickets doit être un nombre positif.');
            setIsProcessing(false);
            return;
        }

        if (!window.confirm(`Imprimer ${parsedNumTickets} ticket(s) ?`)) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage('');

        try {
            const total = calculerTotal();
            const saleData = {
                items: panier.map(item => ({
                    productId: item.id,
                    quantity: item.quantite,
                    prix_unitaire: item.prix_unitaire,
                    unit: item.unit || 'unité',
                    categorie: item.categorie === 'pasteles' || item.categorie === 'gateaux' ? 'GÂTEAUX SOIRÉE' : item.categorie
                })),
                total: total,
                payment_method: paymentMethod
            };

            const res = await axios.post('http://localhost:5000/api/sales', saleData);
            const saleId = res.data.saleId;
            const itemsToPrint = panier.map(item => ({
                ...item,
                categorie: item.categorie === 'pasteles' || item.categorie === 'gateaux' ? 'GÂTEAUX SOIRÉE' : item.categorie
            }));

            setLastSaleId(saleId);
            setLastPanier(itemsToPrint);
            setPanier([]);
            setNumTickets(1);

            const pdfBlob = await generateInvoice(saleId, itemsToPrint);
            const formData = new FormData();
            formData.append('pdf', pdfBlob, `ticket.pdf`);
            formData.append('saleId', saleId);
            formData.append('items', JSON.stringify(itemsToPrint));
            formData.append('total', calculerTotal(itemsToPrint));
            formData.append('numTickets', parsedNumTickets);
            formData.append('payment_method', paymentMethod);

            await axios.post('http://localhost:5000/api/print', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await axios.post(`http://localhost:5000/api/sales/${saleId}/print`);

            alert(`${parsedNumTickets} ticket(s) imprimé(s) avec succès !`);
            setErrorMessage('');
        } catch (err) {
            console.error('Erreur lors de la vente ou de l\'impression:', err);
            setErrorMessage('Erreur lors de l\'enregistrement de la vente ou de l\'impression. Vérifiez l\'imprimante ou la connexion au serveur.');
        } finally {
            setIsProcessing(false);
        }
    };

    const categories = ['Tous', ...new Set(produits.map(product => product.categorie || 'Autres'))];
    const filteredProducts = selectedCategory === 'Tous'
        ? produits.filter(product => product.nom.toLowerCase().includes(searchQuery.toLowerCase()))
        : produits.filter(product => product.categorie === selectedCategory && product.nom.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="pos-container">
            <header className="pos-header">
                <h1><CakeIcon /> Pâtisserie Délices</h1>
            </header>
            {isProcessing && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <div className="main-section">
                <div className="left-section">
                    <div className="category-section">
                        {categories.map(category => (
                            <button
                                key={category}
                                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                                onClick={() => setSelectedCategory(category)}
                                aria-label={`Filtrer par catégorie ${category}`}
                            >
                                {category.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="center-section">
                    <div className="search-bar">
                        <div className="search-container">
                            <span className="search-icon"><SearchIcon /></span>
                            <input
                                type="text"
                                placeholder="Rechercher une pâtisserie..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="search-input"
                                aria-label="Rechercher une pâtisserie"
                            />
                            {searchQuery && (
                                <button
                                    className="clear-search-btn"
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Effacer la recherche"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="product-grid">
                        {filteredProducts.map(produit => (
                            <div
                                key={produit.id}
                                className="product-card"
                                onClick={() => ajouterAuPanier(produit)}
                                aria-label={`Ajouter ${produit.nom} au panier`}
                            >
                                <div className="product-image-wrapper">
                                    <img
                                        src={produit.image_url ? `http://localhost:5000${produit.image_url}` : 'https://via.placeholder.com/120'}
                                        alt={produit.nom}
                                        className="product-image"
                                    />
                                </div>
                                <div className="product-info">
                                    <h4>{produit.nom}</h4>
                                    <p className="product-category">{produit.categorie}</p>
                                    <p className="product-price">{produit.prix_unitaire.toFixed(2)} DH</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="separator"></div>
                    <div className="action-buttons">
                        <button onClick={viderPanier} className="action-btn" aria-label="Vider le panier">
                            <ClearIcon /> Vider
                        </button>
                        <div className="payment-method">
                            <label htmlFor="payment-method">Mode de paiement :</label>
                            <select
                                id="payment-method"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                aria-label="Sélectionner le mode de paiement"
                            >
                                <option value="Espèces">Espèces</option>
                                <option value="Carte">Carte</option>
                            </select>
                        </div>
                        <button
                            onClick={finaliserVente}
                            className="action-btn"
                            aria-label="Traiter la vente"
                            disabled={isProcessing}
                        >
                            <PaymentIcon /> Payer
                        </button>
                        <div className="print-container">
                            <input
                                type="number"
                                min="1"
                                value={numTickets}
                                onChange={e => setNumTickets(e.target.value)}
                                aria-label="Nombre de tickets à imprimer"
                            />
                            <button
                                onClick={printLastInvoice}
                                className="action-btn"
                                aria-label="Imprimer le dernier ticket"
                                disabled={isProcessing}
                            >
                                <PrintIcon /> Imprimer
                            </button>
                        </div>
                        <button
                            onClick={updateCategory}
                            className="action-btn"
                            aria-label="Mettre à jour la catégorie tartes vers entremets"
                        >
                            <ClearIcon /> Mettre à jour Catégorie
                        </button>
                        <button
                            onClick={() => navigate('/sales-history')}
                            className="action-btn"
                            aria-label="Voir l'historique des ventes"
                        >
                            <HistoryIcon /> Historique
                        </button>
                        <button
                            onClick={() => window.confirm('Fermer la caisse ?') && navigate('/')}
                            className="action-btn"
                            aria-label="Fermer la caisse"
                        >
                            <CloseIcon /> Fermer
                        </button>
                    </div>
                </div>
                <div className="right-section">
                    <div className="ticket-content">
                        <div className="total-display">{calculerTotal().toFixed(2)} DH</div>
                        {panier.length === 0 ? (
                            <p className="empty-cart">Panier vide</p>
                        ) : (
                            <table className="cart-table">
                                <thead>
                                    <tr>
                                        <th>Produit</th>
                                        <th>Prix</th>
                                        <th>Qté</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {panier.map(item => (
                                        <tr
                                            key={`${item.id}-${item.unit}`}
                                            onDoubleClick={() => handleDoubleClick(item)}
                                            className="cart-item"
                                            aria-label={`Modifier ${item.nom}`}
                                        >
                                            <td>{item.nom}</td>
                                            <td>{item.prix_unitaire.toFixed(2)} DH/{item.categorie === 'GÂTEAUX SOIRÉE' ? item.unit : 'unité'}</td>
                                            <td>{item.quantite} {item.categorie === 'GÂTEAUX SOIRÉE' ? item.unit : ''}</td>
                                            <td>{(item.prix_unitaire * item.quantite).toFixed(2)}</td>
                                            <td>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        supprimerDuPanier(item.id, item.unit);
                                                    }}
                                                    aria-label={`Supprimer ${item.nom}`}
                                                    className="delete-btn"
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div className="calculator">
                        <input
                            type="text"
                            value={calcDisplay}
                            readOnly
                            aria-label="Affichage de la calculatrice"
                            className="calculator-display"
                        />
                        <div className="calculator-grid">
                            {['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '=', '+', 'C'].map(btn => (
                                <button
                                    key={btn}
                                    onClick={() => handleCalculatorInput(btn)}
                                    aria-label={`Calculatrice bouton ${btn === 'C' ? 'Effacer' : btn === '=' ? 'Égal' : btn}`}
                                    className="calculator-btn"
                                >
                                    {btn}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {errorMessage && (
                <div className="error-message">
                    {errorMessage}
                </div>
            )}
        </div>
    );
}

export default Caisse;