window.addEventListener("DOMContentLoaded", init);

import * as THREE from 'three';
import { VRButton } from "three/addons/webxr/VRButton.js";
import WebXRPolyfill from "webxr-polyfill";
import { XRControllerModelFactory } from 'https://unpkg.com/three@0.150.1/examples/jsm/webxr/XRControllerModelFactory.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";



/* --------------- テキスト表示 ここから --------------- */
function createTextPlane(scene, initialText, x, y, z, width, height) {
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
    context.font = '50px Arial'; // フォントスタイル
    context.textAlign = 'center'; // 中央揃え
    context.textBaseline = "bottom"; // 中央基準
    // context.fillText(text, canvas.width / 2, canvas.height / 2); // テキストを描画
    function drawMultilineText(context, text, x, y, lineHeight) {
      const lines = text.split("\n"); // 改行文字で分割
      lines.forEach((line, index) => {
        context.fillText(line, x, y + index * lineHeight); // 各行を描画
      });
    }

    // テキスト描画
    drawMultilineText(context, text, canvas.width / 2, 50, 30);
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
/* --------------- テキスト表示 ここまで --------------- */



/* --------------- 変数の用意 ここから --------------- */

var str = '';
//削除回数
let deleteTimes = 20;

//CSVファイルをJavaScriptで扱うために使用する変数
let networkData;

//ノードの名前、座標などの情報を保持する配列 
var nodeName = [];  //文献の名前
let nodeCrass = [];  //文献のクラスカテゴリ
let nodePositions = []; // ノード座標
let nodeInfo = [];  //上3つの変数をまとめて格納する

//nodeNameとnodePositionを格納
nodeInfo.push(nodeName, nodePositions, nodeCrass);

//表示するテキストを変更するための変数
var updateText;
var selectText;
/* --------------- 変数の用意 ここまで --------------- */





//最初に一回だけ実行される
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
  camera.position.x = 0;
  camera.position.y = 1;
  camera.position.z = 0;

  // カメラ用コンテナを作成
  const cameraContainer = new THREE.Object3D();
  cameraContainer.add(camera);
  scene.add(cameraContainer);
  cameraContainer.position.x = 0;
  /* --------------- 基本的な設定 ここまで --------------- */

  /* -------------------ファイル読み込み ここから------------------- */
  // CSVファイルの読み込みとシーンの初期化
  //1
  function loadCSVForFile2(name) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", name, true);
    xhr.onreadystatechange = function () {
      // XMLHttpRequestの状態が変わるたびに呼ばれるコールバック
      if (xhr.readyState == 4) {
        // リクエストが成功した場合
        if (xhr.status == 200) {
          // CSVデータを解析して1列目と2列目を取得
          parseCSVForFile2(xhr.responseText);
          console.log(nodeName);  // 1列目のデータ
          console.log(nodeCrass); // 2列目のデータ
        } else {
          console.error('Error loading the CSV file');
        }
      }
    };
    xhr.send();
  }

  function parseCSVForFile2(content) {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes(',')) {
        console.warn("無効な行をスキップ:", line); // 無効行を無視
        continue;
      }
      const [column1, column2] = trimmed.split(',');
      if (column1 && column2) {
        nodeName.push(column1.trim());  // 1列目をnodeNameに代入
        nodeCrass.push(column2.trim()); // 2列目をnodeCrassに代入
      }
    }
  }

  loadCSVForFile2("content.csv");
  loadCSVAndInit("cora.csv");
  //2

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

  var edges = [];

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

  /* --------------- 光源設定 ここから --------------- */
  // 光源を作成
  createLights(scene);

  // 光源を作成する関数
  function createLights(scene) {

    // ambientLightは環境光。シーンを均一に照らす。影はできない。
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    // DirectionalLightは並行光。太陽の光のように方向が決まった光。影ができる。
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1); // 光源の方向
    directionalLight.castShadow = true; // 影を有効化
    scene.add(directionalLight);

    //光源を作成
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 0, 1);
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
  const lineColor = new THREE.LineBasicMaterial({ color: 0xff2020 });
  const line = new THREE.Line(geometry, lineColor);
  line.name = "line";
  line.scale.z = 50;

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

  //左手のコントローラーのボタン処理準備　(WebXRを使用してPCのブラウザ上で操作するときは左右逆になる)
  controller0.addEventListener('selectstart', onSelectStart,);
  controller0.addEventListener('selectend', onSelectEnd);
  controller0.addEventListener('squeezestart', onSqueezeStart);
  controller0.addEventListener('squeezeend', onSqueezeEnd);

  //右手のコントローラーのボタン処理準備
  controller1.addEventListener('selectstart', onSelectStart,);
  controller1.addEventListener('selectend', onSelectEnd);
  controller1.addEventListener('squeezestart', onSqueezeStart);
  controller1.addEventListener('squeezeend', onSqueezeEnd);


  //


  // トリガーボタンを押した時の処理
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
      // material.emissive.b = 1; // 青く発光させる

      // オブジェクトの座標をコントローラーにアタッチ
      controller.attach(object);

      // コントローラーのユーザーデータに選択されたオブジェクトを保存
      controller.userData.selected = object;

      // オブジェクトが動かされたときの処理
      // nodePositionsに動く前の座標と同じものがあれば、動いた後の座標に変更する
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
  var lengthNum = 0;

  //スクイーズボタンを押したときの処理
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
      //     material.emissive.b = 1; // 青く発光させる

      if (object.position.z >= -20) {
        const matchingIndex = nodePositions.findIndex(node => (
          node.x === originalPosition.x && node.y === originalPosition.y && node.z === originalPosition.z
        ));
        if (matchingIndex !== -1) {

        }
      } else {

        // オブジェクトが動かされたときの処理
        // nodePositionsに動く前の座標と同じものがあれば、動いた後の座標に変更する
        const matchingIndex = nodePositions.findIndex(node => (
          node.x === originalPosition.x && node.y === originalPosition.y && node.z === originalPosition.z
        ));
        if (matchingIndex !== -1) {
          nodePositions[matchingIndex].x = frontX;
          nodePositions[matchingIndex].y = 0;
          nodePositions[matchingIndex].z = -6 - frontZ;
          lengthNum = matchingIndex;
        }

        frontX += 2;

        if (frontX > 4) {
          frontX = -4;
          frontZ += 2;
        }
      }


      //ノードとエッジを消す
      clearScene();
      //変更されたノードの位置を再描画
      renderNetwork(networkData, group, camera, renderer, nodePositions);

      // シェイプをグループにアタッチし、シェイプの色を戻す
      if (controller.userData.selected !== undefined) {
        const object = controller.userData.selected;
        //     material.emissive.b = 0; // 青く発光させる
        group.attach(object);
        controller.userData.selected = undefined;
      }
    }
  }

  // トリガーボタンを離した時の処理
  function onSelectEnd(event) {
    const controller = event.target;

    // シェイプをグループにアタッチし、シェイプの色を戻す
    if (controller.userData.selected !== undefined) {
      const object = controller.userData.selected;
      //     material.emissive.b = 0; // 青く発光させる
      group.attach(object);
      controller.userData.selected = undefined;
    }
  }


  //スクイーズボタンを話したときの処理
  function onSqueezeEnd(event) {
    // updateText('crass : ' + nodeInfo[2][3]);
    if (lengthNum !== 0) {
      updateText('\n\n<title>\n\n' + nodeInfo[0][lengthNum] + '\n\n\n <crass>\n\n' + nodeInfo[2][lengthNum]);
      lengthNum = 0;
    }
    toggleEdgesVisibility(true);
  }


  // レイと交差しているシェイプの一覧
  const intersected = [];

  // シェイプとコントローラのレイの交差判定のクリア
  function cleanIntersected() {
    while (intersected.length) {
      const object = intersected.pop();
      //     material.emissive.r = 0; // 青く発光させる
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
      // material.emissive.r = 1; // 発光させる
      intersected.push(object);

      const originalPosition = { x: object.position.x, y: object.position.y, z: object.position.z };

      const num = nodePositions.findIndex(node => (
        node.x === originalPosition.x && node.y === originalPosition.y && node.z === originalPosition.z
      ));
      selectText('\n\n\n<title>\n\n' + nodeInfo[0][num] + '\n\n\n <crass>\n\n' + nodeInfo[2][num]);
      // selectText('\n\n\n<title>\n\n' + '\n\n\n <crass>\n\n');
      // 交差時は光線の長さをシェイプまでにする
      line.scale.z = intersection.distance;
    } else {
      // 光線の長さを固定長に戻す
      line.scale.z = 500;
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
  }
  /* -------------------コントローラー設定 ここまで------------------- */



  /* -------------------ノードの座標生成 ここから------------------- */
  // let radiusP = 40; //球面座標系の半径、原点からの距離
  // let phi = Math.PI / 2; //縦方向の回転。角度はラジアンで指定。
  // let theta = Math.PI; //水平方向の回転。角度はラジアンで指定。

  // let positionC1 = 0;
  // let positionC2 = 0;

  // function createPositions() {

  //   //座標を生成
  //   const position = {
  //     x: radiusP * Math.sin(phi) * Math.cos(theta),
  //     y: radiusP * Math.cos(phi) - 5,
  //     z: radiusP * Math.sin(phi) * Math.sin(theta)
  //   };
  //   positionC1 += 0.3;
  //   if (positionC1 >= 30) {
  //     positionC1 = 0;
  //     positionC2 += 1;
  //   }
  //   theta = Math.PI + (Math.PI / 30) * positionC1;
  //   phi = Math.PI / 2 - (Math.PI / 100) * (positionC2 + 1);  //30は横の個数


  //   // 生成したノードの座標を配列に追加
  //   nodePositions.push(position);
  //   // 生成したノードの座標を返す
  //   return position;
  // }
  var countH = 0;
  var yPosi = 0;
  let i = 0;
  function createPositions() {
    const radius = 40;

    const angleStep = Math.PI / 100; // セグメントごとの角度
    const angle = -Math.PI / 2 + i * angleStep - Math.PI / 2; // 半円分の範囲 (-90度から90度)
    const xPosi = radius * Math.cos(angle);
    const zPosi = radius * Math.sin(angle);

    i += 1;
    if (i > 100) {
      i = 0;
    }
    countH += 1;
    if (countH > 100) {
      countH = 0;
      yPosi += 2;
    }

    const position = {
      x: xPosi,
      y: yPosi - 4,
      z: zPosi
    };

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

  // エッジを管理する配列を準備
  const edgeObjects = [];

  // function findMatchingNodes(edges, nodeName) {
  //   const matchingResults = [];

  //   for (let i = 0; i < edges.length; i++) {
  //     const source = edges[i].source;
  //     const target = edges[i].target;

  //     // source と一致する nodeName[j] を探す
  //     const sourceIndex = nodeName.indexOf(String(source));
  //     if (sourceIndex !== -1) {
  //       // target と一致する nodeName[k] を探す
  //       const targetIndex = nodeName.indexOf(String(target));
  //       if (targetIndex !== -1) {
  //         matchingResults.push({
  //           edgeIndex: i,
  //           sourceIndex: sourceIndex,
  //           targetIndex: targetIndex
  //         });
  //       }
  //     }
  //   }
  //   createEdge(nodeInfo[1][matchingResults], nodeInfo[1][i]);
  // }
  // findMatchingNodes(edges, nodeName);


  // エッジを作成する関数
  function createEdge(sourcePosition, targetPosition) {
    // エッジのジオメトリとマテリアルを作成
    const geometry = new THREE.BufferGeometry().setFromPoints([sourcePosition, targetPosition]);
    const material = new THREE.LineBasicMaterial({ color: 0x00bfff });
    const edge = new THREE.Line(geometry, material);

    // シャドウや追加設定
    edge.castShadow = true;

    // シーンに追加
    scene.add(edge);

    // エッジを管理配列に追加
    edgeObjects.push(edge);
  }

  // 複数のエッジを描画する関数   再調整
  function renderEdges(edgesData, nodeName, nodePositions) {
    edgesData.forEach(edge => {
      const sourcePosition = nodePositions[edge.source];
      const targetPosition = nodePositions[edge.target];

      console.log(sourcePosition + " and " + targetPosition);
      if (sourcePosition && targetPosition) {
        createEdge(sourcePosition, targetPosition);
      }
    });
  }


  // エッジの表示・非表示を切り替える関数
  function toggleEdgesVisibility(visible) {
    edgeObjects.forEach(edge => {
      edge.visible = visible; // trueで表示、falseで非表示
    });
  }

  // function createEdge(sourcePosition, targetPosition) {
  //   // ここにエッジの描画処理を追加
  //   const geometry = new THREE.BufferGeometry().setFromPoints([sourcePosition, targetPosition]);
  //   const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  //   const edge = new THREE.Line(geometry, material);
  //   edge.castShadow = true; //
  //   scene.add(edge);
  // }

  // function renderEdges(edgesData, scene, nodePositions) {
  //   edgesData.forEach(edge => {
  //     const sourcePosition = nodePositions[edge.source];
  //     const targetPosition = nodePositions[edge.target];

  //     if (sourcePosition && targetPosition) {
  //       createEdge(sourcePosition, targetPosition);
  //     }
  //   });
  // }

  // function toggleEdgesVisibility(visible) {
  //   edges.forEach(edge => {
  //     edge.visible = visible; // visible プロパティを設定
  //   });
  // }
  /* -------------------エッジ生成 ここまで------------------- */



  /* --------------------空間の床・壁・天井の設定 ここから------------------- */

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

  //壁になる垂直線の追加
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
  /* -------------------空間の床・壁・天井の設定 ここまで------------------- */



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
  const bookshelf = createBookshelf(40, 3, 5, 55, 27, 100); // 半径, 幅, 奥行き, 高さ, 段, 分割
  //scene.add(bookshelf);
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

  // function renderNetwork(edgesData, group, camera, renderer, nodePositions) {
  //   // ノードを作成
  //   var adjacencyMap = createAdjacencyMap(edgesData);
  //   var nodeCount = 0;
  //   var nodeNum = 0;
  //   //console.log(adjacencyMap);
  //   Object.values(nodePositions).forEach((position, index) => {
  //     //ノードのジオメトリを作成
  //     let geometry;
  //     //ノードのマテリアルを作成
  //     let material;

  //     geometry = new THREE.BoxGeometry(0.4, 1.5, 1);
  //     material = new THREE.MeshLambertMaterial({ color: 0x104010 });


  //     const node = new THREE.Mesh(geometry, material);
  //     node.position.set(position.x, position.y, position.z);
  //     //node.rotation.y = (Math.PI / 2) + (Math.PI / 100) * nodeCount;
  //     nodeCount, nodeNum += 1;
  //     nodeName.push(nodeNum);
  //     if (nodeCount > 100) {
  //       nodeCount = 0;
  //     }
  //     group.add(node);
  //   });

  //   // エッジを作成
  //   renderEdges(edgesData, scene, nodePositions);
  //   toggleEdgesVisibility(false); // 非表示

  // }

  function renderNetwork(edgesData, group, camera, renderer, nodePositions) {
    // ノードを作成
    var adjacencyMap = createAdjacencyMap(edgesData);
    var nodeCount = 0;
    var nodeNum = 0;

    Object.values(nodePositions).forEach((position, index) => {
      // ノードのジオメトリを作成
      let geometry = new THREE.BoxGeometry(0.4, 1.5, 1);

      // 文字列を描画するためのCanvasTextureを作成
      function createTextTexture(text, width = 256, height = 256) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');

        // 背景と文字のスタイル設定
        context.fillStyle = 'green'; // 背景色
        context.fillRect(0, 0, width, height);

        context.font = '30px Arial'; // フォントスタイル
        context.fillStyle = 'black'; // 文字色
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, width / 2, height / 2);

        // テクスチャとして返す
        return new THREE.CanvasTexture(canvas);
      }

      // ノードのマテリアルを作成
      let nodeNameText = nodeName[nodeNum]; // nodeName 配列の値を使用
      let textTexture = createTextTexture("ID:" + nodeNameText);
      const materials = [
        new THREE.MeshLambertMaterial({ map: textTexture }), // -X面
        new THREE.MeshLambertMaterial({ map: textTexture }), // +X面
        new THREE.MeshLambertMaterial({ color: 0xaaaaaa }), // -Y面
        new THREE.MeshLambertMaterial({ color: 0xaaaaaa }), // +Y面
        new THREE.MeshLambertMaterial({ map: textTexture }), // -Z面
        new THREE.MeshLambertMaterial({ color: 0xaaaaaa }), // +Z面（文字を描画）
      ];

      const material1 = new THREE.MeshLambertMaterial({ color: 0xff0000 });;
      const material2 = new THREE.MeshLambertMaterial({ color: 0xff4500 });;
      const material3 = new THREE.MeshLambertMaterial({ color: 0xffff00 });;
      const material4 = new THREE.MeshLambertMaterial({ color: 0x104010 });;
      const material5 = new THREE.MeshLambertMaterial({ color: 0x191970 });;
      const material6 = new THREE.MeshLambertMaterial({ color: 0x800080 });;
      const material7 = new THREE.MeshLambertMaterial({ color: 0x404040 });;

      let node;
      if (nodeCrass[nodeNum] == "Theory") {
        node = new THREE.Mesh(geometry, material1);
      } else if (nodeCrass[nodeNum] == "Rule_Learning") {
        node = new THREE.Mesh(geometry, material2);
      } else if (nodeCrass[nodeNum] == "Reinforcement_Learning") {
        node = new THREE.Mesh(geometry, material3);
      } else if (nodeCrass[nodeNum] == "Probabilistic_Methods") {
        node = new THREE.Mesh(geometry, material4);
      } else if (nodeCrass[nodeNum] == "Neural_Networks") {
        node = new THREE.Mesh(geometry, material5);
      } else if (nodeCrass[nodeNum] == "Genetic_Algorithms") {
        node = new THREE.Mesh(geometry, material6);
      } else {
        node = new THREE.Mesh(geometry, material7);
      }
      // const node = new THREE.Mesh(geometry, materials);
      node.position.set(position.x, position.y, position.z);

      nodeCount += 1;
      nodeNum += 1;
      if (nodeCount > 100) {
        nodeCount = 0;
      }

      group.add(node);
    });

    // エッジを作成   co
    renderEdges(edgesData, nodeName, nodePositions);
    toggleEdgesVisibility(false); // 非表示
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

    updateText = createTextPlane(scene, 'Loading...', -0, 1, -10, 8, 8);
    renderer.render(scene, camera);
  }
  /* -------------------ノード、エッジ削除 ここまで------------------- */


  selectText = createTextPlane(controller0, '\n\n\n\nLoading...', 0, 2, -7, 4, 4);

  // フレーム毎に実行されるループイベント
  function tick() {
    cleanIntersected();
    intersectObjects(controller0);
    intersectObjects(controller1);

    handleController(controller0);
    handleController(controller1);
  }

  toggleEdgesVisibility(false);
  // レンダリングループ
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
    tick();
  });

  // リサイズ処理
  window.addEventListener("resize", onResize);

}
