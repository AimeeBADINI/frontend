import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Caisse from './Caisse';
import SalesHistory from './SalesHistory';
import Redirect from './Redirect'; // Assurez-vous que ce composant existe
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Caisse />} />
                <Route path="/sales-history" element={<SalesHistory />} />
                <Route path="/redirect" element={<Redirect />} />
                <Route path="/add-product" element={<AddProduct />} />
                <Route path="/edit-product/:id" element={<EditProduct />} /> {/* Route dynamique */}
                
            </Routes>
        </Router>
    );
}

export default App