// グローバル変数
let map;
let testMode = false;

// 地図の初期化
function initializeMap() {
    map = L.map('map').setView([37.5, 138.0], 5); // 日本中央付近

    // OpenStreetMapタイルを使用
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 津波予報区のGeoJSONデータを読み込み
    fetch('data/tsunami_regions.geojson')
        .then(response => response.json())
        .then(data => {
            displayTsunamiRegions(data);
        })
        .catch(error => console.error('GeoJSONの読み込みエラー:', error));

    // テストモードの初期設定
    updateTsunamiInfo();
}

// 津波予報区の表示（海岸線に線を引く）
function displayTsunamiRegions(geojsonData) {
    L.geoJSON(geojsonData, {
        style: function(feature) {
            // テストモードまたはAPIデータに基づくスタイル
            let style = {
                color: 'gray', // デフォルトの色
                weight: 2,
                opacity: 0.7
            };

            if (testMode && feature.properties.grade === 'Warning') {
                style.color = 'pink'; // 警告区域はピンク（画像参考）
                style.weight = 5; // 太い線
            } else if (feature.properties.grade === 'Watch') {
                style.color = 'yellow';
                style.weight = 3;
            }

            return style;
        },
        onEachFeature: function(feature, layer) {
            // ポップアップに津波情報を追加
            layer.bindPopup(createPopupContent(feature.properties));
        }
    }).addTo(map);
}

// ポップアップの内容を生成（津波高さなどを表示）
function createPopupContent(properties) {
    let content = `<h3>${properties.name}</h3>`;
    if (properties.maxHeight) {
        content += `最大津波高: ${properties.maxHeight.value}m<br>`;
    }
    if (properties.firstHeight) {
        content += `初動: ${JSON.stringify(properties.firstHeight)}<br>`;
    }
    return content;
}

// ラベル（津波高さ10mなど）を追加
function addTsunamiHeightLabel(coordinates, height) {
    L.marker(coordinates, {
        icon: L.divIcon({
            className: 'tsunami-label',
            html: `<div style="background-color: pink; color: white; padding: 2px 6px; border-radius: 3px;">${height}m</div>`,
            iconSize: [60, 20]
        })
    }).addTo(map);
}

// APIまたはテストデータから津波情報を取得
function updateTsunamiInfo() {
    let data = testMode ? {
        "areas": [
            {
                "grade": "Warning",
                "name": "福島県",
                "maxHeight": { "value": 10, "description": "10m" },
                "firstHeight": { "condition": "津波到達中と推測" },
                "coordinates": [37.75, 140.47] // 例: 福島県の海岸線座標
            },
            {
                "grade": "Watch",
                "name": "青森県太平洋沿岸",
                "maxHeight": { "value": 10, "description": "10m" },
                "firstHeight": { "arrivalTime": "2019/06/18 22:40:00" },
                "coordinates": [41.33, 141.35] // 例: 青森県の海岸線座標
            }
        ]
    } : null;

    if (testMode) {
        processTsunamiData(data.areas);
    } else {
        fetch('https://api.p2pquake.net/v2/history?codes=552&limit=1')
            .then(response => response.json())
            .then(data => processTsunamiData(data[0].areas))
            .catch(error => console.error('APIエラー:', error));
    }
}

// 津波データを処理して地図に反映（線とラベルを追加）
function processTsunamiData(areas) {
    areas.forEach(area => {
        // 対応するGeoJSONフィーチャを特定してスタイルを更新（簡略化のため、ここでは仮定）
        if (area.grade === 'Warning') {
            // ピンクの太線を海岸線に追加（GeoJSONのfeatureに基づく）
            let coastline = findCoastlineByName(area.name, map); // 名前で海岸線を検索
            if (coastline) {
                coastline.setStyle({
                    color: 'pink',
                    weight: 5,
                    opacity: 1
                });
            }

            // 津波高さのラベルを追加
            if (area.coordinates && area.maxHeight) {
                addTsunamiHeightLabel(area.coordinates, area.maxHeight.value);
            }
        }
    });
}

// 名前から海岸線フィーチャを検索（簡略化のため仮の関数）
function findCoastlineByName(name, map) {
    // 実際にはGeoJSONのfeature.properties.nameで検索
    // ここでは仮の実装（実際のGeoJSONデータを確認して調整が必要）
    let layers = map._layers;
    for (let key in layers) {
        if (layers[key].feature && layers[key].feature.properties.name === name) {
            return layers[key];
        }
    }
    return null;
}

// テストモードのトグル
function toggleTestMode() {
    testMode = document.getElementById('testMode').checked;
    // 既存のレイヤーをクリア
    map.eachLayer(layer => {
        if (layer instanceof L.GeoJSON) {
            map.removeLayer(layer);
        }
    });
    // 地図を再描画
    displayTsunamiRegions(); // GeoJSONを再読み込み
    updateTsunamiInfo(); // データも更新
}

// ページロード時に地図を初期化
window.onload = initializeMap;
