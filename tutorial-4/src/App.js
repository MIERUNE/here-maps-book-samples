import Map from './Maps';
import Header from './Header';
import React, { useState } from 'react';

function App() {
    const [isVisible, setIsVisible] = useState(true);

    const toggleMenu = () => {
        setIsVisible(!isVisible);
    };

    return (
        <div>
            <Header toggleMenu={toggleMenu} />
            <Map isVisible={isVisible} />
        </div>
    );
}

export default App;
