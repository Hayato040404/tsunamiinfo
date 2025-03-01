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

    // APIまたはテストデータから情報を更新
    updateTsunamiInfo();
}

// 津波予報区の表示
function displayTsunamiRegions(geojsonData) {
    L.geoJSON(geojsonData, {
        style: function(feature) {
            return {
                fillColor: getColorForRegion(feature.properties.grade),
                weight: 2,
                opacity: 1,
                color: 'black',
                fillOpacity: 0.7
            };
        },
        onEachFeature: function(feature, layer) {
            layer.bindPopup(createPopupContent(feature.properties));
        }
    }).addTo(map);
}

// 地域の色を決定（例: Warningは赤、Watchは黄色）
function getColorForRegion(grade) {
    switch(grade) {
        case 'Warning': return 'red';
        case 'Watch': return 'yellow';
        default: return 'gray';
    }
}

// ポップアップの内容を生成
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

// APIまたはテストデータから津波情報を取得
function updateTsunamiInfo() {
    let url = testMode ? null : 'https://api.p2pquake.net/v2/history?codes=552&limit=1';

    let data = testMode ? {
        "areas": [
            {
                "grade": "Warning",
                "name": "福島県",
                "maxHeight": { "value": 3, "description": "３ｍ" },
                "firstHeight": { "condition": "津波到達中と推測" }
            },
            {
                "grade": "Watch",
                "name": "青森県太平洋沿岸",
                "maxHeight": { "value": 1, "description": "１ｍ" },
                "firstHeight": { "arrivalTime": "2019/06/18 22:40:00" }
            }
        ]
    } : null;

    if (testMode) {
        processTsunamiData(data);
    } else {
        fetch(url)
            .then(response => response.json())
            .then(data => processTsunamiData(data[0].areas))
            .catch(error => console.error('APIエラー:', error));
    }
}

// 津波データを処理して地図に反映
function processTsunamiData(areas) {
    areas.forEach(area => {
        // ここでGeoJSONの各フィーチャを更新（例: 色やポップアップの内容）
        console.log(`Processing area: ${area.name}, Grade: ${area.grade}, Max Height: ${area.maxHeight.value}m`);
    });
}

// テストモードのトグル
function toggleTestMode() {
    testMode = document.getElementById('testMode').checked;
    updateTsunamiInfo(); // モード変更時にデータを再読み込み
}

// ページロード時に地図を初期化
window.onload = initializeMap;
