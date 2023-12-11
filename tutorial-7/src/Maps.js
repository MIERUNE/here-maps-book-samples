import React, { useEffect, useRef, useState } from 'react';
import H from '@here/maps-api-for-javascript';
import '@here/maps-api-for-javascript/bin/mapsjs-ui.css';
import './Maps.css';
import Route from './Route';
import Discover from './Discover';

const Maps = ({ menuVisibility }) => {
    const [currentRoute, setCurrentRoute] = useState('');
    const apikey = process.env.REACT_APP_HERE_API_KEY;
    // 地図を表示するHTML要素のRefを作成する
    const mapRef = useRef(null);
    const map = useRef(null);
    const routingParams = {
        origin: '',
        destination: '',
        transportMode: 'car',
        tollroad: true,
        return: 'polyline',
    };

    const discoverParams = {
        keyword: '',
        phone: '',
        searchRoute: false,
    };

    const platform = new H.service.Platform({
        apikey: apikey,
    });

    function getDiscover(query, cat) {
        const apiEndpoint = `https://discover.search.hereapi.com/v1/discover?apiKey=${
            process.env.REACT_APP_HERE_API_KEY
        }&q=${query}&at=${map.current.getCenter().lat},${
            map.current.getCenter().lng
        }&limit=1`;

        return new Promise((resolve, reject) => {
            // APIからのリスポンスをパースし、地図上にピンを立てる
            fetch(apiEndpoint)
                .then((response) => response.json())
                .then((json) => {
                    json['items'].forEach((i) => {
                        if (map.current.getObjects().length > 0) {
                            map.current.getObjects().forEach((i) => {
                                if (
                                    i.getRemoteId().includes('searchedPoint') &&
                                    i.getRemoteId().includes(cat)
                                ) {
                                    map.current.removeObject(i);
                                }
                            });
                        }

                        let marker = new H.map.Marker({
                            lat: i['position']['lat'],
                            lng: i['position']['lng'],
                        });

                        marker.setRemoteId('searchedPoint' + query + cat);
                        map.current.addObject(marker);

                        resolve([i['position']['lat'], i['position']['lng']]);
                    });
                });
        });
    }

    function getRoute(params) {
        const apiEndpoint = `https://router.hereapi.com/v8/routes?apiKey=${apikey}&transportMode=${
            params.transportMode
        }&origin=${params.origin}&destination=${
            params.destination
        }&return=polyline${params.tollroad ? '' : '&avoid[features]=tollroad'}`;

        fetch(apiEndpoint)
            .then((response) => response.json())
            .then((json) => {
                if (map.current.getObjects().length > 0) {
                    map.current.getObjects().forEach((i) => {
                        if (i.getRemoteId() === 'searchedRoute') {
                            map.current.removeObject(i);
                        }
                    });
                }

                json['routes'][0]['sections'].forEach((section) => {
                    setCurrentRoute(section.polyline);
                    // 経路をLinestring方式に変換する
                    const linestring = H.geo.LineString.fromFlexiblePolyline(
                        section.polyline
                    );

                    // 経路をPolyline形式に変換
                    const routeLine = new H.map.Polyline(linestring, {
                        style: {
                            strokeColor: 'red',
                            lineWidth: 3,
                        },
                    });

                    routeLine.setRemoteId('searchedRoute');

                    map.current.addObject(routeLine);
                });
            });
    }

    function onSearchClick(params) {
        if (
            !params.origin ||
            !params.destination ||
            params.origin === params.destination
        ) {
            return;
        } else {
            getDiscover(params.origin, 'start')
                .then((origin) => {
                    params.origin = origin;
                    return getDiscover(params.destination, 'dest');
                })
                .then((destination) => {
                    params.destination = destination;
                    return getRoute(params);
                });
        }
    }

    function handleDiscover(params) {
        console.log(params);
        let apiEndpoint;

        if (params.phone) {
            apiEndpoint = `https://discover.search.hereapi.com/v1/discover?apiKey=${
                process.env.REACT_APP_HERE_API_KEY
            }&q=${params.phone}&at=${map.current.getCenter().lat},${
                map.current.getCenter().lng
            }&limit=1`;
        } else if (params.keyword) {
            apiEndpoint = `https://discover.search.hereapi.com/v1/discover?apiKey=${
                process.env.REACT_APP_HERE_API_KEY
            }&q=${params.keyword}&at=${map.current.getCenter().lat},${
                map.current.getCenter().lng
            }&limit=1`;
        } else {
            return;
        }

        if (params.searchRoute && currentRoute !== '') {
            apiEndpoint = apiEndpoint + `&route=${currentRoute}`;
        }
        fetch(apiEndpoint)
            .then((response) => response.json())
            .then((json) => {
                json['items'].forEach((i) => {
                    if (map.current.getObjects().length > 0) {
                        map.current.getObjects().forEach((i) => {
                            if (i.getRemoteId() === 'searchedPointDiscover') {
                                map.current.removeObject(i);
                            }
                        });
                    }

                    let marker = new H.map.Marker({
                        lat: i['position']['lat'],
                        lng: i['position']['lng'],
                    });

                    marker.setRemoteId('searchedPointDiscover');
                    map.current.addObject(marker);
                });
            });
    }

    // 画面が表示された時に地図を表示する
    useEffect(
        () => {
            // 関数が最初に実行される際にmapRef.currentがnullになるので、エラーを処理する
            if (!mapRef.current) return;
            const defaultLayers = platform.createDefaultLayers();
            // ベクタータイルのソースを設定
            const omvService = platform.getOMVService({
                path: 'v2/vectortiles/core/mc',
            });
            const baseUrl =
                'https://js.api.here.com/v3/3.1/styles/omv/oslo/japan/';

            // 日本向けの地図スタイルを読み込む
            const style = new H.map.Style(`${baseUrl}normal.day.yaml`, baseUrl);

            // 背景地図のプロバイダーとレイヤーを作成
            const omvProvider = new H.service.omv.Provider(omvService, style);
            const omvlayer = new H.map.layer.TileLayer(omvProvider, {
                max: 22,
                dark: true,
            });

            // 地図を表示
            map.current = new H.Map(mapRef.current, omvlayer, {
                zoom: 13,
                center: { lat: 35.4653985951085, lng: 139.62471237692472 },
            });

            // ウィンドウのサイズが変更された際もコードが画面全体に表示されるようにする
            window.addEventListener('resize', () =>
                map.current.getViewPort().resize()
            );

            // 地図を操作できるようにする
            const behavior = new H.mapevents.Behavior(
                new H.mapevents.MapEvents(map.current)
            );
        },
        // useEffectを実行する条件を指定する
        []
    );

    // 地図を表示するDiv要素を作成し返す
    return (
        <div className="map-wrap">
            <div ref={mapRef} className="map" />
            {menuVisibility && (
                <div className="dropdown">
                    <Route
                        routingParams={routingParams}
                        onSearchClick={onSearchClick}
                    />
                    <br />
                    <Discover
                        discoverParams={discoverParams}
                        handleDiscover={handleDiscover}
                    />
                </div>
            )}
        </div>
    );
};

export default Maps;
