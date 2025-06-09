import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './styles.css'; // Assurez-vous que ce fichier CSS existe

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
                    console.error('Non-JSON response:', text);
                    throw new Error('Response is not JSON');
                }
                const data = await response.json();
                setFormData({
                    nom: data.nom || '',
                    prix_unitaire: data.prix_unitaire ? parseFloat(data.prix_unitaire).toFixed(2) : '',
                    categorie: data.categorie || ''
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
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'prix_unitaire' ? (value === '' ? '' : parseFloat(value) >= 0 ? value : prev.prix_unitaire) : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            setImage(file);
        } else {
            setError('Veuillez sélectionner une image valide (.jpg, .png, .jpeg)');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nom || !formData.prix_unitaire || !formData.categorie) {
            setError('Tous les champs sont requis');
            return;
        }
        if (parseFloat(formData.prix_unitaire) < 0) {
            setError('Le prix unitaire ne peut pas être négatif');
            return;
        }

        const data = new FormData();
        data.append('nom', formData.nom);
        data.append('prix_unitaire', formData.prix_unitaire);
        data.append('categorie', formData.categorie);
        if (image) {
            data.append('image', image);
        }

        try {
            setError(null);
            const response = await fetch(`http://localhost:5000/api/produits/${id}`, {
                method: 'PUT',
                body: data
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
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
        return <div className="loading">Chargement...</div>;
    }

    if (error) {
        return <div className="error-message" style={{ color: 'red', textAlign: 'center' }}>{error}</div>;
    }

    return (
        <div className="edit-product-container">
            <h2>Modifier le produit</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nom</label>
                    <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Prix unitaire (DH)</label>
                    <input
                        type="number"
                        name="prix_unitaire"
                        value={formData.prix_unitaire}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Catégorie</label>
                    <input
                        type="text"
                        name="categorie"
                        value={formData.categorie}
                        onChange={handleChange}
                        required
                        className="form-input"
                    />
                </div>
                <div className="form-group">
                    <label>Image</label>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleImageChange}
                        className="form-input"
                    />
                </div>
                <button type="submit" className="submit-btn">Mettre à jour</button>
                <button type="button" onClick={handleBack} className="back-btn">Retour</button>
            </form>
        </div>
    );
};

export default EditProduct;