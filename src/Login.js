import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/google',
        { token: credentialResponse.credential },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));

      // Redirection simple basée sur le rôle
      navigate(user.role === 'admin' ? '/redirect' : '/');
    } catch (err) {
      setError('Échec de la connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Connexion</h2>
      {error && <div className="error-message">{error}</div>}

      <GoogleOAuthProvider clientId="1029997096228-2k4n1nfj3obo0ir2fvedvd1kvnb08skc.apps.googleusercontent.com">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => setError('Erreur lors de la connexion Google')}
          useOneTap
          theme="filled_blue"
          shape="rectangular"
          size="large"
          locale="fr"
        />
      </GoogleOAuthProvider>

      {loading && <div className="loading-spinner">Chargement...</div>}
    </div>
  );
};

export default Login;