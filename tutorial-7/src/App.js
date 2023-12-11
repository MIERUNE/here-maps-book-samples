import logo from './logo.svg';
import './App.css';
import Maps from './Maps';
import Header from './Header';
import { useState } from 'react';

function App() {
    const [menuVisibility, setMenuVisibility] = useState(true);

    const toggleMenu = () => {
        setMenuVisibility(!menuVisibility);
    };

    return (
        <div className="App">
            <Header toggleMenu={toggleMenu} />
            <Maps menuVisibility={menuVisibility} />
        </div>
    );
}

export default App;
