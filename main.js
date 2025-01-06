window.addEventListener("DOMContentLoaded", init);

import * as THREE from 'three';
import { VRButton } from "three/addons/webxr/VRButton.js";
import WebXRPolyfill from "webxr-polyfill";
import { XRControllerModelFactory } from 'https://unpkg.com/three@0.150.1/examples/jsm/webxr/XRControllerModelFactory.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";


/* --------------- テキスト表示 ここから --------------- */

function createTextPlane(scene, initialText, x = 0, y = 1, z = -9, width = 5, height = 5) {
  // 1. Canvas要素を作成
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512; // 解像度を設定
  canvas.height = 512;

  // テキストを描画する関数
  function drawText(text) {
    context.clearRect(0, 0, canvas.width, canvas.height); // キャンバスをクリア

    // 背景を黒の半透明に設定
    context.fillStyle = 'rgba(0, 0, 0, 0.5)'; // 黒の半透明
    context.fillRect(0, 0, canvas.width, canvas.height); // 背景を塗りつぶす

    // テキストのスタイルを設定して描画
    context.fillStyle = 'white'; // テキスト色を白に設定
    context.font = '48px Arial'; // フォントスタイル
    context.textAlign = 'center'; // 中央揃え
    context.textBaseline = 'middle'; // 中央基準
    context.fillText(text, canvas.width / 2, canvas.height / 2); // テキストを描画
  }

  // 初期テキストを描画
  drawText(initialText);

  // 2. CanvasをThree.jsのTextureに変換
  const texture = new THREE.CanvasTexture(canvas);

  // 3. 板のジオメトリとマテリアルを作成
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: texture, // Canvasの内容をマテリアルとして使用
    transparent: true, // 透明を有効化
  });

  const plane = new THREE.Mesh(geometry, material);
  plane.position.set(x, y, z); // 板の位置を設定
  scene.add(plane); // シーンに追加

  // 動的に文字列を変更する関数を返す
  return (newText) => {
    drawText(newText); // 新しいテキストをCanvasに描画
    texture.needsUpdate = true; // テクスチャを更新
  };
}


// / テキストを描画するためのキャンバスを作成
// const canvas3 = document.createElement('canvas');
// const context3 = canvas3.getContext('2d');
// context3.font = '100px Arial';
// context3.fillStyle = 'white';
// context3.fillText("配列 : ", 0, 150); // 高さのテキスト

// // CanvasTextureを作成し、Spriteを作成（最初に一度だけ）
// const texture3 = new THREE.CanvasTexture(canvas3);
// const spriteMaterial3 = new THREE.SpriteMaterial({
//   map: texture3,
//   side: THREE.DoubleSide,  // 両面描画
//   depthTest: false,         // 深度テストを無効に
//   depthWrite: false         // 深度書き込みを無効に
// });
// const sprite3 = new THREE.Sprite(spriteMaterial3);
// sprite3.position.set(0, 1, -8.5);

// function addTransparentPlane(scene, x = 0, y = 0, z = 0, width = 5, height = 5, color = 0x0000ff, opacity = 0.5) {
//   // 板のジオメトリ（幅と高さを指定）
//   const geometry = new THREE.PlaneGeometry(width, height);
//   // 半透明なマテリアルを作成
//   const material = new THREE.MeshBasicMaterial({
//     color: color, // 板の色
//     transparent: true, // 透明設定を有効化
//     opacity: opacity, // 半透明度
//   });
//   // 板のメッシュを作成
//   const plane = new THREE.Mesh(geometry, material);
//   // 板の位置を設定
//   plane.position.set(x, y, z);
//   // シーンに板を追加
//   scene.add(plane);
// }

/* --------------- テキスト表示 ここまで --------------- */


//ファイル名宣言
// const fileName = "bio-CE-CX300.csv";
const fileName = "cora.csv";
//スクイーズボタンで手前に移動する距離の大きさ
var movePositionZ = 30;
//削除回数
let deleteTimes = 15;
// ノード座標を保持する配列
let nodePositions = [];
let networkData;


