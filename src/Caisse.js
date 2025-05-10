import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ListeProduits from './ListeProduits';
import './styles.css';



function Caisse() {
  const [produits, setProduits] = useState([]);
  const [panier, setPanier] = useState([]);
  const [total, setTotal] = useState(0);
  const [venteTerminee, setVenteTerminee] = useState(null);
  const [factureVisible, setFactureVisible] = useState(false);

  // Charger les produits au chargement
  useEffect(() => {
    axios.get('http://localhost:5000/api/produits')
      .then(response => setProduits(response.data))
      .catch(error => console.error('Erreur lors de la récupération des produits :', error));
  }, []);

  // Ajouter au panier
  const ajouterAuPanier = (produit, quantite) => {
    const existant = panier.find(item => item.id_produit === produit.id_produit);
    if (existant) {
      setPanier(panier.map(item =>
        item.id_produit === produit.id_produit
          ? { ...item, quantite: item.quantite + quantite }
          : item
      ));
    } else {
      setPanier([...panier, { ...produit, quantite }]);
    }
  };

  // Modifier la quantité d'un produit
  const modifierQuantite = (idProduit, nouvelleQuantite) => {
    const majPanier = panier.map(item =>
      item.id_produit === idProduit
        ? { ...item, quantite: parseInt(nouvelleQuantite, 10) || 0 }
        : item
    ).filter(item => item.quantite > 0);
    setPanier(majPanier);
  };

  // Supprimer un produit du panier
  const supprimerDuPanier = (idProduit) => {
    setPanier(panier.filter(item => item.id_produit !== idProduit));
  };

  // Mettre à jour le total à chaque changement de panier
  useEffect(() => {
    const totalCalcule = panier.reduce(
      (somme, item) => somme + item.prix_unitaire * item.quantite,
      0
    );
    setTotal(totalCalcule);
  }, [panier]);

  // Finaliser la vente
  const finaliserVente = () => {
    const itemsPourVente = panier.map(item => ({
      id_produit: item.id_produit,
      quantite: item.quantite,
      prix_unitaire: item.prix_unitaire
    }));

    axios.post('http://localhost:5000/api/ventes', { items: itemsPourVente })
      .then(response => {
        console.log('Vente enregistrée :', response.data);
        setVenteTerminee(response.data);
        setFactureVisible(true);
        setTimeout(() => {
          window.print();
          setFactureVisible(false);
        }, 500); // Laisser le temps au composant Facture de se rendre
        setPanier([]);
        setTotal(0);
      })
      .catch(error => {
        console.error('Erreur lors de l\'enregistrement de la vente :', error);
      });
  };

  // Obtenir un objet { id_produit: produit } pour accès rapide aux infos produits dans la facture
  const mapProduits = produits.reduce((acc, produit) => {
    acc[produit.id_produit] = produit;
    return acc;
  }, {});

  return (
    <div>
      <h1>Gestion de Caisse</h1>

      <ListeProduits produits={produits} ajouterAuPanier={ajouterAuPanier} />

      <Panier
        panier={panier}
        modifierQuantite={modifierQuantite}
        supprimerDuPanier={supprimerDuPanier}
        total={total}
      />

      {panier.length > 0 && (
        <button onClick={finaliserVente}>
          Finaliser la Vente et Imprimer la Facture
        </button>
      )}

      {factureVisible && venteTerminee && (
        <div style={{ display: 'none' }}>
          <Facture
            vente={venteTerminee}
            panier={panier}
            produits={mapProduits}
          />
        </div>
      )}
    </div>
  );
}

export default Caisse;
