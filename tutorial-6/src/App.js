import Map from './Maps';
import Header from './Header';
import React, { useState } from 'react';

function App() {
    const [mapLayer, setMapLayer] = useState('satellite');

    const selectionChanged = (data) => {
        setMapLayer(data);
    };

    return (
        <div>
            <Header
                selectionChanged={selectionChanged}
                selectedValue={mapLayer}
            />
            <Map layer={mapLayer} />
        </div>
    );
}

export default App;