function init() {
  /* --------------- 基本的な設定 ここから --------------- */
  // WebXRのポリフィルを有効にする
  const polyfill = new WebXRPolyfill();

  // サイズを指定
  const width = window.innerWidth;
  const height = window.innerHeight;

  // シーンの作成
  const scene = new THREE.Scene();

  //　背景の色
  scene.background = new THREE.Color(0xffffff);
  // scene.background = new THREE.Color(0x000050);

  // グループの準備
  const group = new THREE.Group();
  scene.add(group);

  // レンダラーの作成
  let renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.xr.enabled = true; // レンダラーのXRを有効化
  document.body.appendChild(renderer.domElement);
  // WebVRの開始ボタンをDOMに追加
  document.body.appendChild(VRButton.createButton(renderer));

  // カメラを作成
  const camera = new THREE.PerspectiveCamera(90, width / height);
  // カメラの初期位置を設定
  camera.position.z = 10;

  // カメラ用コンテナを作成
  const cameraContainer = new THREE.Object3D();
  cameraContainer.add(camera);
  scene.add(cameraContainer);
  cameraContainer.position.x = 0;

  /* --------------- 基本的な設定 ここまで --------------- */



  /* --------------- 光源設定 ここから --------------- */
  // 光源を作成
  createLights(scene);

  // 光源を作成する関数
  function createLights(scene) {
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    //光源を作成
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 0, 1);  //  three.jsは座標系が左右(x)、上下(y)、前後(z)
    light.castShadow = true;
    scene.add(light);
  }
  /* --------------- 光源設定 ここまで --------------- */



  /* -------------------コントローラー設定 ここから------------------- */

  // コントローラーファクトリーの準備
  const controllerModelFactory = new XRControllerModelFactory();

  // コントローラーの光線の準備
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -1),
  ]);
  //const material= new THREE.LineBasicMaterial({color: 0xff0000});
  //const line = new THREE.Line(geometry , material);
  const line = new THREE.Line(geometry);
  line.name = "line";
  line.scale.z = 10;

  // コントローラーの追加
  function addController(index) {
    // コントローラーの追加
    const controller = renderer.xr.getController(index);
    scene.add(controller);

    // コントローラーモデルの追加
    const controllerGrip = renderer.xr.getControllerGrip(index);
    controllerGrip.add(
      controllerModelFactory.createControllerModel(controllerGrip)
    );
    scene.add(controllerGrip);

    // コントローラーの光線の追加
    controller.add(line.clone());
    return controller;
  }

  // コントローラーの準備
  const controller0 = addController(0);
  const controller1 = addController(1);

  // コントローラーのイベントリスナーの追加

  //0のほうがGoLive上では右手、実機では左手
  controller0.addEventListener('selectstart', onSelectStart,);
  controller0.addEventListener('selectend', onSelectEnd);
  controller0.addEventListener('squeezestart', onSqueezeStart);
  controller0.addEventListener('squeezeend', onSqueezeEnd);

  //1のほうがGoLive上では左手、実機では右手
  controller1.addEventListener('selectstart', onSelectStart,);
  controller1.addEventListener('selectend', onSelectEnd);
  controller1.addEventListener('squeezestart', onSqueezeStart);
  controller1.addEventListener('squeezeend', onSqueezeEnd);

  // トリガーを押した時に呼ばれる
  function onSelectStart(event) {
    const controller = event.target;
    // レイと交差しているシェイプの取得
    const intersections = getIntersections(controller);
    // シェイプをコントローラにアタッチし、シェイプを青くする
    if (intersections.length > 0) {
      const intersection = intersections[0];
      const object = intersection.object;

      // 動かす前の座標を保存
      const originalPosition = { x: object.position.x, y: object.position.y, z: object.position.z };

      // シェイプを青く光らせる
      object.material.emissive.b = 1;

      // オブジェクトの座標をコントローラーにアタッチ
      controller.attach(object);

      // コントローラーのユーザーデータに選択されたオブジェクトを保存
      controller.userData.selected = object;

      // オブジェクトが動かされたときの処理
      // nodePositionsに動く前の座標と同じものがあれば、動いた後の座標に変更する
      //・・・つまりnodePositions配列からコントローラーで選択しているノードを選び出す＝そのために座標が一致しているものを探すってこど？
      const matchingIndex = nodePositions.findIndex(node => (
        node.x === originalPosition.x && node.y === originalPosition.y && node.z === originalPosition.z
      ));
      if (matchingIndex !== -1) {
        // オブジェクトの座標を更新
        nodePositions[matchingIndex] = object.position;
        // nodePositions[matchingIndex] = object.position.set(0, 0, -10);
      }

      //ノードとエッジを消す
      clearScene();
      //変更されたノードの位置を再描画
      renderNetwork(networkData, group, camera, renderer, nodePositions);
    }
  }

  //選択したノードと隣接しているノードの移動処理
  // function updateCoordinatesForNeighbors(selectedNode, adjacencyMap, nodePositions) {
  //   // 選択したノードの隣接ノードを取得
  //   const neighbors = adjacencyMap[selectedNode];

  //   if (!neighbors) {
  //     console.warn("選択したノードが見つからないか、隣接ノードが存在しません。");
  //     return;
  //   }

  //   // 隣接ノードの座標を変更
  //   neighbors.forEach(neighbor => {
  //     if (nodePositions[neighbor]) {
  //       nodePositions[neighbor].z += movePositionZ;
  //     } else {
  //       console.warn(`ノード ${neighbor} の座標情報が存在しません。`);
  //     }
  //   });
  // }

  var frontX = -4;
  var frontZ = 0;

  function onSqueezeStart(event) {
    const controller = event.target;
    // レイと交差しているシェイプの取得
    const intersections = getIntersections(controller);
    // シェイプをコントローラにアタッチし、シェイプを青くする
    if (intersections.length > 0) {
      const intersection = intersections[0];
      const object = intersection.object;

      // 動かす前の座標を保存
      const originalPosition = { x: object.position.x, y: object.position.y, z: object.position.z };

      // シェイプを青く光らせる
      object.material.emissive.b = 1;

      if (object.position.z >= -20) {
        const matchingIndex = nodePositions.findIndex(node => (
          node.x === originalPosition.x && node.y === originalPosition.y && node.z === originalPosition.z
        ));
        if (matchingIndex !== -1) {

        }

        toggleEdgesVisibility(false);

      } else {

        // オブジェクトが動かされたときの処理
        // nodePositionsに動く前の座標と同じものがあれば、動いた後の座標に変更する
        const matchingIndex = nodePositions.findIndex(node => (
          node.x === originalPosition.x && node.y === originalPosition.y && node.z === originalPosition.z
        ));
        if (matchingIndex !== -1) {

          nodePositions[matchingIndex].x = frontX;
          nodePositions[matchingIndex].y = 0;
          nodePositions[matchingIndex].z = -5 - frontZ;
        }

        frontX += 2;

        if (frontX > 4) {
          frontX = -4;
          frontZ += 2;
        }
        toggleEdgesVisibility(false);
      }

      //ノードとエッジを消す
      clearScene();
      //変更されたノードの位置を再描画
      renderNetwork(networkData, group, camera, renderer, nodePositions);

      // シェイプをグループにアタッチし、シェイプの色を戻す
      if (controller.userData.selected !== undefined) {
        const object = controller.userData.selected;
        // object.material.emissive.b = 0;//
        group.attach(object);
        controller.userData.selected = undefined;
      }
    }
  }

  // トリガーを離した時に呼ばれる
  function onSelectEnd(event) {
    const controller = event.target;

    // シェイプをグループにアタッチし、シェイプの色を戻す
    if (controller.userData.selected !== undefined) {
      const object = controller.userData.selected;
      object.material.emissive.b = 0;
      group.attach(object);
      controller.userData.selected = undefined;
    }
  }

  function onSqueezeEnd(event) {

  }

  // レイと交差しているシェイプの一覧
  const intersected = [];

  // シェイプとコントローラのレイの交差判定のクリア
  function cleanIntersected() {
    while (intersected.length) {
      const object = intersected.pop();
      object.material.emissive.r = 0;
    }
  }

  // シェイプとコントローラのレイの交差判定
  function intersectObjects(controller) {
    // 選択時は無処理
    if (controller.userData.selected !== undefined) return;

    // 光線の取得
    const line = controller.getObjectByName("line");

    // レイと交差しているシェイプの取得
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {
      // 交差時は赤くする
      const intersection = intersections[0];
      const object = intersection.object;
      object.material.emissive.r = 1;
      intersected.push(object);

      // 交差時は光線の長さをシェイプまでにする
      line.scale.z = intersection.distance;
    } else {
      // 光線の長さを固定長に戻す
      line.scale.z = 1000;
    }
  }

  // ワーク行列
  const tempMatrix = new THREE.Matrix4();

  // レイキャスターの準備
  const raycaster = new THREE.Raycaster();

  // レイと交差しているシェイプの取得
  function getIntersections(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return raycaster.intersectObjects(group.children, false);
  }

  //コントローラーイベントの処理
  function handleController(controller) {
    const userData = controller.userData;
    if (userData.isSelecting === true) {
      // コントローラーボタンが押された際の処理
      console.log("コントローラーボタンが押された");
    }
  }

  /* -------------------コントローラー設定 ここまで------------------- */


  /* -------------------ファイル読み込み ここから------------------- */
  loadCSVAndInit(fileName);

  // CSVファイルの読み込みとシーンの初期化
  function loadCSVAndInit(name) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", name, true);
    xhr.onreadystatechange = function () {
      // XMLHttpRequestの状態が変わるたびに呼ばれるコールバック
      if (xhr.readyState == 4) {
        // リクエストが成功した場合
        if (xhr.status == 200) {
          // CSVデータを解析してエッジ情報を取得
          networkData = parseCSV(xhr.responseText);
          generateNodePositions(networkData, nodePositions);
          if (networkData) {
            // ネットワークのノードとエッジを描画
            renderNetwork(networkData, group, camera, renderer, nodePositions);
          } else {
            console.error('Invalid CSV file format');
          }
        } else {
          console.error('Error loading the CSV file');
        }
      }
    };
    xhr.send();
  }

  var edges = []; //グローバル変数に変更　本来は↓のコメントアウトされているものを使う

  function parseCSV(content) {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes(',')) {
        console.warn("無効な行をスキップ:", line); // 無効行を無視
        continue;
      }
      const [source, target] = trimmed.split(',');
      if (source && target) {
        edges.push({
          source: parseInt(source),
          target: parseInt(target)
        });
      }
    }
    return edges.length > 0 ? edges : null;
  }
  /* -------------------ファイル読み込み ここまで------------------- */


  /* -------------------ノードの座標生成 ここから------------------- */
  let radiusP = 40; //球面座標系の半径、原点からの距離
  let phi = Math.PI / 2; //縦方向の回転。角度はラジアンで指定。
  let theta = Math.PI; //水平方向の回転。角度はラジアンで指定。

  let positionC1 = 0;
  let positionC2 = 0;

  function createPositions() {
    //座標を生成

    const position = {
      x: radiusP * Math.sin(phi) * Math.cos(theta),
      y: radiusP * Math.cos(phi) - 5,
      z: radiusP * Math.sin(phi) * Math.sin(theta)
    };
    positionC1 += 0.3;
    if (positionC1 >= 30) {
      positionC1 = 0;
      positionC2 += 1;
    }
    theta = Math.PI + (Math.PI / 30) * positionC1;
    phi = Math.PI / 2 - (Math.PI / 100) * (positionC2 + 1);  //30は横の個数


    // 生成したノードの座標を配列に追加
    nodePositions.push(position);
    // 生成したノードの座標を返す
    return position;
  }


  // 座標を生成して nodePositions 配列に追加する関数
  function generateNodePositions(edgesData, nodePosition) {
    const uniqueNodes = new Set();
    const nodePositions = new Map();

    // グラフのノードとエッジを作成
    edgesData.forEach(edge => {
      uniqueNodes.add(edge.source);
      uniqueNodes.add(edge.target);
    });

    // 各ノードの座標を保存
    uniqueNodes.forEach(node => {
      const position = createPositions();
      nodePositions.set(node, position);
    });

  }
  /* -------------------座標生成 ここまで------------------- */



  /* -------------------エッジ生成 ここから------------------- */
  function createEdge(sourcePosition, targetPosition) {
    // ここにエッジの描画処理を追加
    const geometry = new THREE.BufferGeometry().setFromPoints([sourcePosition, targetPosition]);
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const edge = new THREE.Line(geometry, material);
    edge.castShadow = true; //
    scene.add(edge);
  }

  function renderEdges(edgesData, scene, nodePositions) {
    edgesData.forEach(edge => {
      const sourcePosition = nodePositions[edge.source];
      const targetPosition = nodePositions[edge.target];

      if (sourcePosition && targetPosition) {
        createEdge(sourcePosition, targetPosition);
      }
    });
  }

  function toggleEdgesVisibility(visible) {
    edges.forEach(edge => {
      edge.visible = visible; // visible プロパティを設定
    });
  }
  /* -------------------エッジ生成 ここまで------------------- */


  /* -------------------グリッドの生成 ここから------------------- */

  const size = 500; // グリッド全体のサイズ
  const divisions = 20; // マス目の数
  const mainColor = 0x000000; // メインラインの色
  const subColor = 0x555555;  // 補助ライン

  const gridHelper = new THREE.GridHelper(size, divisions, mainColor, subColor);
  gridHelper.position.set(0, -30, 0);
  scene.add(gridHelper);
  const gridHelper2 = new THREE.GridHelper(size, divisions, mainColor, subColor);
  gridHelper2.position.set(0, 200, 0);
  scene.add(gridHelper2);
  /* -------------------グリッドの生成 ここまで------------------- */

  /* -------------------垂直線の生成 ここから------------------- */
  function createVerticalLine(x, z, color) {
    const points = [
      new THREE.Vector3(x, -30, z),    // 始点
      new THREE.Vector3(x, 200, z) // 終点
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: color });
    return new THREE.Line(geometry, material);
  }

  // 4本の垂直線を作成
  const line1 = createVerticalLine(-250, -250, 0x555555);
  const line2 = createVerticalLine(250, -250, 0x555555);
  const line3 = createVerticalLine(-250, 250, 0x555555);
  const line4 = createVerticalLine(250, 250, 0x555555);

  // シーンに追加
  scene.add(line1);
  scene.add(line2);
  scene.add(line3);
  scene.add(line4);
  /* -------------------垂直線の生成 ここまで------------------- */

  /* -------------------本棚の生成 ここから------------------- */

  // カーブした棚板を作成する関数
  function createCurvedShelf(radius, width, depth, yPosition, segments) {
    const shelfGroup = new THREE.Group(); // 棚板グループを作成

    const angleStep = Math.PI / segments; // セグメントごとの角度
    for (let i = 0; i <= segments; i++) {
      const angle = -Math.PI / 2 + i * angleStep - Math.PI / 2; // 半円分の範囲 (-90度から90度)

      // 棚板の各セクションの位置
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);

      // 各セクションの棚板を作成
      const geometry = new THREE.BoxGeometry(width, 0.5, depth);
      const material = new THREE.MeshStandardMaterial({ color: 0x8b5533 }); // 木材色
      const section = new THREE.Mesh(geometry, material);

      section.position.set(x, yPosition, z); // 配置
      section.rotation.y = -angle; // 回転でカーブに沿わせる
      shelfGroup.add(section); // グループに追加
    }

    return shelfGroup;
  }

  // 支柱を作成する関数
  function createColumn(height, radius, positionX, positionZ) {
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, height, 32); // 支柱のサイズ
    const material = new THREE.MeshStandardMaterial({ color: 0x8b5533 }); // 木材色
    const column = new THREE.Mesh(geometry, material);
    column.position.set(positionX, height / 2, positionZ + 1); // 配置
    return column;
  }

  // 本棚全体を作成する関数
  function createBookshelf(radius, width, depth, height, levels, segments) {
    const bookshelf = new THREE.Group(); // 本棚全体のグループ

    // 各棚板を配置
    for (let i = 0; i < levels; i++) {
      const yPosition = i * (height / (levels - 1)); // 高さを均等に配置
      const shelf = createCurvedShelf(radius, width, depth, yPosition, segments);
      bookshelf.add(shelf);
    }

    // 支柱を追加
    const column1 = createColumn(height, 0.3, radius, 0); // 右側
    const column2 = createColumn(height, 0.3, -radius, 0); // 左側
    bookshelf.add(column1);
    bookshelf.add(column2);

    return bookshelf;
  }

  // 本棚を作成してシーンに追加
  const bookshelf = createBookshelf(40, 3, 5, 40, 28, 100); // 半径, 幅, 奥行き, 高さ, 段, 分割
  scene.add(bookshelf);
  bookshelf.position.set(0, -5, 0);


  /* -------------------本棚の生成 ここまで------------------- */

  /* -------------------机の生成 ここから------------------- */

  function createDesk() {
    const deskGroup = new THREE.Group(); // 机全体をまとめるグループ

    // 天板
    const deskTopGeometry = new THREE.BoxGeometry(20, 0.5, 7); // 幅、高さ、奥行
    const deskTopMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 }); // 木材っぽい色
    const deskTop = new THREE.Mesh(deskTopGeometry, deskTopMaterial);
    deskTop.position.set(0, -1, -8); // 天板の高さを設定
    deskTop.castShadow = true; // 影を落とす
    deskTop.receiveShadow = true; // 影を受け取る
    deskGroup.add(deskTop);

    // 脚の作成
    const legGeometry = new THREE.BoxGeometry(0.5, 4, 0.5); // 幅、高さ、奥行
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });

    // 脚の位置を設定
    const legPositions = [
      { x: -8, y: -3, z: -10 }, // 左前
      { x: -8, y: -3, z: -6 },  // 左後
      { x: 8, y: -3, z: -10 },  // 右前
      { x: 8, y: -3, z: -6 },   // 右後
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(pos.x, pos.y, pos.z);
      leg.castShadow = true; // 影を落とす
      leg.receiveShadow = true; // 影を受け取る
      deskGroup.add(leg);
    });

    // グループ全体をシーンに追加
    scene.add(deskGroup);
  }

  createDesk();
  // scene.add(sprite3);

  /* -------------------机の生成 ここまで------------------- */

  /* -------------------ノード（本）の生成 ここから------------------- */
  function renderNetwork(edgesData, group, camera, renderer, nodePositions) {
    // ノードを作成
    var adjacencyMap = createAdjacencyMap(edgesData);
    var nodeCount = 0;
    //console.log(adjacencyMap);
    Object.values(nodePositions).forEach((position, index) => {
      //ノードのジオメトリを作成
      let geometry;
      //ノードのマテリアルを作成
      let material;

      geometry = new THREE.BoxGeometry(0.2, 1.5, 0.5);
      material = new THREE.MeshLambertMaterial({ color: 0x822025 });


      const node = new THREE.Mesh(geometry, material);
      node.position.set(position.x, position.y, position.z);
      node.rotation.y = (Math.PI / 2) + (Math.PI / 100) * nodeCount;
      nodeCount += 1;
      if (nodeCount > 100) {
        nodeCount = 0;
      }
      group.add(node);
    });

    // エッジを作成
    renderEdges(edgesData, scene, nodePositions);


  }
  /* -------------------ノード（本）の生成 ここまで------------------- */



  /* ------------------- 隣接リストを作成 ここから------------------- */
  function createAdjacencyMap(edgesData) {
    const adjacencyMap = new Array(nodePositions.length).fill(null).map(() => []);
    edgesData.forEach(edge => {
      // console.log(adjacencyMap[edge.source], adjacencyMap[edge.target]);

      if (!adjacencyMap[edge.source]) {
        adjacencyMap[edge.source] = [];
      }
      adjacencyMap[edge.source].push(edge.target);
      if (!adjacencyMap[edge.target]) {
        adjacencyMap[edge.target] = [];
      }
      adjacencyMap[edge.target].push(edge.source);
    });
    return adjacencyMap;
  }
  /* ------------------- 隣接リストを作成 ここまで------------------- */



  /* ------------------- リサイズ処理 ここから------------------- */
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  /* ------------------- リサイズ処理 ここまで------------------- */


  /* -------------------ノード、エッジ削除 ここから------------------- */
  function clearScene() {
    // シーン内のすべての子要素（オブジェクト）を削除
    //1回で全削除されないため(deleteTimes)回繰り返し　⇛　なんで？？？
    for (let i = 0; i < deleteTimes; i++) {
      // シーンにあるMesh、Lineをクリア
      scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          scene.remove(child);
        }
      });

      // グループにあるMesh、Lineをクリア
      group.children.forEach((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          group.remove(child);
        }
      });
    }

    // 再描画
    scene.add(gridHelper);
    scene.add(gridHelper2);
    scene.add(line1);
    scene.add(line2);
    scene.add(line3);
    scene.add(line4);
    renderer.render(scene, camera);
  }
  /* -------------------ノード、エッジ削除 ここまで------------------- */


  // フレーム毎に実行されるループイベント
  function tick() {
    cleanIntersected();
    intersectObjects(controller0);
    intersectObjects(controller1);

    handleController(controller0);
    handleController(controller1);
  }

  // レンダリングループ
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
    tick();
  });

  toggleEdgesVisibility(false);
  // リサイズ処理
  createTextPlane(scene);
  window.addEventListener("resize", onResize);

}
