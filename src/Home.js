import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import Header from './Header';
import Footer from './Footer';
import './styles.css';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [lastSaleId, setLastSaleId] = useState(null);
    const [filterCategory, setFilterCategory] = useState('Tous');
    const [searchQuery, setSearchQuery] = useState('');
    const [amountGiven, setAmountGiven] = useState('');
    const [change, setChange] = useState(null);
    const [lastCart, setLastCart] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:5000/api/produits')
            .then(res => {
                const formattedProducts = res.data.map(product => ({
                    ...product,
                    prix_unitaire: parseFloat(product.prix_unitaire)
                }));
                setProducts(Array.isArray(formattedProducts) ? formattedProducts : []);
            })
            .catch(err => {
                console.error('Erreur chargement produits:', err);
                setProducts([]);
                setErrorMessage('Impossible de charger les produits. Vérifiez la connexion au serveur.');
            });
    }, []);

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.productId === product.id);
        let updatedCart;

        if (existingItem) {
            updatedCart = cart.map(item =>
                item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else {
            updatedCart = [...cart, {
                productId: product.id,
                nom: product.nom,
                prix_unitaire: parseFloat(product.prix_unitaire),
                image_url: product.image_url,
                categorie: product.categorie,
                quantity: 1
            }];
        }
        setCart(updatedCart);
        setErrorMessage('');
    };

    const updateQuantity = (productId, newQuantity) => {
        const parsedQuantity = parseInt(newQuantity);
        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
            setErrorMessage('La quantité doit être un nombre positif.');
            return;
        }
        setCart(cart.map(item => item.productId === productId ? { ...item, quantity: parsedQuantity } : item));
        setErrorMessage('');
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.productId !== productId));
        setErrorMessage('');
    };

    const clearCart = () => {
        if (window.confirm('Voulez-vous vider le panier ?')) {
            setCart([]);
            setAmountGiven('');
            setChange(null);
            setErrorMessage('');
        }
    };

    const calculateTotal = (cartItems = cart) => {
        return parseFloat(cartItems.reduce((sum, item) => sum + item.prix_unitaire * item.quantity, 0).toFixed(2));
    };

    const handleCalculateChange = () => {
        const total = calculateTotal();
        const given = parseFloat(amountGiven);
        if (isNaN(given) || given < total) {
            setChange(null);
            setErrorMessage('Montant donné insuffisant ou invalide.');
        } else {
            setChange((given - total).toFixed(2));
            setErrorMessage('');
        }
    };

    const confirmSale = () => {
        if (cart.length === 0) {
            setErrorMessage('Le panier est vide.');
            return;
        }

        const total = calculateTotal();
        const given = parseFloat(amountGiven);
        if (isNaN(given) || given < total) {
            setErrorMessage('Veuillez entrer un montant donné suffisant.');
            return;
        }

        if (!window.confirm('Confirmer la vente ?')) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage('');

        const saleData = {
            items: cart.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                prix_unitaire: item.prix_unitaire
            })),
            total: total
        };

        axios.post('http://localhost:5000/api/sales', saleData)
            .then(res => {
                alert('Vente enregistrée avec succès');
                setLastSaleId(res.data.saleId);
                setLastCart([...cart]);
                generateInvoice(res.data.saleId, cart);
                setCart([]);
                setAmountGiven('');
                setChange(null);
            })
            .catch(err => {
                console.error('Erreur enregistrement vente:', err);
                setErrorMessage('Erreur lors de l\'enregistrement de la vente. Vérifiez la connexion au serveur.');
            })
            .finally(() => {
                setIsProcessing(false);
            });
    };

    const generateInvoice = (saleId, cartItems) => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 150 + cartItems.length * 10] // Hauteur ajustée pour plus d'espace
        });

        const tvaRate = 0.20; // 20% TVA
        const totalHT = calculateTotal(cartItems) / (1 + tvaRate);
        const tvaAmount = calculateTotal(cartItems) - totalHT;

        // En-tête
        doc.setFontSize(10);
        doc.text('Pâtisserie Délices', 40, 10, { align: 'center' });
        doc.setFontSize(7);
        doc.text('123 Rue des Gâteaux, Paris', 40, 15, { align: 'center' });
        doc.text('Tél : +33 1 23 45 67 89', 40, 20, { align: 'center' });

        // Informations du ticket
        doc.setFontSize(8);
        doc.text(`Ticket n° ${saleId}`, 5, 30);
        doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 5, 35);
        doc.text(`Heure: ${new Date().toLocaleTimeString('fr-FR')}`, 5, 40);

        // Tableau des produits
        doc.setFontSize(7);
        let y = 50;
        doc.line(5, y - 5, 75, y - 5);
        doc.text('Produit', 5, y);
        doc.text('Prix (€)', 30, y);
        doc.text('Qté', 50, y);
        doc.text('Total (€)', 60, y);
        y += 5;
        doc.line(5, y, 75, y);
        y += 5;

        cartItems.forEach(item => {
            const totalItem = (item.prix_unitaire * item.quantity).toFixed(2);
            const nom = item.nom.length > 20 ? item.nom.substring(0, 18) + '...' : item.nom;
            doc.text(nom, 5, y);
            doc.text(item.prix_unitaire.toFixed(2), 30, y);
            doc.text(item.quantity.toString(), 50, y);
            doc.text(totalItem, 60, y);
            y += 7;
        });

        // Résumé financier
        y += 5;
        doc.line(5, y - 5, 75, y - 5);
        doc.setFontSize(7);
        doc.text(`Total HT: ${totalHT.toFixed(2)} €`, 50, y);
        y += 7;
        doc.text(`TVA (20%): ${tvaAmount.toFixed(2)} €`, 50, y);
        y += 7;
        doc.setFontSize(8);
        doc.text(`Total TTC: ${calculateTotal(cartItems)} €`, 50, y);

        // Pied de page
        y += 10;
        doc.setFontSize(7);
        doc.text('Merci de votre visite !', 40, y, { align: 'center' });

        // Impression automatique
        doc.autoPrint();
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = pdfUrl;
        document.body.appendChild(iframe);

        iframe.onload = () => {
            setTimeout(() => {
                try {
                    iframe.contentWindow.print();
                } catch (err) {
                    console.error('Erreur lors de l\'impression:', err);
                    setErrorMessage('Erreur lors de l\'impression. Vérifiez l\'imprimante thermique.');
                    alert('Erreur d\'impression. Assurez-vous que l\'imprimante est connectée et configurée.');
                }
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(pdfUrl);
                }, 1000);
            }, 100); // Délai pour charger l'iframe
        };
    };

    const printLastInvoice = () => {
        if (!lastSaleId || lastCart.length === 0) {
            setErrorMessage('Aucune facture récente à imprimer.');
            return;
        }
        generateInvoice(lastSaleId, lastCart);
    };

    const groupedProducts = products.reduce((acc, product) => {
        const category = product.categorie || 'Autres';
        acc[category] = acc[category] || [];
        acc[category].push(product);
        return acc;
    }, {});

    const categories = ['Tous', ...new Set(products.map(product => product.categorie))];
    const categoriesToShow = filterCategory === 'Tous' ? Object.keys(groupedProducts) : [filterCategory];

    const filteredProducts = (categoryProducts) => {
        return categoryProducts.filter(product =>
            product.nom.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    return (
        <div className="home-container">
            
            <main className="container flex-container">
                <div className="products-section">
                    <h2>Produits</h2>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {categoriesToShow.map(category => (
                        <div key={category}>
                            <h3>{category}</h3>
                            <input
                                type="text"
                                placeholder="Rechercher un produit"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <div className="product-grid">
                                {filteredProducts(groupedProducts[category] || []).map(product => (
                                    <div key={product.id} className="product-card" onClick={() => addToCart(product)}>
                                        <img
                                            src={product.image_url ? `http://localhost:5000${product.image_url}` : 'https://via.placeholder.com/150'}
                                            alt={product.nom}
                                        />
                                        <h4>{product.nom}</h4>
                                        <p>{product.prix_unitaire.toFixed(2)} €</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="cart-section">
                    <h2>Panier</h2>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    {cart.length === 0 ? <p>Panier vide</p> : (
                        <>
                            <table>
                                <thead>
                                    <tr><th>Produit</th><th>Qté</th><th>Prix</th><th>Total</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                    {cart.map(item => (
                                        <tr key={item.productId}>
                                            <td>{item.nom}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={e => updateQuantity(item.productId, e.target.value)}
                                                />
                                            </td>
                                            <td>{item.prix_unitaire.toFixed(2)}</td>
                                            <td>{(item.quantity * item.prix_unitaire).toFixed(2)}</td>
                                            <td>
                                                <button onClick={() => removeFromCart(item.productId)}>Supprimer</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p><strong>Total: {calculateTotal()} €</strong></p>

                            <div className="payment-section">
                                <input
                                    type="number"
                                    placeholder="Montant donné (€)"
                                    value={amountGiven}
                                    onChange={e => setAmountGiven(e.target.value)}
                                    min="0"
                                    step="0.01"
                                    disabled={isProcessing}
                                />
                                <button onClick={handleCalculateChange} disabled={isProcessing}>Calculer la monnaie</button>
                                {change !== null && <p>Monnaie à rendre: <strong>{change} €</strong></p>}
                            </div>

                            <div className="cart-actions">
                                <button onClick={confirmSale} disabled={isProcessing}>
                                    {isProcessing ? 'Traitement...' : 'Valider la vente'}
                                </button>
                                {lastSaleId && (
                                    <button onClick={printLastInvoice} className="print-invoice" disabled={isProcessing}>
                                        Imprimer la facture
                                    </button>
                                )}
                                <button onClick={clearCart} className="clear-cart" disabled={isProcessing}>Vider le panier</button>
                            </div>
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Home;