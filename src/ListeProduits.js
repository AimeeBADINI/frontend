import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './styles.css';

function ListeProduits({ ajouterAuPanier }) {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProduits = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/produits');
                setProduits(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Erreur lors de la récupération des produits :', err);
                setError('Erreur lors du chargement des produits.');
                setLoading(false);
            }
        };

        fetchProduits();
    }, []);

    if (loading) {
        return <div>Chargement des produits...</div>;
    }

    if (error) {
        return <div className="message error">{error}</div>;
    }

    return (
        <div className="liste-produits-container">
            <h2>Nos Délices</h2>
            <div className="produits-grid">
                {produits.map(produit => (
                    <div key={produit.id_produit} className="produit-card">
                        <img
                            src={produit.image_url ? `http://localhost:5000${produit.image_url}` : 'https://via.placeholder.com/150'}
                            alt={produit.nom}
                            className="produit-image"
                        />
                        <h3>{produit.nom}</h3>
                        <p>{produit.prix_unitaire.toFixed(2)} €</p>
                        <button onClick={() => ajouterAuPanier(produit, 1)} className="ajouter-au-panier-button">
                            Ajouter au Panier
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ListeProduits;