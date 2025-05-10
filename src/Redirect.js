import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Redirect.css';
import { Link } from 'react-router-dom';

const Redirect = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const [selectedCategory, setSelectedCategory] = useState('Tous');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/produits');
                setProducts(response.data);
                setLoading(false);
                // Récupérer les catégories uniques
                const uniqueCategories = [...new Set(response.data.map(product => product.categorie))];
                setCategories(['Tous', ...uniqueCategories]);
            } catch (err) {
                console.error('Erreur lors de la récupération des produits:', err);
                setError('Impossible de charger les produits.');
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleDelete = async (productId) => {
        const id = parseInt(productId, 10);
        if (isNaN(id)) {
            console.error('ID de produit invalide:', productId);
            setError("L'ID du produit est invalide.");
            alert("Erreur : L'ID du produit est invalide.");
            return;
        }
    
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
            return;
        }
    
        try {
            const response = await axios.delete(`http://localhost:5000/api/produits/${id}`);
            setProducts(products.filter(product => product.id !== id));
            alert(response.data.message); // Utiliser le message du serveur
            console.log('Réponse du serveur:', response.data);
        } catch (err) {
            console.error('Erreur lors de la suppression du produit:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            const errorMessage = err.response?.data?.error || 'Impossible de supprimer le produit. Vérifiez la connexion au serveur.';
            setError(errorMessage);
            alert(`Erreur : ${errorMessage}`);
        }
    };
    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
    };

    // Filtrer les produits par catégorie sélectionnée
    const filteredProducts = selectedCategory === 'Tous'
        ? products
        : products.filter(product => product.categorie === selectedCategory);

    // Regrouper les produits filtrés par catégorie pour l'affichage
    const groupedProducts = filteredProducts.reduce((acc, product) => {
        const { categorie } = product;
        if (!acc[categorie]) {
            acc[categorie] = [];
        }
        acc[categorie].push(product);
        return acc;
    }, {});

    if (loading) {
        return <div className="loading">Chargement des produits...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="redirect-container">
            <h2>Bienvenue, {user.name || 'Utilisateur'} !</h2>
            <h3>Liste des produits</h3>
            <Link to="/add-product" className="add-button">Ajouter un produit</Link>
            <Link to="/sales-history" className="historique-button">Voir l'historique</Link>
            

            <div>
                <label>Filtrer par catégorie :</label>
                <select value={selectedCategory} onChange={handleCategoryChange}>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {Object.keys(groupedProducts).length === 0 && filteredProducts.length > 0 ? (
                Object.keys(groupedProducts).map(categorie => (
                    <div key={categorie} className="category-section">
                        <h4>{categorie}</h4>
                        <ul className="product-list">
                            {groupedProducts[categorie].map(product => (
                                <li key={product.id} className="product-item">
                                    <h4>{product.nom}</h4>
                                    <p>Prix: {parseFloat(product.prix_unitaire).toFixed(2)} €</p>
                                    <p>Catégorie: {product.categorie}</p>
                                    {product.image_url && (
                                        <img
                                            src={`http://localhost:5000${product.image_url}`}
                                            alt={product.nom}
                                            className="product-image"
                                        />
                                    )}
                                    <div className="product-buttons">
                                        <Link to={`/edit-product/${product.id}`} className="edit-button">Modifier</Link>
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="delete-button"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            ) : (
                filteredProducts.length === 0 ? (
                    <p>Aucun produit trouvé dans la catégorie sélectionnée.</p>
                ) : (
                    Object.keys(groupedProducts).map(categorie => (
                        <div key={categorie} className="category-section">
                            <h4>{categorie}</h4>
                            <ul className="product-list">
                                {groupedProducts[categorie].map(product => (
                                    <li key={product.id} className="product-item">
                                        <h4>{product.nom}</h4>
                                        <p>Prix: {parseFloat(product.prix_unitaire).toFixed(2)} €</p>
                                        <p>Catégorie: {product.categorie}</p>
                                        {product.image_url && (
                                            <img
                                                src={`http://localhost:5000${product.image_url}`}
                                                alt={product.nom}
                                                className="product-image"
                                            />
                                        )}
                                        <div className="product-buttons">
                                            <Link to={`/edit-product/${product.id}`} className="edit-button">Modifier</Link>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="delete-button"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )
            )}
        </div>
    );
};

export default Redirect;
