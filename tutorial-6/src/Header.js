import { useState } from 'react';
import './Header.css';

function Header({ selectionChanged, selectedValue }) {
    const handleChange = (e) => {
        selectionChanged(e.target.value);
    };

    return (
        <div className="header">
            <select value={selectedValue} onChange={handleChange}>
                <option value="satellite">衛星写真</option>
                <option value="satelliteLite">簡略版衛星写真</option>
                <option value="satelliteNl">ラベルなし衛星写真</option>
                <option value="terrain">地形</option>
                <option value="japan">道路地図</option>
            </select>
            <h1>衛星ナビ</h1>
        </div>
    );
}

export default Header;
