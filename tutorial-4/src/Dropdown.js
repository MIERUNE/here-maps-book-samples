import React, { useEffect, useState } from 'react';

// メニューに表示されるプルダウン
function Dropdown({ onData }) {
    const [routesList, setRoutesList] = useState([]);
    const [selectedOption, setSelectedOption] = useState('');

    // プルダウンで選択された値が変更される際に実行される関数
    const handleChange = (event) => {
        setSelectedOption(event.target.value);
        onData(event.target.value);
    };

    // コンポーネントが読み込まれた際にroute.geojsonから路線データをフェッチするための関数
    useEffect(() => {
        fetch('./route.geojson')
            .then((response) => response.json())
            .then((json) => {
                const tempRouteList = [];
                const jsonFeatures = json['features'];
                jsonFeatures.map((lineSegment) => {
                    if (
                        lineSegment['geometry']['type'].includes('LineString')
                    ) {
                        const busObject = lineSegment['properties'];
                        // 路線バスの路線名と路線IDがペアになったoptionがプルダウンに追加されます
                        tempRouteList.push(
                            <option value={busObject['route_id']}>
                                {busObject['route_name']}
                            </option>
                        );
                    }
                });
                setRoutesList(tempRouteList);
            });
    }, []);

    return (
        <div>
            <select value={selectedOption} onChange={handleChange}>
                <option value="">バス路線を選択する</option>
                {routesList}
            </select>
        </div>
    );
}

export default Dropdown;
