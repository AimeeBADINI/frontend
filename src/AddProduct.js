import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddProduct = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nom: '',
        prix_unitaire: '',
        categorie: ''
    });
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation
        if (!formData.nom.trim()) {
            setError('Le nom est requis');
            setLoading(false);
            return;
        }
        if (!formData.prix_unitaire || formData.prix_unitaire <= 0) {
            setError('Le prix doit être supérieur à 0');
            setLoading(false);
            return;
        }
        if (!formData.categorie.trim()) {
            setError('La catégorie est requise');
            setLoading(false);
            return;
        }
        if (image && !['image/jpeg', 'image/png'].includes(image.type)) {
            setError('L\'image doit être au format JPEG ou PNG');
            setLoading(false);
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
            console.log('Envoi de FormData:', {
                nom: formData.nom,
                prix_unitaire: formData.prix_unitaire,
                categorie: formData.categorie,
                image: image ? image.name : null
            });
            const response = await axios.post('http://localhost:5000/api/produits', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 10000 // Timeout augmenté à 10 secondes
            });
            console.log('Réponse du serveur:', response.data);
            alert('Produit ajouté avec succès !');
            navigate('/redirect');  // Rediriger vers la page d'accueil ou la liste des produits
        } catch (err) {
            console.error('Erreur lors de l\'ajout du produit:', err);
            let errorMessage = 'Impossible d\'ajouter le produit';
            if (err.code === 'ERR_NETWORK' || err.code === 'ECONNRESET') {
                errorMessage += ': La connexion au serveur a été réinitialisée. Vérifiez si le serveur est en cours d\'exécution sur localhost:5000.';
            } else if (err.code === 'ECONNABORTED') {
                errorMessage += ': La requête a expiré. Le serveur met trop de temps à répondre.';
            } else if (err.response) {
                errorMessage += `: ${err.response.status} - ${err.response.data.error || err.message}`;
            } else {
                errorMessage += `: ${err.message}`;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate(-1); // Revenir à la page précédente
    };

    return (
        <div className="add-product-container" style={{ maxWidth: '500px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Ajouter un produit</h2>
            {error && (
                <div style={{ color: 'red', marginBottom: '15px', textAlign: 'center', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nom</label>
                    <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prix unitaire (€)</label>
                    <input
                        type="number"
                        name="prix_unitaire"
                        value={formData.prix_unitaire}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Catégorie</label>
                    <input
                        type="text"
                        name="categorie"
                        value={formData.categorie}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Image (JPEG/PNG)</label>
                    <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleImageChange}
                        style={{ width: '100%', padding: '10px' }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: loading ? '#ccc' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '16px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#218838')}
                    onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#28a745')}
                >
                    {loading ? 'Enregistrement...' : 'Ajouter'}
                </button>
            </form>
            <button
                onClick={handleBack}
                style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '16px',
                    marginTop: '15px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => (e.target.style.backgroundColor = '#0056b3')}
                onMouseOut={(e) => (e.target.style.backgroundColor = '#007bff')}
            >
                Retour
            </button>
        </div>
    );
};

export default AddProduct;
