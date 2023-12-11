import React, { useEffect, useRef } from 'react';
import H, { lang } from '@here/maps-api-for-javascript';
import '@here/maps-api-for-javascript/bin/mapsjs-ui.css';
import './Maps.css';

const Map = ({ layer }) => {
    const apikey = process.env.REACT_APP_HERE_API_KEY;
    // 地図を表示するHTML要素のRefを作成する
    const mapRef = React.useRef(null);
    const map = React.useRef(null);
    const ui = React.useRef(null);
    const platform = new H.service.Platform({
        apikey: apikey,
    });
    const defaultLayers = platform.createDefaultLayers({
        lg: 'ja',
    });

    // ベクタータイルのソースを設定
    const omvService = platform.getOMVService({
        path: 'v2/vectortiles/core/mc',
    });
    const baseUrl = 'https://js.api.here.com/v3/3.1/styles/omv/oslo/japan/';

    // 日本向けの地図スタイルを読み込む
    const style = new H.map.Style(`${baseUrl}normal.day.yaml`, baseUrl);

    // 背景地図のプロバイダーとレイヤーを作成
    const omvProvider = new H.service.omv.Provider(omvService, style);
    const omvlayer = new H.map.layer.TileLayer(omvProvider, {
        max: 22,
        dark: true,
    });

    // ラベルつき衛星写真
    const rasterTileService = platform.getRasterTileService({
        queryParams: {
            style: 'explore.satellite.day',
            lang: 'ja',
            size: 512,
        },
    });
    const rasterTileProvider = new H.service.rasterTile.Provider(
        rasterTileService
    );
    const rasterTileLayer = new H.map.layer.TileLayer(rasterTileProvider);

    // 簡略版衛星写真
    const liteTileService = platform.getRasterTileService({
        queryParams: {
            style: 'lite.satellite.day',
            lang: 'ja',
            size: 512,
        },
    });
    const liteTileProvider = new H.service.rasterTile.Provider(liteTileService);
    const liteTileLayer = new H.map.layer.TileLayer(liteTileProvider);

    // ラベルなし衛星写真
    const nlTileService = platform.getRasterTileService({
        queryParams: {
            style: 'satellite.day',
            size: 512,
        },
    });
    const nlTileProvider = new H.service.rasterTile.Provider(nlTileService);
    const nlTileLayer = new H.map.layer.TileLayer(nlTileProvider);

    const mapStyles = {
        satellite: rasterTileLayer,
        satelliteLite: liteTileLayer,
        satelliteNl: nlTileLayer,
        terrain: defaultLayers.raster.terrain.map,
        japan: omvlayer,
    };

    // 画面が表示された時に地図を表示する
    useEffect(
        () => {
            // 関数が最初に実行される際にmapRef.currentがnullになるので、エラーを処理する
            if (!mapRef.current) return;

            // 地図を表示
            map.current = new H.Map(mapRef.current, mapStyles[layer], {
                zoom: 12,
                center: { lat: 35.62663453879425, lng: 134.80911274749982 },
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

            showGeoJSONData();
            setUpClickListener();
        },
        // useEffectを実行する条件を指定する
        []
    );

    useEffect(() => {
        map.current.setBaseLayer(mapStyles[layer]);
    }, [layer]);

    function showGeoJSONData() {
        // GeoJSON形式のデータを読み込むための関数
        const reader = new H.data.geojson.Reader('snow.geojson', {
            // 関数が地物（ポリゴン）を検知するたびに実行される関数
            style: function (mapObject) {
                // 検知された地物（ポリゴン）の見た目を設定するための関数
                if (mapObject instanceof H.map.Polygon) {
                    mapObject.setStyle({
                        fillColor: 'rgba(255, 0, 0,0.3)',
                        strokeColor: 'rgba(255, 0, 0,0.5)',
                        lineWidth: 3,
                    });
                }
            },
        });

        // GeoJSONファイルをパースする
        reader.parse();

        // 地図上にGeoJSONデータを追加する
        map.current.addLayer(reader.getLayer());
    }

    function setUpClickListener() {
        // 地図コンポーネントがクリックされた際に呼び出される関数を設定する
        map.current.addEventListener('tap', function (evt) {
            const coord = map.current.screenToGeo(
                evt.currentPointer.viewportX,
                evt.currentPointer.viewportY
            );

            // ジオコーディングサービスを利用する
            const service = platform.getSearchService();

            // 座標から住所を検索するメソッドを呼び出す
            service.reverseGeocode(
                {
                    at: coord.lat + ',' + coord.lng,
                },
                (result) => {
                    result.items.forEach((item) => {
                        // 住所を表示する
                        ui.current.addBubble(
                            new H.ui.InfoBubble(item.position, {
                                content: item.address.label,
                            })
                        );
                    });
                },
                alert
            );
        });
    }

    // 地図を表示するDiv要素を作成し返す
    return (
        <div className="map-wrap">
            <div ref={mapRef} className="map" />
        </div>
    );
};

export default Map;
