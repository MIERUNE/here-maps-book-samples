import React, { useEffect, useRef, useState } from 'react';
import { point, featureCollection, nearestPoint } from '@turf/turf';
import H from '@here/maps-api-for-javascript';
import '@here/maps-api-for-javascript/bin/mapsjs-ui.css';
import './Map.css';
import Dropdown from './Dropdown';
import SearchComponent from './Searchbox';

const Map = ({ menuVisibility }) => {
    const [selectedRoute, setSelectedRoute] = useState('');
    const [busStops, setBusStops] = useState(null);
    let busRoutes = {};
    const map = useRef(null);
    const ui = useRef(null);

    const apikey = process.env.REACT_APP_HERE_API_KEY;

    // バスの路線データをパースして、地図上に追加する関数
    function parseRoute(routeId) {
        fetch('./route.geojson')
            .then((response) => response.json())
            .then((json) => {
                const jsonFeatures = json['features'];
                // 地物一覧、キーは地物のuniqueIdで、値としては地図に直接追加できる地物が含まれています
                const listOfRoutes = {};

                jsonFeatures.map((lineSegment) => {
                    if (
                        lineSegment['geometry']['type'].includes('LineString')
                    ) {
                        // フェッチしたJSONファイルをパースし、中身をHERE Maps API for Javascriptで利用できる形式にする
                        const geometries =
                            lineSegment['geometry']['coordinates'];
                        for (let segment in geometries) {
                            let lineString = new H.geo.LineString();
                            for (let point in geometries[segment]) {
                                lineString.pushPoint({
                                    lat: geometries[segment][point][1],
                                    lng: geometries[segment][point][0],
                                });
                            }

                            let busLine = new H.map.Polyline(lineString, {
                                style: { lineWidth: 4, strokeColor: 'blue' },
                            });

                            // 経路データを絞り込めるように地図API内でのIDを設定する
                            // 今回利用するデータは複数のセグメント（区間）でできているため、IDにはバス路線だけでなく、区間のIDもつけています
                            let busLineId =
                                lineSegment['properties']['route_id'] +
                                segment.toString();

                            // 区間のIDを設定し、地物一覧に追加します
                            busLine.setRemoteId(busLineId);
                            listOfRoutes[busLineId] = busLine;
                        }

                        const busLine = lineSegment['properties'];
                        busRoutes[busLine['route_id']] = busLine['route_name'];
                    }

                    // 地図上にある地物を全て取得し、バス路線の経路データであれば一旦削除する
                    if (map.current.getObjects().length > 0) {
                        map.current.getObjects().forEach((i) => {
                            if (listOfRoutes[i.getRemoteId()]) {
                                map.current.removeObject(i);
                            }
                        });
                    }

                    // バス路線が選択されていなければ全ての路線データを追加する
                    if (routeId !== '') {
                        for (let i in listOfRoutes) {
                            if (i.includes(routeId)) {
                                map.current.addObject(listOfRoutes[i]);
                            }
                        }
                    } else {
                        // バス路線が選択されている場合は、選択された路線だけを追加する
                        for (let route in listOfRoutes) {
                            map.current.addObject(listOfRoutes[route]);
                        }
                    }
                });
            });
    }

    function addMarkerToGroup(group, coordinate, html) {
        const marker = new H.map.Marker(coordinate);
        // add custom data to the marker
        marker.setData(html);
        group.addObject(marker);
    }

    // バス停をデフォルトのマーカーで地図上に追加する関数
    function parseStop(routeId) {
        const localBusStops = featureCollection([]);
        // バス停のグループがすでに地図上に存在する場合は、一旦バス停のグループを削除する
        if (map.current.getObjects()) {
            map.current.getObjects().forEach((i) => {
                if (i.getRemoteId() === 'busStops') {
                    map.current.removeObject(i);
                }
            });
        }

        let group = new H.map.Group();

        // 「バス停」グループのRemoteIdを設定
        // バス路線を選択し、表示する路線を絞り込む際には一旦RemoteIdでグループを全体的に削除する
        group.setRemoteId('busStops');
        map.current.addObject(group);

        // マーカーがクリックされた際に吹き出しが表示されるようにします
        group.addEventListener(
            'tap',
            function (evt) {
                const bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
                    content: evt.target.getData(),
                });
                ui.current.addBubble(bubble);
            },
            false
        );

        fetch('./stops.geojson')
            .then((response) => response.json())
            .then((json) => {
                const jsonFeatures = json['features'];

                jsonFeatures.map((points) => {
                    if (points['geometry']['type'].includes('Point')) {
                        if (routeId === '') {
                            addMarkerToGroup(
                                group,
                                {
                                    lat: geometries[1],
                                    lng: geometries[0],
                                },
                                metadata
                            );

                            // 以下のコードを追加
                            localBusStops.features.push(point(geometries));
                        } else if (
                            points['properties']['route_ids'].includes(routeId)
                        ) {
                            addMarkerToGroup(
                                group,
                                {
                                    lat: geometries[1],
                                    lng: geometries[0],
                                },
                                metadata
                            );

                            // 以下のコードを追加
                            localBusStops.features.push(point(geometries));
                        }
                    }
                });
            });

        setBusStops(localBusStops);
    }

    function getRoute(start, goal) {
        const apiEndpoint = `https://router.hereapi.com/v8/routes?apiKey=${apikey}&transportMode=pedestrian&origin=${start}&destination=${goal}&return=polyline`;

        fetch(apiEndpoint)
            .then((response) => response.json())
            .then((json) => {
                if (map.current.getObjects().length > 0) {
                    map.current.getObjects().forEach((i) => {
                        if (i.getRemoteId() === 'searched_route') {
                            map.current.removeObject(i);
                        }
                    });
                }

                json['routes'][0]['sections'].forEach((section) => {
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

                    routeLine.setRemoteId('searched_route');

                    map.current.addObject(routeLine);
                });
            });
    }

    const handleChange = (data) => {
        setSelectedRoute(data);
    };

    const handleSearch = (data) => {
        if (data === '') {
            return;
        }
        const apiEndpoint = `https://discover.search.hereapi.com/v1/discover?apiKey=${
            process.env.REACT_APP_HERE_API_KEY
        }&q=${data}&at=${map.current.getCenter().lat},${
            map.current.getCenter().lng
        }&limit=1`;

        // APIからのリスポンスをパースし、地図上にピンを立てる
        fetch(apiEndpoint)
            .then((response) => response.json())
            .then((json) => {
                json['items'].forEach((i) => {
                    if (map.current.getObjects().length > 0) {
                        map.current.getObjects().forEach((i) => {
                            if (i.getRemoteId() === 'searchedPoint') {
                                map.current.removeObject(i);
                            }
                        });
                    }

                    let marker = new H.map.Marker({
                        lat: i['position']['lat'],
                        lng: i['position']['lng'],
                    });

                    marker.setRemoteId('searchedPoint');
                    map.current.addObject(marker);

                    const nearest = nearestPoint(
                        point([i['position']['lng'], i['position']['lat']]),
                        busStops
                    );
                    getRoute(
                        [i['position']['lat'], i['position']['lng']],
                        [
                            nearest.geometry.coordinates[1],
                            nearest.geometry.coordinates[0],
                        ]
                    );
                });
            });
    };

    // 地図を表示するHTML要素のRefを作成する
    const mapRef = useRef(null);

    // 画面が表示された時に地図を表示する
    useEffect(
        () => {
            // 関数が最初に実行される際にmapRef.currentがnullになるので、エラーを処理する
            if (!mapRef.current) return;
            const platform = new H.service.Platform({
                apikey: apikey,
            });
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
                zoom: 16,
                center: {
                    lat: 36.64275516956474,
                    lng: 138.18897372799648,
                },
            });

            // ウィンドウのサイズが変更された際もコードが画面全体に表示されるようにする
            window.addEventListener('resize', () =>
                map.current.getViewPort().resize()
            );

            // 地図を操作できるようにする
            const behavior = new H.mapevents.Behavior(
                new H.mapevents.MapEvents(map.current)
            );

            map.current.addLayer(defaultLayers.vector.traffic.map);

            ui.current = H.ui.UI.createDefault(map.current, defaultLayers);
        },
        // useEffectを実行する条件を指定する
        []
    );

    useEffect(() => {
        if (map.current) {
            parseRoute(selectedRoute);
            parseStop(selectedRoute);
        }
    }, [selectedRoute]);

    // 地図を表示するDiv要素を作成し返す
    return (
        <div className="map-wrap">
            <div ref={mapRef} className="map" />
            {menuVisibility && (
                <div className="dropdown">
                    <b>バス路線選択</b>
                    <Dropdown onData={handleChange} />
                    <br />
                    <b>バス停までの経路検索</b>
                    <SearchComponent buttonClick={handleSearch} />
                </div>
            )}
        </div>
    );
};

export default Map;
