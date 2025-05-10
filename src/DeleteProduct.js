import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const DeleteProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/produits/${id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setProduct(response.data);
                setLoading(false);
            } catch (err) {
                setError("Erreur lors du chargement du produit");
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleDelete = async (productId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
            return;
        }
    
        try {
            await axios.delete(`http://localhost:5000/api/produits/${productId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            setProduct(product.filter(product => product.id !== productId));
            alert('Produit supprimé avec succès !');
        } catch (err) {
            console.error('Erreur lors de la suppression du produit:', err);
            setError(err.response?.data?.error || 'Impossible de supprimer le produit.');
        }
    };
    if (loading) return <p>Chargement...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div className="delete-product-container">
            <h2>Supprimer le produit</h2>
            {product && (
                <>
                    <p><strong>Nom :</strong> {product.nom}</p>
                    <p><strong>Prix :</strong> {parseFloat(product.prix_unitaire).toFixed(2)} €</p>
                    <p><strong>Catégorie :</strong> {product.categorie}</p>
                    <button onClick={handleDelete} style={{ backgroundColor: 'red', color: 'white' }}>
                        Supprimer
                    </button>
                </>
            )}
        </div>
    );
};

export default DeleteProduct;