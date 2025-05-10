import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nom: '',
        prix_unitaire: '',
        categorie: ''
    });
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/produits/${id}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    console.log('Non-JSON response:', text);
                    throw new Error('Response is not JSON');
                }
                const data = await response.json();
                setFormData({
                    nom: data.nom,
                    prix_unitaire: data.prix_unitaire,
                    categorie: data.categorie
                });
                setLoading(false);
            } catch (err) {
                console.error('Erreur lors de la récupération du produit:', err);
                setError(`Impossible de charger le produit: ${err.message}`);
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('nom', formData.nom);
        data.append('prix_unitaire', formData.prix_unitaire);
        data.append('categorie', formData.categorie);
        if (image) {
            data.append('image', image);
        }

        try {
            const response = await fetch(`http://localhost:5000/api/produits/${id}`, {
                method: 'PUT',
                body: data
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                await response.json(); // Parse JSON if present
            }
            navigate('/redirect'); // Rediriger vers la liste des produits
        } catch (err) {
            console.error('Erreur lors de la mise à jour du produit:', err);
            setError(`Impossible de mettre à jour le produit: ${err.message}`);
        }
    };

    const handleBack = () => {
        navigate(-1); // Revenir à la page précédente
    };

    if (loading) {
        return <div>Chargement...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="edit-product-container">
            <h2>Modifier le produit</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nom</label>
                    <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Prix unitaire (€)</label>
                    <input
                        type="number"
                        name="prix_unitaire"
                        value={formData.prix_unitaire}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                    />
                </div>
                <div>
                    <label>Catégorie</label>
                    <input
                        type="text"
                        name="categorie"
                        value={formData.categorie}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Image</label>
                    <input type="file" onChange={handleImageChange} />
                </div>
                <button type="submit">Mettre à jour</button>
            </form>
            <button onClick={handleBack}>Retour</button> {/* Bouton de retour à la fin */}
        </div>
    );
};

export default EditProduct;
