import './Route.css';
import React, { useEffect, useState } from 'react';

function Route({ routingParams, onSearchClick }) {
    // State to keep track of which item is open
    const [openItem, setOpenItem] = useState(null);
    const [localRoutingParams, setLocalDiscoverParams] =
        useState(routingParams);

    const onClick = () => {
        onSearchClick(localRoutingParams);
    };

    const handleDropdownChange = (event) => {
        setLocalDiscoverParams({
            ...localRoutingParams,
            transportMode: event.target.value,
        });
    };

    const handleInputChange = (event) => {
        setLocalDiscoverParams({
            ...localRoutingParams,
            [event.target.name]: event.target.value,
        });
    };

    const handleCheckboxChange = () => {
        setLocalDiscoverParams({
            ...localRoutingParams,
            tollroad: !localRoutingParams.tollroad,
        });
    };

    const toggleItem = () => {
        // Toggle the item: if it's already open, close it, and vice versa
        setOpenItem(openItem ? null : true);
    };

    return (
        <div className="routing">
            <b>経路検索</b>
            <p>出発地点</p>
            <input type="text" name="origin" onChange={handleInputChange} />
            <p>目的地</p>
            <input
                type="text"
                name="destination"
                onChange={handleInputChange}
            />
            <div className="toggle-list">
                <div className="item">
                    <b onClick={() => toggleItem()}>詳細検索</b>
                    {openItem === true && (
                        <div>
                            <div>
                                <select
                                    value={localRoutingParams.mode}
                                    onChange={handleDropdownChange}
                                >
                                    <option value="car">普通車</option>
                                    <option value="truck">大型車</option>
                                </select>
                            </div>
                            <div>
                                <input
                                    type="checkbox"
                                    checked={localRoutingParams.tollroad}
                                    onChange={handleCheckboxChange}
                                />
                                <label>有料道路</label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <button onClick={onClick}>検索</button>
        </div>
    );
}

export default Route;
