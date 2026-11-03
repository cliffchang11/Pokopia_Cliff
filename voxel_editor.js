/**
 * Pokopia Voxel Editor & Delta Store
 * 體素手動編輯器核心：差異覆蓋 (Delta Overrides)、歷史復原 (Undo/Redo)、左右鏡像對稱、3D 射線拾取與互動
 */

(function (global) {
  'use strict';

  // 儲存各角色的修改歷史與 overrides
  const _state = {
    activeCharacter: 'ivysaur',
    characters: {
      bulbasaur: { overrides: {}, history: [], redoStack: [] },
      ivysaur: { overrides: {}, history: [], redoStack: [] },
      venusaur: { overrides: {}, history: [], redoStack: [] },
      buzz: { overrides: {}, history: [], redoStack: [] }
    },
    // 編輯器設定
    editorMode: false, // 是否處於編輯模式
    tool: 'rotate', // 'rotate' | 'paint' | 'delete' | 'add' | 'eyedropper'
    selectedBid: 1, // 當前選擇的材質 ID
    mirrorSymmetry: true, // 是否開啟左右鏡像對稱
    listeners: []
  };

  function getBaseData(charKey) {
    if (charKey === 'bulbasaur' && typeof BULBASAUR_VOXEL_DATA !== 'undefined') return BULBASAUR_VOXEL_DATA;
    if (charKey === 'ivysaur' && typeof IVYSAUR_VOXEL_DATA !== 'undefined') return IVYSAUR_VOXEL_DATA;
    if (charKey === 'venusaur' && typeof VENUSAUR_VOXEL_DATA !== 'undefined') return VENUSAUR_VOXEL_DATA;
    if (charKey === 'buzz' && typeof BUZZ_VOXEL_DATA !== 'undefined') return BUZZ_VOXEL_DATA;
    return null;
  }

  function getSymmetryX(x, charKey) {
    const base = getBaseData(charKey);
    if (!base || !base.dimensions) return null;
    const w = base.dimensions.width;
    // 鏡像點：例如寬度 99 (0~98)，則 30 對稱 68 (98 - 30)
    return w - 1 - x;
  }

  // 查詢原始模型在 (x, y, z) 的方塊 bid，若無方塊則回傳 -1
  function getOriginalBid(charKey, x, y, z) {
    const base = getBaseData(charKey);
    if (!base || !base.layers) return -1;
    const targetLayer = base.layers.find(l => l.layerIndex === (y + 1));
    if (!targetLayer) return -1;
    const blk = targetLayer.blocks.find(b => b[0] === x && b[1] === z);
    return blk ? blk[2] : -1;
  }

  // 查詢當前 (包含 overrides) 在 (x, y, z) 的方塊 bid
  function getEffectiveBid(charKey, x, y, z) {
    const char = _state.characters[charKey];
    const key = `${x},${y},${z}`;
    if (char && char.overrides && char.overrides[key] !== undefined) {
      return char.overrides[key];
    }
    return getOriginalBid(charKey, x, y, z);
  }

  // 套用單一或成對 (鏡像) 變更
  function applyChanges(charKey, changes) {
    const char = _state.characters[charKey];
    if (!char) return;

    const historyRecord = [];
    changes.forEach(({ x, y, z, newBid }) => {
      const oldEffective = getEffectiveBid(charKey, x, y, z);
      if (oldEffective === newBid) return; // 無實質變化

      const key = `${x},${y},${z}`;
      const origBid = getOriginalBid(charKey, x, y, z);

      historyRecord.push({
        x, y, z,
        prevStored: char.overrides[key],
        oldEffective,
        newBid,
        origBid
      });

      if (newBid === origBid) {
        delete char.overrides[key];
      } else {
        char.overrides[key] = newBid;
      }
    });

    if (historyRecord.length > 0) {
      char.history.push(historyRecord);
      char.redoStack = []; // 清空重做堆疊
      notifyListeners(charKey);
    }
  }

  // 執行編輯動作（塗色、新增、消除）
  function executeVoxelAction(charKey, x, y, z, action, targetBid) {
    const changes = [];
    let bidToApply = -1;

    if (action === 'delete') {
      bidToApply = -1;
    } else if (action === 'paint') {
      bidToApply = targetBid !== undefined ? targetBid : _state.selectedBid;
    } else if (action === 'add') {
      bidToApply = targetBid !== undefined ? targetBid : _state.selectedBid;
    }

    changes.push({ x, y, z, newBid: bidToApply });

    // 檢查鏡像對稱
    if (_state.mirrorSymmetry) {
      const symX = getSymmetryX(x, charKey);
      if (symX !== null && symX !== x) {
        changes.push({ x: symX, y, z, newBid: bidToApply });
      }
    }

    applyChanges(charKey, changes);
  }

  // 撤銷 (Undo)
  function undo(charKey) {
    const char = _state.characters[charKey];
    if (!char || char.history.length === 0) return false;

    const lastRecord = char.history.pop();
    const redoRecord = [];

    lastRecord.forEach(item => {
      const key = `${item.x},${item.y},${item.z}`;
      redoRecord.push({
        x: item.x,
        y: item.y,
        z: item.z,
        prevStored: char.overrides[key],
        oldEffective: getEffectiveBid(charKey, item.x, item.y, item.z),
        newBid: item.newBid,
        origBid: item.origBid
      });

      if (item.prevStored === undefined) {
        delete char.overrides[key];
      } else {
        char.overrides[key] = item.prevStored;
      }
    });

    char.redoStack.push(redoRecord);
    notifyListeners(charKey);
    return true;
  }

  // 重做 (Redo)
  function redo(charKey) {
    const char = _state.characters[charKey];
    if (!char || char.redoStack.length === 0) return false;

    const recordToRedo = char.redoStack.pop();
    const historyRecord = [];

    recordToRedo.forEach(item => {
      const key = `${item.x},${item.y},${item.z}`;
      const oldEffective = getEffectiveBid(charKey, item.x, item.y, item.z);
      historyRecord.push({
        x: item.x,
        y: item.y,
        z: item.z,
        prevStored: char.overrides[key],
        oldEffective,
        newBid: item.newBid,
        origBid: item.origBid
      });

      if (item.newBid === item.origBid) {
        delete char.overrides[key];
      } else {
        char.overrides[key] = item.newBid;
      }
    });

    char.history.push(historyRecord);
    notifyListeners(charKey);
    return true;
  }

  // 恢復官方原版預設值
  function resetToDefault(charKey) {
    const char = _state.characters[charKey];
    if (!char) return;
    char.overrides = {};
    char.history = [];
    char.redoStack = [];
    notifyListeners(charKey);
  }

  // 載入外部 overrides (例如來自 Firebase 或 LocalStorage)
  function loadOverrides(charKey, overridesObj) {
    const char = _state.characters[charKey];
    if (!char) return;
    char.overrides = overridesObj ? { ...overridesObj } : {};
    char.history = [];
    char.redoStack = [];
    notifyListeners(charKey);
  }

  // 取得目前 overrides 物件
  function getOverrides(charKey) {
    const char = _state.characters[charKey];
    return char ? { ...char.overrides } : {};
  }

  // 計算並產生套用 Overrides 後的有效體素資料庫
  function getEffectiveVoxelData(charKey) {
    const base = getBaseData(charKey);
    if (!base) return null;
    const char = _state.characters[charKey];
    const overrides = (char && char.overrides) ? char.overrides : {};

    if (Object.keys(overrides).length === 0) {
      return base;
    }

    const layerMap = new Map();
    base.layers.forEach(layer => {
      const y = layer.layerIndex - 1;
      const blockMap = new Map();
      layer.blocks.forEach(([x, z, bid]) => {
        blockMap.set(`${x},${z}`, bid);
      });
      layerMap.set(y, blockMap);
    });

    Object.entries(overrides).forEach(([coordStr, bid]) => {
      const [x, y, z] = coordStr.split(',').map(Number);
      if (!layerMap.has(y)) {
        layerMap.set(y, new Map());
      }
      const bMap = layerMap.get(y);
      if (bid === -1) {
        bMap.delete(`${x},${z}`);
      } else {
        bMap.set(`${x},${z}`, bid);
      }
    });

    const newLayers = [];
    let totalBlocks = 0;
    const maxLayer = base.dimensions.height;

    for (let y = 0; y < maxLayer; y++) {
      const bMap = layerMap.get(y);
      const blocks = [];
      if (bMap) {
        bMap.forEach((bid, xz) => {
          const [x, z] = xz.split(',').map(Number);
          blocks.push([x, z, bid]);
        });
      }
      blocks.sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
      const materials = {};
      blocks.forEach(([,, bid]) => {
        materials[bid] = (materials[bid] || 0) + 1;
      });
      newLayers.push({
        layerIndex: y + 1,
        blocks,
        materials
      });
      totalBlocks += blocks.length;
    }

    return {
      ...base,
      totalBlocks,
      layers: newLayers
    };
  }

  function addChangeListener(callback) {
    if (typeof callback === 'function') {
      _state.listeners.push(callback);
    }
  }

  function notifyListeners(charKey) {
    _state.listeners.forEach(cb => {
      try {
        cb(charKey, getOverrides(charKey));
      } catch (e) {
        console.error('VoxelDeltaStore listener error:', e);
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Three.js 互動拾取引擎 (ThreeEditorEngine)
  // ─────────────────────────────────────────────────────────

  function createEditorToolbarDOM(charKey, baseData, onAction) {
    const wrap = document.createElement('div');
    wrap.className = 'voxel-editor-container';
    wrap.id = `voxelToolbar_${charKey}`;

    // 建立調色盤色票 HTML
    const palette = baseData && baseData.palette ? baseData.palette : {};
    let paletteHtml = '';
    const bids = Object.keys(palette);
    if (bids.length > 0 && !_state.selectedBid) {
      _state.selectedBid = Number(bids[0]);
    }

    bids.forEach(bid => {
      const item = palette[bid];
      const isSelected = Number(bid) === Number(_state.selectedBid);
      paletteHtml += `
        <button type="button" class="ve-color-dot ${isSelected ? 'active' : ''}" data-bid="${bid}" title="${item.name || '方塊'}" style="background-color: ${item.color};">
        </button>
      `;
    });

    wrap.innerHTML = `
      <!-- 右上角精簡開關膠囊按鈕 (預設常駐，零遮擋模型) -->
      <button type="button" class="ve-toggle-capsule" id="veToggleBtn_${charKey}" title="開啟 / 收合 3D 體素手動編輯器">
        🛠️ 體素編輯
      </button>

      <!-- 展開的編輯工具面板 (預設隱藏) -->
      <div class="voxel-editor-toolbar ve-hidden" id="vePanel_${charKey}">
        <div class="ve-toolbar-header">
          <span class="ve-header-title">🛠️ 體素工坊</span>
          <button type="button" class="ve-close-btn" id="veCloseBtn_${charKey}" title="收合面板">✖ 收合</button>
        </div>

        <div class="ve-toolbar-inner">
          <div class="ve-tool-group">
            <button type="button" class="ve-btn ${!_state.editorMode ? 'active' : ''}" data-tool="rotate" title="視角旋轉 (可拖曳視角)">
              🖐️ 旋轉
            </button>
            <button type="button" class="ve-btn ${_state.editorMode && _state.tool === 'paint' ? 'active' : ''}" data-tool="paint" title="塗色 (修改方塊材質)">
              🎨 塗色
            </button>
            <button type="button" class="ve-btn ${_state.editorMode && _state.tool === 'delete' ? 'active' : ''}" data-tool="delete" title="消除 (刪除點擊的方塊)">
              🧹 消除
            </button>
            <button type="button" class="ve-btn ${_state.editorMode && _state.tool === 'add' ? 'active' : ''}" data-tool="add" title="新增 (在點擊面上堆疊方塊)">
              ➕ 新增
            </button>
            <button type="button" class="ve-btn ${_state.editorMode && _state.tool === 'eyedropper' ? 'active' : ''}" data-tool="eyedropper" title="吸管 (吸取模型上的方塊材質)">
              🧪 吸管
            </button>
          </div>

          <div class="ve-divider"></div>

          <div class="ve-action-group">
            <button type="button" class="ve-btn ${_state.mirrorSymmetry ? 'active' : ''}" id="btnMirror_${charKey}" title="左右鏡像對稱編輯">
              🪞 鏡像: ${_state.mirrorSymmetry ? '開' : '關'}
            </button>
            <button type="button" class="ve-btn" id="btnUndo_${charKey}" title="撤銷上一步">
              ↩️ 撤銷
            </button>
            <button type="button" class="ve-btn" id="btnRedo_${charKey}" title="重做">
              ↪️ 重做
            </button>
            <button type="button" class="ve-btn ve-btn-danger" id="btnReset_${charKey}" title="清除自訂修改，恢復官方預設值">
              🔄 恢復預設
            </button>
            <button type="button" class="ve-btn ve-btn-primary" id="btnSubmit_${charKey}" title="永久存檔 (同步雲端與本地)">
              ☁️ 提交存檔
            </button>
          </div>
        </div>

        <!-- 調色盤色票列 -->
        <div class="ve-palette-bar" id="vePaletteBar_${charKey}">
          <span class="ve-palette-label">材質:</span>
          <div class="ve-palette-dots">
            ${paletteHtml}
          </div>
        </div>
      </div>
    `;

    return wrap;
  }

  function bindThreeRaycaster(charKey, threeState, baseData, canvasWrap) {
    if (!threeState || !threeState.renderer || !canvasWrap) return;

    const canvas = threeState.renderer.domElement;
    const raycaster = (typeof THREE !== 'undefined') ? new THREE.Raycaster() : null;
    const mouse = (typeof THREE !== 'undefined') ? new THREE.Vector2() : null;

    let downPos = { x: 0, y: 0 };
    let downTime = 0;

    canvas.addEventListener('pointerdown', (e) => {
      downPos = { x: e.clientX, y: e.clientY };
      downTime = Date.now();
    });

    canvas.addEventListener('pointerup', (e) => {
      if (!_state.editorMode || _state.tool === 'rotate') return;

      const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
      const duration = Date.now() - downTime;

      // 若拖曳距離超過 5px 或長按超過 400ms，判定為視角旋轉，不進行編輯
      if (dist > 5 || duration > 400) return;

      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, threeState.camera);

      // 同時檢驗原版 InstancedMesh 與動態新增網格
      const targets = [];
      if (threeState.instancedMesh) targets.push(threeState.instancedMesh);
      if (threeState.dynamicAddedGroup && threeState.dynamicAddedGroup.children.length > 0) {
        targets.push(...threeState.dynamicAddedGroup.children);
      }
      if (targets.length === 0) return;

      const intersects = raycaster.intersectObjects(targets, false);
      if (!intersects || intersects.length === 0) return;

      const hit = intersects[0];
      const cx = baseData.dimensions.width / 2;
      const cy = baseData.dimensions.height / 2;
      const cz = baseData.dimensions.length / 2;

      let voxelX, voxelY, voxelZ;

      if (hit.object && hit.object.userData && hit.object.userData.isDynamic) {
        // 點擊到動態新增的方塊
        voxelX = hit.object.userData.voxelX;
        voxelY = hit.object.userData.voxelY;
        voxelZ = hit.object.userData.voxelZ;
      } else {
        // 點擊到原版 InstancedMesh 方塊
        const instanceId = hit.instanceId;
        if (instanceId === undefined || instanceId === null) return;
        const blockInfo = threeState.blockDataList ? threeState.blockDataList[instanceId] : null;
        if (!blockInfo) return;
        voxelX = Math.round(blockInfo.posX + cx);
        voxelY = Math.round(blockInfo.posY + cy);
        voxelZ = Math.round(blockInfo.posZ + cz);
      }

      if (_state.tool === 'eyedropper') {
        const effBid = getEffectiveBid(charKey, voxelX, voxelY, voxelZ);
        if (effBid !== -1) {
          _state.selectedBid = effBid;
          _state.tool = 'paint';
          updateToolbarUI(charKey);
        }
        return;
      }

      if (_state.tool === 'paint') {
        executeVoxelAction(charKey, voxelX, voxelY, voxelZ, 'paint', _state.selectedBid);
      } else if (_state.tool === 'delete') {
        executeVoxelAction(charKey, voxelX, voxelY, voxelZ, 'delete');
      } else if (_state.tool === 'add') {
        // 取得點選面的法向量
        const normal = hit.face ? hit.face.normal : { x: 0, y: 1, z: 0 };
        const newX = voxelX + Math.round(normal.x);
        const newY = voxelY + Math.round(normal.y);
        const newZ = voxelZ + Math.round(normal.z);
        executeVoxelAction(charKey, newX, newY, newZ, 'add', _state.selectedBid);
      }

      // 即時重新同步 Three.js 實例與動態增補網格
      syncThreeMeshFromOverrides(charKey, threeState, baseData);
    });
  }

  // 依據 overrides 即時更新 Three.js InstancedMesh 與動態增補網格
  function syncThreeMeshFromOverrides(charKey, threeState, baseData) {
    if (!threeState || !threeState.instancedMesh || !threeState.blockDataList) return;

    const mesh = threeState.instancedMesh;
    const blockList = threeState.blockDataList;
    const dummy = (typeof THREE !== 'undefined') ? new THREE.Object3D() : null;
    const color = (typeof THREE !== 'undefined') ? new THREE.Color() : null;
    const cx = baseData.dimensions.width / 2;
    const cy = baseData.dimensions.height / 2;
    const cz = baseData.dimensions.length / 2;

    // 1. 同步原版方塊的顏色與刪除縮放
    blockList.forEach(item => {
      const vx = Math.round(item.posX + cx);
      const vy = Math.round(item.posY + cy);
      const vz = Math.round(item.posZ + cz);

      const bid = getEffectiveBid(charKey, vx, vy, vz);

      if (bid === -1) {
        dummy.position.set(item.posX, item.posY, item.posZ);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(item.index, dummy.matrix);
      } else {
        dummy.position.set(item.posX, item.posY, item.posZ);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(item.index, dummy.matrix);

        const pItem = (baseData.palette && baseData.palette[bid]) ? baseData.palette[bid] : { color: '#00a8c8' };
        color.set(pItem.color);
        mesh.setColorAt(item.index, color);
      }
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // 2. 同步「自訂動態增補網格 (Dynamic Added Mesh)」
    if (typeof THREE !== 'undefined') {
      if (!threeState.dynamicAddedGroup) {
        threeState.dynamicAddedGroup = new THREE.Group();
        threeState.scene.add(threeState.dynamicAddedGroup);
      }

      // 清空舊的動態增補方塊
      while (threeState.dynamicAddedGroup.children.length > 0) {
        const obj = threeState.dynamicAddedGroup.children[0];
        threeState.dynamicAddedGroup.remove(obj);
        if (obj.geometry && obj.geometry !== mesh.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }

      // 檢查所有 overrides 中屬於「新增方塊」者
      const overrides = getOverrides(charKey);
      const geom = mesh.geometry || new THREE.BoxGeometry(1, 1, 1);

      Object.entries(overrides).forEach(([coordStr, bid]) => {
        if (bid !== -1) {
          const [x, y, z] = coordStr.split(',').map(Number);
          // 若原版沒有此方塊，代表是使用者/鏡像手動新增的方塊！
          if (getOriginalBid(charKey, x, y, z) === -1) {
            const pItem = (baseData.palette && baseData.palette[bid]) ? baseData.palette[bid] : { color: '#00a8c8' };
            const mat = new THREE.MeshStandardMaterial({
              color: pItem.color,
              roughness: 0.88,
              metalness: 0.0
            });
            const cube = new THREE.Mesh(geom, mat);
            cube.position.set(x - cx, y - cy, z - cz);
            cube.scale.set(1, 1, 1);
            cube.userData = { voxelX: x, voxelY: y, voxelZ: z, isDynamic: true };
            threeState.dynamicAddedGroup.add(cube);
          }
        }
      });
    }
  }

  function updateToolbarUI(charKey) {
    const bar = document.getElementById(`voxelToolbar_${charKey}`);
    if (!bar) return;

    // 工具按鈕 active
    bar.querySelectorAll('.ve-tool-group .ve-btn').forEach(btn => {
      const tool = btn.getAttribute('data-tool');
      if (tool === 'rotate') {
        btn.classList.toggle('active', !_state.editorMode || _state.tool === 'rotate');
      } else {
        btn.classList.toggle('active', _state.editorMode && _state.tool === tool);
      }
    });

    // 鏡像按鈕
    const btnMirror = document.getElementById(`btnMirror_${charKey}`);
    if (btnMirror) {
      btnMirror.classList.toggle('active', _state.mirrorSymmetry);
      btnMirror.innerHTML = `🪞 鏡像: ${_state.mirrorSymmetry ? '開' : '關'}`;
    }

    // 色票 active
    bar.querySelectorAll('.ve-color-dot').forEach(dot => {
      const bid = Number(dot.getAttribute('data-bid'));
      dot.classList.toggle('active', bid === Number(_state.selectedBid));
    });
  }

  function attachEditorToScene(charKey, threeState, baseData, canvasWrap, onSubmitCallback) {
    if (!canvasWrap || !threeState) return;

    // 檢查或建立懸浮工具列容器
    let container = document.getElementById(`voxelToolbar_${charKey}`);
    if (!container) {
      container = createEditorToolbarDOM(charKey, baseData);
      canvasWrap.style.position = 'relative';
      canvasWrap.appendChild(container);

      const toggleBtn = container.querySelector(`#veToggleBtn_${charKey}`);
      const panel = container.querySelector(`#vePanel_${charKey}`);
      const closeBtn = container.querySelector(`#veCloseBtn_${charKey}`);

      // 開關面板
      if (toggleBtn && panel) {
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = panel.classList.contains('ve-hidden');
          panel.classList.toggle('ve-hidden', !isHidden);
          if (isHidden) {
            _state.editorMode = true;
            if (_state.tool === 'rotate') _state.tool = 'paint';
            updateToolbarUI(charKey);
          } else {
            _state.editorMode = false;
            _state.tool = 'rotate';
          }
        });
      }

      if (closeBtn && panel) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          panel.classList.add('ve-hidden');
          _state.editorMode = false;
          _state.tool = 'rotate';
          updateToolbarUI(charKey);
        });
      }

      // 事件綁定
      panel.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        // 工具切換
        if (target.hasAttribute('data-tool')) {
          const t = target.getAttribute('data-tool');
          _state.tool = t;
          _state.editorMode = (t !== 'rotate');
          updateToolbarUI(charKey);
          return;
        }

        // 選擇材質色票
        if (target.hasAttribute('data-bid')) {
          _state.selectedBid = Number(target.getAttribute('data-bid'));
          if (_state.tool === 'rotate' || _state.tool === 'eyedropper' || _state.tool === 'delete') {
            _state.tool = 'paint';
            _state.editorMode = true;
          }
          updateToolbarUI(charKey);
          return;
        }

        // 鏡像切換
        if (target.id === `btnMirror_${charKey}`) {
          _state.mirrorSymmetry = !_state.mirrorSymmetry;
          updateToolbarUI(charKey);
          return;
        }

        // 撤銷
        if (target.id === `btnUndo_${charKey}`) {
          undo(charKey);
          syncThreeMeshFromOverrides(charKey, threeState, baseData);
          return;
        }

        // 重做
        if (target.id === `btnRedo_${charKey}`) {
          redo(charKey);
          syncThreeMeshFromOverrides(charKey, threeState, baseData);
          return;
        }

        // 恢復預設值
        if (target.id === `btnReset_${charKey}`) {
          if (confirm('確定要清空所有自訂修改，恢復官方原版模型嗎？')) {
            resetToDefault(charKey);
            syncThreeMeshFromOverrides(charKey, threeState, baseData);
            if (typeof onSubmitCallback === 'function') {
              onSubmitCallback(charKey, {});
            }
          }
          return;
        }

        // 提交存檔
        if (target.id === `btnSubmit_${charKey}`) {
          const overrides = getOverrides(charKey);
          if (typeof onSubmitCallback === 'function') {
            onSubmitCallback(charKey, overrides);
          }
          return;
        }
      });

      bindThreeRaycaster(charKey, threeState, baseData, canvasWrap);
    }
  }

  const VoxelDeltaStore = {
    state: _state,
    getBaseData,
    getSymmetryX,
    getOriginalBid,
    getEffectiveBid,
    executeVoxelAction,
    undo,
    redo,
    resetToDefault,
    loadOverrides,
    getOverrides,
    getEffectiveVoxelData,
    addChangeListener,
    // Three 編輯器模組
    attachEditorToScene,
    syncThreeMeshFromOverrides,
    updateToolbarUI
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoxelDeltaStore;
  } else {
    global.VoxelDeltaStore = VoxelDeltaStore;
  }
})(typeof window !== 'undefined' ? window : global);
