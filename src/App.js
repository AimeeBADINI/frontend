import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import AddProduct from './AddProduct';
import Login from './Login';
import Redirect from './Redirect';
import EditProduct from './EditProduct';
import DeleteProduct from './DeleteProduct';
import Header from './Header';
import SalesHistory from './SalesHistory';
import './styles.css';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Vérifier si l'utilisateur est connecté
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    }, []);

    // Fonction pour protéger les routes
    const ProtectedRoute = ({ children }) => {
        // Si l'utilisateur n'est pas connecté, rediriger vers la page de login
        if (!isAuthenticated) {
            return <Navigate to="/login" />;
        }
        return children;
    };

    return (
        <Router>
            <Header />
            <main style={{ padding: '20px' }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    
                    {/* Route protégée */}
                    <Route 
                        path="/sales-history" 
                        element={
                            <ProtectedRoute>
                                <SalesHistory />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/add-product" 
                        element={
                            <ProtectedRoute>
                                <AddProduct />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/redirect" 
                        element={
                            <ProtectedRoute>
                                <Redirect />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/edit-product/:id" 
                        element={
                            <ProtectedRoute>
                                <EditProduct />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/delete-product/:id" 
                        element={
                            <ProtectedRoute>
                                <DeleteProduct />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Route non protégée */}
                    <Route path="/login" element={<Login />} />
                </Routes>
            </main>
        </Router>
    );
};

export default App;
