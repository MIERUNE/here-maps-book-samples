import './Route.css';
import React, { useState } from 'react';
import './Discover.css';

function Discover({ discoverParams, handleDiscover }) {
    // State to keep track of which item is open
    const [openItem, setOpenItem] = useState(null);
    const [localDiscoverParams, setLocalDiscoverParams] =
        useState(discoverParams);

    const onClick = () => {
        handleDiscover(localDiscoverParams);
    };

    const handleCheckboxChange = () => {
        setLocalDiscoverParams({
            ...localDiscoverParams,
            searchRoute: !localDiscoverParams.searchRoute,
        });
    };

    const toggleItem = () => {
        // Toggle the item: if it's already open, close it, and vice versa
        setOpenItem(openItem ? null : true);
    };

    const handleKeyChange = (event) => {
        setLocalDiscoverParams({
            ...localDiscoverParams,
            [event.target.name]: event.target.value,
        });
    };

    return (
        <div className="discover">
            <b>施設検索</b>
            <p>
                施設名（店舗名）、
                <br /> または電話番号をご入力ください。
            </p>
            <p>施設名</p>
            <input type="text" name="keyword" onChange={handleKeyChange} />
            <p>電話番号</p>
            <input type="text" name="phone" onChange={handleKeyChange} />
            <div className="toggle-list">
                <div className="item">
                    <b onClick={() => toggleItem()}>詳細検索</b>
                    {openItem === true && (
                        <div>
                            <input
                                type="checkbox"
                                checked={localDiscoverParams.searchRoute}
                                onChange={handleCheckboxChange}
                            />
                            <label>経路沿いで検索</label>
                        </div>
                    )}
                </div>
            </div>
            <button onClick={onClick}>検索</button>
        </div>
    );
}

export default Discover;
