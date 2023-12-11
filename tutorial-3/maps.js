const apiKey = {Your-api-key};

const platform = new H.service.Platform({
    apikey: apiKey,
});

const omvService = platform.getOMVService({
    path: 'v2/vectortiles/core/mc',
});
const baseUrl = 'https://js.api.here.com/v3/3.1/styles/omv/oslo/japan/';

// 日本専用の地図スタイルを導入
const style = new H.map.Style(`${baseUrl}normal.day.yaml`, baseUrl);

// 背景地図として日本の地図データでレイヤを作成
const omvProvider = new H.service.omv.Provider(omvService, style);
const omvlayer = new H.map.layer.TileLayer(omvProvider, {
    max: 22,
});

// 地図表示を実装
const map = new H.Map(document.getElementById('map'), omvlayer, {
    zoom: 10,
    center: { lat: 35.6, lng: 139.7 },
});

// 地図のズームイン・ズームアウトを実装
const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

// リアルタイム交通状況を表示
// const defaultLayers = platform.createDefaultLayers();
// map.addLayer(defaultLayers.vector.traffic.map);

// 住所検索用の関数
function getGeocoder() {
    const val = document.querySelector('#geocoder').value;
    const service = platform.getSearchService();
    service.geocode(
        {
            q: val,
        },
        (result) => {
            // 地図から既存のマーカーを削除する
            if (map.getObjects().length > 0) {
                map.getObjects().forEach((i) => {
                    if (i.getRemoteId().includes('marker')) {
                        map.removeObject(i);
                    }
                });
            }
            // 各位置のマーカーを追加する
            result.items.forEach((item, index) => {
                const marker = new H.map.Marker(item.position);
                marker.setRemoteId('marker' + index);

                map.addObject(marker);
            });
        },
        alert
    );
}

// 施設検索用の関数
function landmarkGeocode() {
    var geocoder = platform.getSearchService(),
        landmarkGeocodingParameters = {
            q: document.querySelector('#landmark').value,
            at: [map.getCenter().lat, map.getCenter().lng],
            // in: 'circle:35.465289833745494,139.6227303930109;r=5000',
            // in: 'bbox:135.4798009,34.6656617,135.510439,34.7048287',
            limit: 5,
        };

    geocoder.discover(landmarkGeocodingParameters, addLocationsToMap, onError);
}

// エラーが発生した場合の処理
function onError(error) {
    alert("Can't reach the remote server");
}

// APIの結果が返される際の関数
function addLocationsToMap(result) {
    const locations = result.items;

    // 地図から既存のマーカーを削除する
    if (map.getObjects().length > 0) {
        map.getObjects().forEach((i) => {
            if (i.getRemoteId().includes('discover')) {
                map.removeObject(i);
            }
        });
    }

    // APIの結果にマーカーを追加する
    for (let i = 0; i < locations.length; i += 1) {
        let location = locations[i];
        marker = new H.map.Marker(location.position);
        marker.setRemoteId('discover' + i.toString());
        map.addObject(marker);
    }
}

// 経路検索用の関数
function getRouting() {
    let origin;
    let destination;

    const onError = (error) => {
        console.log(error.message);
    };

    // 経路検索APIを呼び出し
    const router = platform.getRoutingService(null, 8);

    // APIのリスポンスを処理するためのコールバック関数
    const onResult = function (result) {
        // 経路が検索されていることを確保
        if (result.routes.length) {
            // 既存の経路を削除する
            if (map.getObjects().length > 0) {
                const id_list = ['route', 'start', 'dest'];
                map.getObjects().forEach((i) => {
                    if (id_list.includes(i.getRemoteId())) {
                        map.removeObject(i);
                    }
                });
            }

            result.routes[0].sections.forEach((section) => {
                // 経路をLinestring方式に変換する
                const linestring = H.geo.LineString.fromFlexiblePolyline(
                    section.polyline
                );

                // 経路をPolyline形式に変換
                const routeLine = new H.map.Polyline(linestring, {
                    style: {
                        strokeColor: 'blue',
                        lineWidth: 3,
                    },
                });

                // 出発地のマーカー
                const startMarker = new H.map.Marker(
                    section.departure.place.location
                );

                // 目的地のマーカー
                const endMarker = new H.map.Marker(
                    section.arrival.place.location
                );

                routeLine.setRemoteId('route');
                startMarker.setRemoteId('start');
                endMarker.setRemoteId('dest');

                // マーカーとPolylineを地図上に追加する
                map.addObjects([routeLine, startMarker, endMarker]);
            });
        }
    };

    const routingParameters = {
        transportMode: 'car',
        // 経路がリスポンスから返されるようにする
        return: 'polyline',
    };

    // 経路を計算するコールバック関数
    const calculateRoute = () => {
        // 出発地と到着地点の両方が入力されていることを確保
        if (!origin || !destination) return;

        // 出発地と目的地を検索パラメーターに追加
        routingParameters.origin = origin;
        routingParameters.destination = destination;

        router.calculateRoute(routingParameters, onResult, onError);
    };

    // 住所検索サービスを取得
    const service = platform.getSearchService();

    // 出発地の住所検索
    service.geocode(
        {
            q: document.querySelector('#start').value,
        },
        (result) => {
            origin =
                result.items[0].position.lat +
                ',' +
                result.items[0].position.lng;
            calculateRoute();
        },
        onError
    );

    // 目的地の住所検索
    service.geocode(
        {
            q: document.querySelector('#goal').value,
        },
        (result) => {
            destination =
                result.items[0].position.lat +
                ',' +
                result.items[0].position.lng;
            calculateRoute();
        },
        onError
    );
}
