/**
 * Pokopia Voxel Editor & Delta Store
 * 體素手動編輯器核心：差異覆蓋 (Delta Overrides)、歷史復原 (Undo/Redo)、左右鏡像對稱、3D 射線拾取與互動
 */

(function (global) {
  'use strict';

  let _lastLocalActionTime = 0; // 記錄最近一次本地操作時間，用於阻斷 onSnapshot 舊資料回彈
  const MAX_HISTORY_STEPS = 10; // 嚴格限制最多 10 步復原與重做

  // 本地持久化存取 (防重整或未登入丟失)
  function saveOverridesToStorage(charKey, customTime) {
    try {
      const now = customTime || Date.now();
      if (_state.characters[charKey]) {
        _state.characters[charKey].updatedAt = now;
      }
      if (typeof localStorage !== 'undefined') {
        const storageKey = 'pokopia_voxel_overrides_' + charKey;
        const timeKey = 'pokopia_voxel_time_' + charKey;
        localStorage.setItem(storageKey, JSON.stringify(getOverrides(charKey)));
        localStorage.setItem(timeKey, String(now));
      }
    } catch (e) {
      console.warn('[VoxelStore] LocalStorage save error:', e);
    }
  }

  function loadTimeFromStorage(charKey) {
    try {
      if (typeof localStorage !== 'undefined') {
        const timeKey = 'pokopia_voxel_time_' + charKey;
        const raw = localStorage.getItem(timeKey);
        if (raw) return Number(raw);
      }
    } catch (e) {}
    return 0;
  }

  function loadOverridesFromStorage(charKey) {
    try {
      if (typeof localStorage !== 'undefined') {
        const storageKey = 'pokopia_voxel_overrides_' + charKey;
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return parsed.data !== undefined ? parsed.data : parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[VoxelStore] LocalStorage load error:', e);
    }
    return {};
  }

  let _cloudDebounceTimer = null;
  function updateAutoSaveBadgeUI(charKey, status) {
    if (typeof document === 'undefined') return;
    const badges = document.querySelectorAll(`[id="autoSaveBadge_${charKey}"], .ve-autosave-badge`);
    badges.forEach(b => {
      const dot = b.querySelector('.ve-autosave-dot');
      const text = b.querySelector('.ve-autosave-text');
      if (status === 'saving') {
        b.classList.add('saving');
        if (text) text.textContent = '同步中...';
      } else {
        b.classList.remove('saving');
        if (text) text.textContent = '已自動保存 ✓';
      }
    });
  }

  function syncOverridesToCloud(charKey) {
    if (typeof window === 'undefined') return;
    updateAutoSaveBadgeUI(charKey, 'saving');
    if (_cloudDebounceTimer) clearTimeout(_cloudDebounceTimer);
    _cloudDebounceTimer = setTimeout(() => {
      const charTime = (_state.characters[charKey] && _state.characters[charKey].updatedAt) || Date.now();
      if (window.PokopiaFirebase && typeof window.PokopiaFirebase.saveVoxelOverrides === 'function') {
        window.PokopiaFirebase.saveVoxelOverrides(charKey, getOverrides(charKey), charTime);
      }
      updateAutoSaveBadgeUI(charKey, 'saved');
    }, 500);
  }

  // 儲存各角色的修改歷史與 overrides
  const _state = {
    activeCharacter: 'ivysaur',
    characters: {
      bulbasaur: { overrides: loadOverridesFromStorage('bulbasaur'), updatedAt: loadTimeFromStorage('bulbasaur'), history: [], redoStack: [] },
      ivysaur: { overrides: loadOverridesFromStorage('ivysaur'), updatedAt: loadTimeFromStorage('ivysaur'), history: [], redoStack: [] },
      venusaur: { overrides: loadOverridesFromStorage('venusaur'), updatedAt: loadTimeFromStorage('venusaur'), history: [], redoStack: [] },
      buzz: { overrides: loadOverridesFromStorage('buzz'), updatedAt: loadTimeFromStorage('buzz'), history: [], redoStack: [] }
    },
    // 編輯器設定
    editorMode: false, // 是否處於編輯模式
    tool: 'rotate', // 'rotate' | 'paint' | 'delete' | 'add' | 'eyedropper' | 'select'
    selectedBid: 1, // 當前選擇的材質 ID
    mirrorSymmetry: true, // 是否開啟左右鏡像對稱
    selectedVoxels: new Set(), // 儲存選取的方塊座標集合 'x,y,z'
    hoverVoxel: null, // 儲存當前滑鼠懸停資訊 { x, y, z, symX, charKey }
    listeners: []
  };

  function getBaseData(charKey) {
    if (charKey === 'bulbasaur' && typeof BULBASAUR_VOXEL_DATA !== 'undefined') return BULBASAUR_VOXEL_DATA;
    if (charKey === 'ivysaur' && typeof IVYSAUR_VOXEL_DATA !== 'undefined') return IVYSAUR_VOXEL_DATA;
    if (charKey === 'venusaur' && typeof VENUSAUR_VOXEL_DATA !== 'undefined') return VENUSAUR_VOXEL_DATA;
    if (charKey === 'buzz' && typeof BUZZ_VOXEL_DATA !== 'undefined') return BUZZ_VOXEL_DATA;
    return null;
  }

  const _charBounds = {};

  // 取得角色模型實體的真實幾何邊界與對稱中心
  function getCharBounds(charKey) {
    if (_charBounds[charKey]) return _charBounds[charKey];
    const base = getBaseData(charKey);
    if (!base) return null;
    let minX = Infinity, maxX = -Infinity;
    if (base.layers) {
      for (let i = 0; i < base.layers.length; i++) {
        const blks = base.layers[i].blocks;
        for (let j = 0; j < blks.length; j++) {
          const bx = blks[j][0];
          if (bx < minX) minX = bx;
          if (bx > maxX) maxX = bx;
        }
      }
    }
    if (minX === Infinity) {
      const w = base.dimensions ? base.dimensions.width : 0;
      minX = 0;
      maxX = Math.max(0, w - 1);
    }
    _charBounds[charKey] = { minX, maxX, sum: minX + maxX, center: (minX + maxX) / 2 };
    return _charBounds[charKey];
  }

  // 精準真實幾何對稱軸計算 (如妙蛙草以 x = 50 為軸心，x=51 對稱於 x=49)
  function getSymmetryX(x, charKey) {
    const bounds = getCharBounds(charKey);
    if (!bounds) return null;
    return bounds.sum - x;
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
      if (char.history.length > MAX_HISTORY_STEPS) {
        char.history.shift(); // 先進先出淘汰最舊步驟，維持最多 10 步
      }
      char.redoStack = []; // 清空重做堆疊
      _lastLocalActionTime = Date.now();
      const affectedCoords = historyRecord.map(h => ({ x: h.x, y: h.y, z: h.z }));
      notifyListeners(charKey, false, affectedCoords);
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

  // 選取多個方塊（切換或加入）
  function selectVoxel(charKey, x, y, z, toggle = true) {
    const key = `${x},${y},${z}`;
    if (!_state.selectedVoxels) _state.selectedVoxels = new Set();
    if (toggle && _state.selectedVoxels.has(key)) {
      _state.selectedVoxels.delete(key);
      if (_state.mirrorSymmetry) {
        const symX = getSymmetryX(x, charKey);
        if (symX !== null && symX !== x) _state.selectedVoxels.delete(`${symX},${y},${z}`);
      }
    } else {
      _state.selectedVoxels.add(key);
      if (_state.mirrorSymmetry) {
        const symX = getSymmetryX(x, charKey);
        if (symX !== null && symX !== x) _state.selectedVoxels.add(`${symX},${y},${z}`);
      }
    }
    notifyListeners(charKey);
  }

  // 區域矩形範圍框選
  function selectRegion(charKey, x1, y1, z1, x2, y2, z2, append = true) {
    if (!_state.selectedVoxels || !append) _state.selectedVoxels = new Set();
    const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
    const minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);

    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          const bid = getEffectiveBid(charKey, x, y, z);
          if (bid !== -1) {
            _state.selectedVoxels.add(`${x},${y},${z}`);
            if (_state.mirrorSymmetry) {
              const symX = getSymmetryX(x, charKey);
              if (symX !== null && symX !== x) {
                const symBid = getEffectiveBid(charKey, symX, y, z);
                if (symBid !== -1) _state.selectedVoxels.add(`${symX},${y},${z}`);
              }
            }
          }
        }
      }
    }
    notifyListeners(charKey);
  }

  // 清空選取狀態
  function clearSelection(charKey) {
    if (_state.selectedVoxels) _state.selectedVoxels.clear();
    notifyListeners(charKey || _state.activeCharacter);
  }

  // 批次套用動作（上色或消除，聚合為單一複合 Undo 歷史）
  function applyBatchAction(charKey, action, targetBid) {
    if (!_state.selectedVoxels || _state.selectedVoxels.size === 0) return 0;
    const bidToApply = (action === 'delete') ? -1 : (targetBid !== undefined ? targetBid : _state.selectedBid);
    const changes = [];

    _state.selectedVoxels.forEach(coordKey => {
      const [x, y, z] = coordKey.split(',').map(Number);
      changes.push({ x, y, z, newBid: bidToApply });
    });

    applyChanges(charKey, changes);
    return changes.length;
  }

  // 一鍵當前切片層鏡像同步 (左鏡右 或 右鏡左)
  function mirrorCurrentLayer(charKey, layerIndex, direction) {
    const bounds = getCharBounds(charKey);
    if (!bounds) return 0;
    const center = bounds.center;
    const y = layerIndex - 1;

    const base = getBaseData(charKey);
    if (!base) return 0;
    const targetLayer = base.layers ? base.layers.find(l => l.layerIndex === layerIndex) : null;
    const coordsSet = new Set();
    if (targetLayer && targetLayer.blocks) {
      targetLayer.blocks.forEach(b => coordsSet.add(`${b[0]},${b[1]}`));
    }
    const overrides = getOverrides(charKey);
    Object.keys(overrides).forEach(k => {
      const parts = k.split(',').map(Number);
      if (parts[1] === y) {
        coordsSet.add(`${parts[0]},${parts[2]}`);
      }
    });

    const isLtoR = (direction === 'left-to-right');
    const allXCoords = new Set();
    coordsSet.forEach(coordStr => {
      const [x, z] = coordStr.split(',').map(Number);
      allXCoords.add(`${x},${z}`);
      const symX = getSymmetryX(x, charKey);
      if (symX !== null) {
        allXCoords.add(`${symX},${z}`);
      }
    });

    const changes = [];

    allXCoords.forEach(coordStr => {
      const [x, z] = coordStr.split(',').map(Number);
      const symX = getSymmetryX(x, charKey);
      if (symX === null || symX === x) return;

      if (isLtoR) {
        if (x < center) {
          const srcBid = getEffectiveBid(charKey, x, y, z);
          const tgtBid = getEffectiveBid(charKey, symX, y, z);

          if (srcBid !== -1) {
            if (tgtBid === -1) {
              changes.push({ x: symX, y, z, newBid: srcBid });
            }
          } else {
            if (tgtBid !== -1) {
              changes.push({ x: symX, y, z, newBid: -1 });
            }
          }
        }
      } else {
        if (x > center) {
          const srcBid = getEffectiveBid(charKey, x, y, z);
          const tgtBid = getEffectiveBid(charKey, symX, y, z);

          if (srcBid !== -1) {
            if (tgtBid === -1) {
              changes.push({ x: symX, y, z, newBid: srcBid });
            }
          } else {
            if (tgtBid !== -1) {
              changes.push({ x: symX, y, z, newBid: -1 });
            }
          }
        }
      }
    });

    if (changes.length > 0) {
      applyChanges(charKey, changes);
    }
    return changes.length;
  }

  // 記錄懸停位置以供幽靈預覽
  function setHoverVoxel(charKey, x, y, z) {
    if (x === null || x === undefined) {
      _state.hoverVoxel = null;
    } else {
      const symX = _state.mirrorSymmetry ? getSymmetryX(x, charKey) : null;
      _state.hoverVoxel = { x, y, z, symX: (symX !== x ? symX : null), charKey };
    }
    notifyListeners(charKey);
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
    if (char.redoStack.length > MAX_HISTORY_STEPS) {
      char.redoStack.shift();
    }
    _lastLocalActionTime = Date.now();
    const affectedCoords = redoRecord.map(h => ({ x: h.x, y: h.y, z: h.z }));
    notifyListeners(charKey, false, affectedCoords);
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
    if (char.history.length > MAX_HISTORY_STEPS) {
      char.history.shift();
    }
    _lastLocalActionTime = Date.now();
    const affectedCoords = historyRecord.map(h => ({ x: h.x, y: h.y, z: h.z }));
    notifyListeners(charKey, false, affectedCoords);
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

  // 跨視窗/跨分頁 0 毫秒即塗即現廣播通訊器 (Cross-Window Realtime Sync)
  const SYNC_CHANNEL_NAME = 'pokopia_voxel_sync_v1';
  let _syncChannel = null;
  const _attachedThreeScenes = {};

  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      _syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      _syncChannel.onmessage = function (e) {
        const msg = e.data;
        if (!msg || msg.type !== 'VOXEL_DELTA_SYNC' || !msg.charKey) return;
        handleRemoteOverridesSync(msg.charKey, msg.overrides);
      };
    }
  } catch (_) {}

  // 跨視窗 StorageEvent 降級備用支援
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', function (e) {
      if (e.key === 'pokopia_voxel_storage_sync_v1' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload && payload.charKey && payload.overrides) {
            handleRemoteOverridesSync(payload.charKey, payload.overrides);
          }
        } catch (_) {}
      }
    });
  }

  function broadcastVoxelDelta(charKey, overrides) {
    const data = overrides || getOverrides(charKey);
    if (_syncChannel) {
      try {
        _syncChannel.postMessage({
          type: 'VOXEL_DELTA_SYNC',
          charKey: charKey,
          overrides: data,
          senderTime: Date.now()
        });
      } catch (_) {}
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pokopia_voxel_storage_sync_v1', JSON.stringify({
          charKey: charKey,
          overrides: data,
          t: Date.now()
        }));
      }
    } catch (_) {}
  }

  function handleRemoteOverridesSync(charKey, remoteOverrides) {
    const char = _state.characters[charKey];
    if (!char) return;
    char.overrides = { ...(remoteOverrides || {}) };

    // 觸發本地更新 (skipBroadcast = true 避免回音循環)
    notifyListeners(charKey, true);
  }

  function notifyListeners(charKey, skipBroadcast = false, affectedCoords = null) {
    // 1. 同步當前視窗此角色的 3D 模型 (定向局部極速同步)
    if (_attachedThreeScenes[charKey]) {
      const { threeState, baseData } = _attachedThreeScenes[charKey];
      syncThreeMeshFromOverrides(charKey, threeState, baseData, affectedCoords);
    }

    // 2. 廣播給其他視窗 (即塗即現跨視窗同步)
    if (!skipBroadcast) {
      broadcastVoxelDelta(charKey, getOverrides(charKey));
    }

    // 3. 通知監聽器 (刷新 2D 切片網格與材料統計)
    _state.listeners.forEach(cb => {
      try {
        cb(charKey, getOverrides(charKey));
      } catch (e) {
        console.error('VoxelDeltaStore listener error:', e);
      }
    });

    // 4. 即時刷新工具列 UI (立即解鎖 ↩️ 復原與 ↪️ 重做按鈕之 disabled 狀態與步數數字)
    updateToolbarUI(charKey);

    // 5. 持久化存儲至本地 LocalStorage (防重整或未登入丟失)
    saveOverridesToStorage(charKey);

    // 6. 自動同步至 Google 雲端帳號 Firestore
    if (!skipBroadcast) {
      syncOverridesToCloud(charKey);
    }
  }

  // 取得全部 4 個角色的修改覆蓋物件 (打包給雲端同步)
  function getAllOverrides() {
    const all = {};
    ['bulbasaur', 'ivysaur', 'venusaur', 'buzz'].forEach(k => {
      const o = getOverrides(k);
      const time = (_state.characters[k] && _state.characters[k].updatedAt) || loadTimeFromStorage(k);
      if (o && Object.keys(o).length > 0) {
        all[k] = {
          data: o,
          updatedAt: time
        };
      }
    });
    return all;
  }

  // 從 Google 雲端水合注入修改 (跨裝置手機載入時還原)
  function hydrateFromCloud(cloudOverrides) {
    if (!cloudOverrides || typeof cloudOverrides !== 'object') return;
    ['bulbasaur', 'ivysaur', 'venusaur', 'buzz'].forEach(k => {
      const remote = cloudOverrides[k];
      if (remote && typeof remote === 'object') {
        const remoteData = (remote.data !== undefined) ? remote.data : remote;
        const remoteTime = (remote.updatedAt !== undefined) ? Number(remote.updatedAt) : null;
        const localOverrides = (_state.characters[k] && _state.characters[k].overrides) || {};
        const localCount = Object.keys(localOverrides).length;
        const remoteCount = (remoteData && typeof remoteData === 'object') ? Object.keys(remoteData).length : 0;
        const localTime = (_state.characters[k] && _state.characters[k].updatedAt) ? Number(_state.characters[k].updatedAt) : loadTimeFromStorage(k);

        // 核心歷史存檔搶救與防回彈邏輯：
        // 1. 若遠端有明確時間戳，嚴格比對 remoteTime > localTime (舊資料與同版回彈絕對安全略過)
        // 2. 若遠端為昨天存檔的舊格式 (無 updatedAt 欄位)：只要雲端有方塊資料，強制優先還原！
        let shouldHydrate = false;
        if (remoteTime !== null) {
          shouldHydrate = (remoteTime > localTime);
        } else if (remoteCount > 0) {
          shouldHydrate = true;
        }

        if (shouldHydrate) {
          if (_state.characters[k]) {
            _state.characters[k].overrides = { ...remoteData };
            _state.characters[k].updatedAt = remoteTime || Date.now();
          }
          saveOverridesToStorage(k, remoteTime || Date.now());
          notifyListeners(k, true);
        }
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

      <!-- 展開的左側專屬調色盤 (預設隱藏，寬 58px 高約 200px 絕不溢出) -->
      <div class="ve-palette-dock ve-hidden" id="vePaletteDock_${charKey}">
        <div class="ve-palette-title">🎨 材質</div>
        <div class="ve-palette-grid">
          ${paletteHtml}
        </div>
      </div>

      <!-- 展開的右側編輯工具面板 (預設隱藏，高度約 310px 絕不溢出) -->
      <div class="voxel-editor-toolbar ve-hidden" id="vePanel_${charKey}">
        <div class="ve-toolbar-header">
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
            <button type="button" class="ve-btn ${_state.editorMode && _state.tool === 'select' ? 'active' : ''}" data-tool="select" title="選取 (多方塊選取／框選後批次塗色或整批消除)">
              ⬚ 選取
            </button>
          </div>

          <div class="ve-divider"></div>

          <div class="ve-action-group">
            <button type="button" class="ve-btn ve-btn-danger" id="btnClearSel_${charKey}" title="清空當前選取的方塊" style="${(_state.selectedVoxels && _state.selectedVoxels.size > 0) ? '' : 'display:none;'}">
              ✖ 清空選取 (${_state.selectedVoxels ? _state.selectedVoxels.size : 0})
            </button>
            <button type="button" class="ve-btn ${_state.mirrorSymmetry ? 'active' : ''}" id="btnMirror_${charKey}" title="左右鏡像對稱編輯">
              🪞 鏡像: ${_state.mirrorSymmetry ? '開' : '關'}
            </button>
            <div class="ve-mirror-actions" style="display:flex;gap:4px;width:100%;">
              <button type="button" class="ve-btn ve-btn-mirror-ltor" id="btnMirrorLtoR_${charKey}" title="將本層左側方塊完全鏡像複製至右側 (右側原有顏色不變，缺少則補齊，來源無則刪除)" style="flex:1;padding:4px 2px;font-size:11px;">
                ⮂ 左鏡右
              </button>
              <button type="button" class="ve-btn ve-btn-mirror-rtol" id="btnMirrorRtoL_${charKey}" title="將本層右側方塊完全鏡像複製至左側 (左側原有顏色不變，缺少則補齊，來源無則刪除)" style="flex:1;padding:4px 2px;font-size:11px;">
                ⮃ 右鏡左
              </button>
            </div>
            <div class="ve-undo-redo-row" style="display:flex;gap:4px;width:100%;">
              <button type="button" class="ve-btn" id="btnUndo_${charKey}" title="復原上一步 (最多 10 步)" style="flex:1;">
                ↩️ 復原
              </button>
              <button type="button" class="ve-btn" id="btnRedo_${charKey}" title="重做下一步 (最多 10 步)" style="flex:1;">
                ↪️ 重做
              </button>
            </div>
            <div class="ve-autosave-badge" id="autoSaveBadge_${charKey}" title="體素編輯每步已即時自動儲存">
              <span class="ve-autosave-dot"></span>
              <span class="ve-autosave-text">已自動保存 ✓</span>
            </div>
          </div>

          <div class="ve-divider" style="margin: 6px 0 4px 0;"></div>

          <div class="ve-danger-zone" style="width: 100%;">
            <button type="button" class="ve-btn ve-btn-reset-safe" id="btnReset_${charKey}" title="清除所有自訂修改，恢復官方預設模型 (需二次確認)" style="background:transparent;border:1px dashed rgba(239, 68, 68, 0.4);color:#f87171;font-size:10px;padding:3px 2px;opacity:0.75;width:100%;">
              🔄 恢復預設
            </button>
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

      if (_state.tool === 'select') {
        selectVoxel(charKey, voxelX, voxelY, voxelZ, true);
        updateToolbarUI(charKey);
        syncThreeMeshFromOverrides(charKey, threeState, baseData);
        return;
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

    function clear3DGhost() {
      if (threeState && threeState.ghostMesh && threeState.scene) {
        threeState.scene.remove(threeState.ghostMesh);
        if (threeState.ghostMesh.geometry) threeState.ghostMesh.geometry.dispose();
        if (threeState.ghostMesh.material) threeState.ghostMesh.material.dispose();
        threeState.ghostMesh = null;
      }
    }

    canvas.addEventListener('mousemove', (e) => {
      if (!_state.editorMode || !_state.mirrorSymmetry || !threeState.camera || typeof THREE === 'undefined') {
        clear3DGhost();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, threeState.camera);

      const targets = [];
      if (threeState.instancedMesh) targets.push(threeState.instancedMesh);
      if (threeState.dynamicAddedGroup && threeState.dynamicAddedGroup.children.length > 0) {
        targets.push(...threeState.dynamicAddedGroup.children);
      }
      const intersects = raycaster.intersectObjects(targets, false);
      if (!intersects || intersects.length === 0) {
        clear3DGhost();
        return;
      }

      const hit = intersects[0];
      const cx = baseData.dimensions.width / 2;
      const cy = baseData.dimensions.height / 2;
      const cz = baseData.dimensions.length / 2;
      let vx, vy, vz;
      if (hit.object && hit.object.userData && hit.object.userData.isDynamic) {
        vx = hit.object.userData.voxelX;
        vy = hit.object.userData.voxelY;
        vz = hit.object.userData.voxelZ;
      } else {
        const id = hit.instanceId;
        if (id === undefined || id === null) { clear3DGhost(); return; }
        const b = threeState.blockDataList ? threeState.blockDataList[id] : null;
        if (!b) { clear3DGhost(); return; }
        vx = Math.round(b.posX + cx);
        vy = Math.round(b.posY + cy);
        vz = Math.round(b.posZ + cz);
      }

      if (_state.tool === 'add' && hit.face) {
        const n = hit.face.normal;
        vx += Math.round(n.x);
        vy += Math.round(n.y);
        vz += Math.round(n.z);
      }

      const symX = getSymmetryX(vx, charKey);
      if (symX === null || symX === vx) {
        clear3DGhost();
        return;
      }

      // 建立或更新 3D 50% 半透明幽靈方塊
      if (!threeState.ghostMesh) {
        const geom = new THREE.BoxGeometry(1.02, 1.02, 1.02);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xec4899,
          transparent: true,
          opacity: 0.55,
          wireframe: false
        });
        threeState.ghostMesh = new THREE.Mesh(geom, mat);
        threeState.scene.add(threeState.ghostMesh);
      }

      threeState.ghostMesh.position.set(symX - cx, vy - cy, vz - cz);
      if (_state.tool === 'delete') {
        threeState.ghostMesh.material.color.set(0xef4444);
      } else {
        const pItem = (baseData.palette && baseData.palette[_state.selectedBid]) ? baseData.palette[_state.selectedBid] : null;
        threeState.ghostMesh.material.color.set(pItem ? pItem.color : 0xec4899);
      }
    });

    canvas.addEventListener('mouseleave', clear3DGhost);
  }

  // 依據 overrides 即時更新 Three.js InstancedMesh 與動態增補網格 (支援 affectedCoords 定向局部極速更新)
  function syncThreeMeshFromOverrides(charKey, threeState, baseData, affectedCoords = null) {
    if (!threeState || !threeState.instancedMesh || !threeState.blockDataList) return;

    const mesh = threeState.instancedMesh;
    const blockList = threeState.blockDataList;
    const dummy = (typeof THREE !== 'undefined') ? new THREE.Object3D() : null;
    const color = (typeof THREE !== 'undefined') ? new THREE.Color() : null;
    const cx = baseData.dimensions.width / 2;
    const cy = baseData.dimensions.height / 2;
    const cz = baseData.dimensions.length / 2;

    // 建立或復用座標索引快取 Map (只在首次建構，後續 0ms 瞬間反查)
    if (!threeState._coordBlockMap) {
      threeState._coordBlockMap = new Map();
      blockList.forEach(item => {
        const vx = Math.round(item.posX + cx);
        const vy = Math.round(item.posY + cy);
        const vz = Math.round(item.posZ + cz);
        threeState._coordBlockMap.set(`${vx},${vy},${vz}`, item);
      });
    }

    // 判斷更新範圍：若有傳入受影響座標，則只定向取這 1~2 顆方塊，否則才執行全量更新
    let targetItems = [];
    if (Array.isArray(affectedCoords) && affectedCoords.length > 0) {
      affectedCoords.forEach(c => {
        const item = threeState._coordBlockMap.get(`${c.x},${c.y},${c.z}`);
        if (item) targetItems.push(item);
      });
    } else {
      targetItems = blockList;
    }

    // 1. 同步方塊的顏色與刪除縮放 (定向局部更新)
    targetItems.forEach(item => {
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
        let hideInSlice = false;
        if (threeState._getCurMode && threeState._getCurMode() === 'slice') {
          const curLayer = (threeState._getCurLayer ? threeState._getCurLayer() : 9999);
          if (item.layerIndex > curLayer) hideInSlice = true;
        }
        if (hideInSlice) {
          dummy.scale.set(0, 0, 0);
        } else {
          dummy.scale.set(1, 1, 1);
        }
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

      // 若有定向受影響座標，只精確增刪或改色這幾顆動態方塊
      if (Array.isArray(affectedCoords) && affectedCoords.length > 0) {
        affectedCoords.forEach(c => {
          if (getOriginalBid(charKey, c.x, c.y, c.z) === -1) {
            const effBid = getEffectiveBid(charKey, c.x, c.y, c.z);
            const existingChild = threeState.dynamicAddedGroup.children.find(ch =>
              ch.userData && ch.userData.voxelX === c.x && ch.userData.voxelY === c.y && ch.userData.voxelZ === c.z
            );
            if (effBid === -1) {
              if (existingChild) {
                threeState.dynamicAddedGroup.remove(existingChild);
                if (existingChild.geometry && existingChild.geometry !== mesh.geometry) existingChild.geometry.dispose();
                if (existingChild.material) existingChild.material.dispose();
              }
            } else {
              const pItem = (baseData.palette && baseData.palette[effBid]) ? baseData.palette[effBid] : { color: '#00a8c8' };
              if (existingChild) {
                if (existingChild.material) existingChild.material.color.set(pItem.color);
              } else {
                const geom = mesh.geometry || new THREE.BoxGeometry(1, 1, 1);
                const outlineMap = (mesh && mesh.material && mesh.material.map) ? mesh.material.map : null;
                const mat = new THREE.MeshStandardMaterial({
                  map: outlineMap,
                  color: pItem.color,
                  roughness: 0.88,
                  metalness: 0.0
                });
                const cube = new THREE.Mesh(geom, mat);
                cube.position.set(c.x - cx, c.y - cy, c.z - cz);
                cube.userData = { voxelX: c.x, voxelY: c.y, voxelZ: c.z, isDynamic: true };
                threeState.dynamicAddedGroup.add(cube);
              }
            }
          }
        });
      } else {
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
            const outlineMap = (mesh && mesh.material && mesh.material.map) ? mesh.material.map : null;
            const mat = new THREE.MeshStandardMaterial({
              map: outlineMap,
              color: pItem.color,
              roughness: 0.88,
              metalness: 0.0
            });
            const cube = new THREE.Mesh(geom, mat);
            cube.position.set(x - cx, y - cy, z - cz);
            let hideDynamic = false;
            if (threeState._getCurMode && threeState._getCurMode() === 'slice') {
              const curLayer = (threeState._getCurLayer ? threeState._getCurLayer() : 9999);
              if ((y + 1) > curLayer) hideDynamic = true;
            }
            cube.scale.set(hideDynamic ? 0 : 1, hideDynamic ? 0 : 1, hideDynamic ? 0 : 1);
            cube.visible = !hideDynamic;
            cube.userData = { voxelX: x, voxelY: y, voxelZ: z, isDynamic: true };
            threeState.dynamicAddedGroup.add(cube);
          }
        }
      });
      }

      // 3. 同步 3D 選取高亮外框群組 (Selection Box Group)
      if (!threeState.selectionGroup) {
        threeState.selectionGroup = new THREE.Group();
        threeState.scene.add(threeState.selectionGroup);
      }
      while (threeState.selectionGroup.children.length > 0) {
        const obj = threeState.selectionGroup.children[0];
        threeState.selectionGroup.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
      if (_state.selectedVoxels && _state.selectedVoxels.size > 0) {
        const boxGeom = new THREE.BoxGeometry(1.05, 1.05, 1.05);
        const edgesGeom = new THREE.EdgesGeometry(boxGeom);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2 });
        _state.selectedVoxels.forEach(coordKey => {
          const [x, y, z] = coordKey.split(',').map(Number);
          const wireframe = new THREE.LineSegments(edgesGeom, lineMat);
          wireframe.position.set(x - cx, y - cy, z - cz);
          threeState.selectionGroup.add(wireframe);
        });
      }
    }
  }

  function updateToolbarUI(charKey) {
    if (typeof document === 'undefined') return;
    const bars = document.querySelectorAll(`[id="voxelToolbar_${charKey}"], [id="voxelToolbar2D_${charKey}"]`);
    bars.forEach(bar => {
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
      bar.querySelectorAll(`[id^="btnMirror_"]`).forEach(btnMirror => {
        btnMirror.classList.toggle('active', _state.mirrorSymmetry);
        btnMirror.innerHTML = `🪞 鏡像: ${_state.mirrorSymmetry ? '開' : '關'}`;
      });

      // 清空選取按鈕
      bar.querySelectorAll(`[id^="btnClearSel_"]`).forEach(btnClearSel => {
        const selCount = _state.selectedVoxels ? _state.selectedVoxels.size : 0;
        btnClearSel.style.display = selCount > 0 ? '' : 'none';
        btnClearSel.innerHTML = `✖ 清空選取 (${selCount})`;
      });

      // 色票 active (左側調色盤)
      bar.querySelectorAll('.ve-color-dot').forEach(dot => {
        const bid = Number(dot.getAttribute('data-bid'));
        dot.classList.toggle('active', bid === Number(_state.selectedBid));
      });

      // 復原與重做按鈕狀態與 10 步計數更新
      const char = _state.characters[charKey];
      const historyCount = (char && char.history) ? char.history.length : 0;
      const redoCount = (char && char.redoStack) ? char.redoStack.length : 0;

      bar.querySelectorAll(`[id^="btnUndo_"]`).forEach(btnUndo => {
        btnUndo.disabled = (historyCount === 0);
        btnUndo.style.opacity = (historyCount === 0) ? '0.45' : '1';
        btnUndo.style.cursor = (historyCount === 0) ? 'not-allowed' : 'pointer';
        btnUndo.innerHTML = historyCount > 0 ? `↩️ 復原 (${historyCount})` : '↩️ 復原';
      });

      bar.querySelectorAll(`[id^="btnRedo_"]`).forEach(btnRedo => {
        btnRedo.disabled = (redoCount === 0);
        btnRedo.style.opacity = (redoCount === 0) ? '0.45' : '1';
        btnRedo.style.cursor = (redoCount === 0) ? 'not-allowed' : 'pointer';
        btnRedo.innerHTML = redoCount > 0 ? `↪️ 重做 (${redoCount})` : '↪️ 重做';
      });
    });
  }

  function setupToolbarEvents(container, charKey, threeState, baseData, onSubmitCallback) {
    const toggleBtn = container.querySelector(`[id^="veToggleBtn_"]`);
    const panel = container.querySelector(`[id^="vePanel_"]`);
    const paletteDock = container.querySelector(`[id^="vePaletteDock_"]`);
    const closeBtn = container.querySelector(`[id^="veCloseBtn_"]`);

    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = panel.classList.contains('ve-hidden');
        panel.classList.toggle('ve-hidden', !isHidden);
        if (paletteDock) paletteDock.classList.toggle('ve-hidden', !isHidden);
        if (isHidden) {
          _state.editorMode = true;
          if (_state.tool === 'rotate') _state.tool = 'paint';
          updateToolbarUI(charKey);
        } else {
          _state.editorMode = false;
          _state.tool = 'rotate';
          updateToolbarUI(charKey);
        }
      });
    }

    if (closeBtn && panel) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.add('ve-hidden');
        if (paletteDock) paletteDock.classList.add('ve-hidden');
        _state.editorMode = false;
        _state.tool = 'rotate';
        updateToolbarUI(charKey);
      });
    }

    if (paletteDock) {
      paletteDock.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        if (target.hasAttribute('data-bid')) {
          _state.selectedBid = Number(target.getAttribute('data-bid'));
          if (_state.selectedVoxels && _state.selectedVoxels.size > 0) {
            applyBatchAction(charKey, 'paint', _state.selectedBid);
            syncThreeMeshFromOverrides(charKey, threeState, baseData);
          } else if (_state.tool === 'rotate' || _state.tool === 'eyedropper' || _state.tool === 'delete') {
            _state.tool = 'paint';
            _state.editorMode = true;
          }
          updateToolbarUI(charKey);
        }
      });
    }

    panel.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;

      if (target.id.startsWith('btnClearSel_')) {
        clearSelection(charKey);
        updateToolbarUI(charKey);
        syncThreeMeshFromOverrides(charKey, threeState, baseData);
        return;
      }

      if (target.hasAttribute('data-tool')) {
        const t = target.getAttribute('data-tool');
        if (t === 'delete' && _state.selectedVoxels && _state.selectedVoxels.size > 0) {
          applyBatchAction(charKey, 'delete');
          syncThreeMeshFromOverrides(charKey, threeState, baseData);
          updateToolbarUI(charKey);
          return;
        }
        _state.tool = t;
        _state.editorMode = (t !== 'rotate');
        updateToolbarUI(charKey);
        return;
      }

      if (target.hasAttribute('data-bid')) {
        _state.selectedBid = Number(target.getAttribute('data-bid'));
        if (_state.selectedVoxels && _state.selectedVoxels.size > 0) {
          applyBatchAction(charKey, 'paint', _state.selectedBid);
          syncThreeMeshFromOverrides(charKey, threeState, baseData);
        } else if (_state.tool === 'rotate' || _state.tool === 'eyedropper' || _state.tool === 'delete') {
          _state.tool = 'paint';
          _state.editorMode = true;
        }
        updateToolbarUI(charKey);
        return;
      }

      if (target.id.startsWith('btnMirror_')) {
        _state.mirrorSymmetry = !_state.mirrorSymmetry;
        updateToolbarUI(charKey);
        return;
      }

      // 一鍵鏡像同步 (左鏡右 / 右鏡左)
      if (target.id.startsWith('btnMirrorLtoR_') || target.classList.contains('ve-btn-mirror-ltor')) {
        const curLayer = (threeState._getCurLayer ? threeState._getCurLayer() : 1);
        mirrorCurrentLayer(charKey, curLayer, 'left-to-right');
        syncThreeMeshFromOverrides(charKey, threeState, baseData);
        return;
      }
      if (target.id.startsWith('btnMirrorRtoL_') || target.classList.contains('ve-btn-mirror-rtol')) {
        const curLayer = (threeState._getCurLayer ? threeState._getCurLayer() : 1);
        mirrorCurrentLayer(charKey, curLayer, 'right-to-left');
        syncThreeMeshFromOverrides(charKey, threeState, baseData);
        return;
      }

      if (target.id.startsWith('btnUndo_')) {
        undo(charKey);
        return;
      }

      if (target.id.startsWith('btnRedo_')) {
        redo(charKey);
        return;
      }

      if (target.id.startsWith('btnReset_')) {
        const confirmMsg = '⚠️ 警告：這將會清除您對當前角色的所有自訂方塊與改動，恢復為官方預設值，且無法撤銷！\n\n確定要重置嗎？';
        if (confirm(confirmMsg)) {
          resetToDefault(charKey);
          _lastLocalActionTime = Date.now();
          saveOverridesToStorage(charKey);
          syncOverridesToCloud(charKey);
          syncThreeMeshFromOverrides(charKey, threeState, baseData);
          if (typeof onSubmitCallback === 'function') {
            onSubmitCallback(charKey, {});
          }
        }
        return;
      }
    });
  }

  function attachEditorToScene(charKey, threeState, baseData, canvasWrap, onSubmitCallback) {
    if (!canvasWrap || !threeState) return;

    _attachedThreeScenes[charKey] = { threeState, baseData };

    let container = document.getElementById(`voxelToolbar_${charKey}`);
    if (!container) {
      container = createEditorToolbarDOM(charKey, baseData);
      canvasWrap.style.position = 'relative';
      canvasWrap.appendChild(container);

      setupToolbarEvents(container, charKey, threeState, baseData, onSubmitCallback);
      bindThreeRaycaster(charKey, threeState, baseData, canvasWrap);
    }
  }

  function attachEditorTo2D(charKey, threeState, baseData, container2D, onSubmitCallback) {
    if (!container2D || !threeState) return;

    _attachedThreeScenes[charKey] = { threeState, baseData };

    let toolbar2D = container2D.querySelector(`#voxelToolbar2D_${charKey}`);
    if (!toolbar2D) {
      toolbar2D = createEditorToolbarDOM(charKey, baseData);
      toolbar2D.id = `voxelToolbar2D_${charKey}`;
      toolbar2D.classList.add('voxel-editor-2d-toolbar');
      container2D.style.position = 'relative';
      container2D.appendChild(toolbar2D);

      setupToolbarEvents(toolbar2D, charKey, threeState, baseData, onSubmitCallback);
    }
  }

  const VoxelDeltaStore = {
    state: _state,
    getBaseData,
    getCharBounds,
    getSymmetryX,
    getOriginalBid,
    getEffectiveBid,
    executeVoxelAction,
    selectVoxel,
    selectRegion,
    clearSelection,
    applyBatchAction,
    mirrorCurrentLayer,
    setHoverVoxel,
    undo,
    redo,
    resetToDefault,
    loadOverrides,
    getOverrides,
    getEffectiveVoxelData,
    addChangeListener,
    // 跨視窗即時同步廣播模組
    broadcastVoxelDelta,
    handleRemoteOverridesSync,
    // 雲端與本地持久化模組
    getAllOverrides,
    hydrateFromCloud,
    saveOverridesToStorage,
    loadOverridesFromStorage,
    // Three 編輯器模組
    attachEditorToScene,
    attachEditorTo2D,
    syncThreeMeshFromOverrides,
    updateToolbarUI
  };

  // 網頁載入時若有已存在的修改，主動為其做一次備份與雲端同步觸發 (若無修改絕不空寫時間戳)
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      ['bulbasaur', 'ivysaur', 'venusaur', 'buzz'].forEach(k => {
        const ov = getOverrides(k);
        if (ov && Object.keys(ov).length > 0) {
          saveOverridesToStorage(k);
          syncOverridesToCloud(k);
        }
      });
    }, 1000);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoxelDeltaStore;
  } else {
    global.VoxelDeltaStore = VoxelDeltaStore;
  }
})(typeof window !== 'undefined' ? window : global);
