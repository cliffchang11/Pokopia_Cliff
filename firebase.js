/**
 * Pokopia Firebase Integration Module
 * Google Auth + Firestore 雲端進度同步
 */

(function () {
  'use strict';

  // ─── Firebase Config ────────────────────────────────────────────
  const firebaseConfig = {
    apiKey: "AIzaSyDWXQQBtOuZDspUpGSNBzSmaTtrRyEQp8Y",
    authDomain: "pokopiabycliff.firebaseapp.com",
    projectId: "pokopiabycliff",
    storageBucket: "pokopiabycliff.firebasestorage.app",
    messagingSenderId: "995607314279",
    appId: "1:995607314279:web:178e40975ea06163e979c2",
    measurementId: "G-DB6G2921BB"
  };

  const FIREBASE_VERSION = '10.12.2';
  const CDN = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION;

  let _auth = null;
  let _db = null;
  let _currentUser = null;
  let _authChangeCallbacks = [];
  let _saveDebounceTimer = null;

  function progressDocPath(uid) {
    return 'users/' + uid + '/progress/pokopia';
  }

  function normalizeCloudData(data) {
    if (!data || typeof data !== 'object') return data;
    if (!data.voxelOverrides || typeof data.voxelOverrides !== 'object') {
      data.voxelOverrides = {};
    }
    ['bulbasaur', 'ivysaur', 'venusaur', 'buzz'].forEach(k => {
      const dotKey = 'voxelOverrides.' + k;
      if (data[dotKey]) {
        data.voxelOverrides[k] = data[dotKey];
      }
      // 確保結構統一，若無 .data 則補全包裹，且確保時間戳不遺失
      const val = data.voxelOverrides[k];
      if (val && typeof val === 'object') {
        if (val.data === undefined) {
          data.voxelOverrides[k] = {
            data: val,
            updatedAt: 1
          };
        }
      }
    });
    return data;
  }

  async function loadCloudProgress(uid) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase load timeout after 5000ms')), 5000)
      );
      const fetchPromise = (async () => {
        const { doc, getDoc } = await import(CDN + '/firebase-firestore.js');
        const docRef = doc(_db, progressDocPath(uid));
        const snap = await getDoc(docRef);
        if (snap.exists()) return normalizeCloudData(snap.data());
        return null;
      })();
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (e) {
      console.warn('[Firebase] loadCloudProgress failed or timed out:', e);
    }
    return null;
  }

  async function saveCloudProgress(uid, progressData, mergeFields = null) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase save timeout after 5000ms')), 5000)
      );
      const savePromise = (async () => {
        const { doc, setDoc, serverTimestamp } = await import(CDN + '/firebase-firestore.js');
        const docRef = doc(_db, progressDocPath(uid));
        const setOptions = (Array.isArray(mergeFields) && mergeFields.length > 0)
          ? { mergeFields: [...mergeFields, 'lastUpdated'] }
          : { merge: true };
        await setDoc(docRef, { ...progressData, lastUpdated: serverTimestamp() }, setOptions);
        return true;
      })();
      return await Promise.race([savePromise, timeoutPromise]);
    } catch (e) {
      console.warn('[Firebase] saveCloudProgress failed or timed out:', e);
      return false;
    }
  }

  function mergeProgressUnion(local, cloud) {
    const merged = {};
    const keys = ['catChecked', 'pkmChecked', 'habChecked', 'benchOverrides', 'autoFarmChecked'];
    keys.forEach(k => {
      const l = (local && local[k]) ? local[k] : {};
      const c = (cloud && cloud[k]) ? cloud[k] : {};
      const allKeys = new Set([...Object.keys(l), ...Object.keys(c)]);
      merged[k] = {};
      allKeys.forEach(id => {
        const lv = l[id];
        const cv = c[id];
        if (typeof lv === 'boolean' || typeof cv === 'boolean') {
          merged[k][id] = !!(lv || cv);
        } else if (lv !== undefined || cv !== undefined) {
          merged[k][id] = cv !== undefined ? cv : lv;
        }
      });
    });
    if (cloud && cloud.customBoxes && Array.isArray(cloud.customBoxes)) {
      merged.customBoxes = cloud.customBoxes;
    } else if (local && local.customBoxes && Array.isArray(local.customBoxes)) {
      merged.customBoxes = local.customBoxes;
    }
    if (cloud && cloud.regionAssignments && typeof cloud.regionAssignments === 'object') {
      merged.regionAssignments = cloud.regionAssignments;
    } else if (local && local.regionAssignments && typeof local.regionAssignments === 'object') {
      merged.regionAssignments = local.regionAssignments;
    }
    // 刪除影片黑名單聯集合併 (防跨裝置增補復活)
    const delVideoIdSet = new Set();
    if (cloud && cloud.deletedVideoIds && Array.isArray(cloud.deletedVideoIds)) {
      cloud.deletedVideoIds.forEach(id => delVideoIdSet.add(id));
    }
    if (local && local.deletedVideoIds && Array.isArray(local.deletedVideoIds)) {
      local.deletedVideoIds.forEach(id => delVideoIdSet.add(id));
    }
    merged.deletedVideoIds = Array.from(delVideoIdSet);

    if (cloud && cloud.customVideos && Array.isArray(cloud.customVideos)) {
      const localList = (local && local.customVideos && Array.isArray(local.customVideos)) ? local.customVideos : [];
      const videoMap = new Map();
      cloud.customVideos.forEach(v => {
        if (v && v.id && !delVideoIdSet.has(v.id)) {
          const migratedTags = Array.isArray(v.tags) ? v.tags.map(t => t === '建築造景' ? '建築' : t) : [];
          videoMap.set(v.id, { ...v, tags: Array.from(new Set(migratedTags)) });
        }
      });
      localList.forEach(v => {
        if (v && v.id && !delVideoIdSet.has(v.id)) {
          const migratedTags = Array.isArray(v.tags) ? v.tags.map(t => t === '建築造景' ? '建築' : t) : [];
          const normV = { ...v, tags: Array.from(new Set(migratedTags)) };
          if (!videoMap.has(v.id)) {
            videoMap.set(v.id, normV);
          } else {
            const cloudV = videoMap.get(v.id);
            const localTime = new Date(v.updatedAt || v.createdAt || 0).getTime();
            const cloudTime = new Date(cloudV.updatedAt || cloudV.createdAt || 0).getTime();
            if (localTime >= cloudTime) {
              videoMap.set(v.id, normV);
            }
          }
        }
      });
      const defaultVideos = (typeof global !== 'undefined' && global.POKOPIA_DEFAULT_VIDEOS) ||
                            (typeof window !== 'undefined' && window.POKOPIA_DEFAULT_VIDEOS) || [];
      defaultVideos.forEach(def => {
        if (def && def.id && !videoMap.has(def.id) && !delVideoIdSet.has(def.id)) {
          const defTags = Array.isArray(def.tags) ? def.tags.map(t => t === '建築造景' ? '建築' : t) : [];
          videoMap.set(def.id, { ...def, tags: Array.from(new Set(defTags)) });
        }
      });
      const mergedList = Array.from(videoMap.values());
      mergedList.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return String(a.id || '').localeCompare(String(b.id || ''));
      });
      merged.customVideos = mergedList;
    } else if (local && local.customVideos && Array.isArray(local.customVideos)) {
      const sortedLocal = [];
      local.customVideos.forEach(v => {
        if (v && v.id && !delVideoIdSet.has(v.id)) {
          const migratedTags = Array.isArray(v.tags) ? v.tags.map(t => t === '建築造景' ? '建築' : t) : [];
          sortedLocal.push({ ...v, tags: Array.from(new Set(migratedTags)) });
        }
      });
      const defaultVideos = (typeof global !== 'undefined' && global.POKOPIA_DEFAULT_VIDEOS) ||
                            (typeof window !== 'undefined' && window.POKOPIA_DEFAULT_VIDEOS) || [];
      const existingIds = new Set(sortedLocal.map(v => v.id));
      defaultVideos.forEach(def => {
        if (def && def.id && !existingIds.has(def.id) && !delVideoIdSet.has(def.id)) {
          const defTags = Array.isArray(def.tags) ? def.tags.map(t => t === '建築造景' ? '建築' : t) : [];
          sortedLocal.push({ ...def, tags: Array.from(new Set(defTags)) });
          existingIds.add(def.id);
        }
      });
      sortedLocal.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return String(a.id || '').localeCompare(String(b.id || ''));
      });
      merged.customVideos = sortedLocal;
    }
    if (cloud && cloud.customVideoTags && Array.isArray(cloud.customVideoTags)) {
      const tagSet = new Set(cloud.customVideoTags.map(t => t === '建築造景' ? '建築' : t));
      if (local && local.customVideoTags && Array.isArray(local.customVideoTags)) {
        local.customVideoTags.forEach(t => tagSet.add(t === '建築造景' ? '建築' : t));
      }
      merged.customVideoTags = Array.from(tagSet);
    } else if (local && local.customVideoTags && Array.isArray(local.customVideoTags)) {
      merged.customVideoTags = Array.from(new Set(local.customVideoTags.map(t => t === '建築造景' ? '建築' : t)));
    }
    if (cloud && cloud.deletedVideoTags && Array.isArray(cloud.deletedVideoTags)) {
      const delSet = new Set(cloud.deletedVideoTags);
      if (local && local.deletedVideoTags && Array.isArray(local.deletedVideoTags)) {
        local.deletedVideoTags.forEach(t => delSet.add(t));
      }
      merged.deletedVideoTags = Array.from(delSet);
    } else if (local && local.deletedVideoTags && Array.isArray(local.deletedVideoTags)) {
      merged.deletedVideoTags = local.deletedVideoTags;
    }

    // 體素自訂修改 (Voxel Overrides) 雲端合併 (本地優先無損合併)
    // 角色層級全量快照 + 時間戳判定，徹底解決回彈
    if (cloud && cloud.voxelOverrides && typeof cloud.voxelOverrides === 'object') {
      merged.voxelOverrides = { ...cloud.voxelOverrides };
      if (local && local.voxelOverrides && typeof local.voxelOverrides === 'object') {
        Object.keys(local.voxelOverrides).forEach(charKey => {
          const lVal = local.voxelOverrides[charKey];
          const cVal = merged.voxelOverrides[charKey];
          if (!cVal) {
            merged.voxelOverrides[charKey] = lVal;
          } else if (!lVal) {
            merged.voxelOverrides[charKey] = cVal;
          } else {
            // 體素修改合併：雲端具備有效手動存檔時間戳時，高於本地時間戳一律以雲端為最高權威
            const lTime = (lVal && lVal.updatedAt !== undefined) ? Number(lVal.updatedAt) : 0;
            const cTime = (cVal && cVal.updatedAt !== undefined) ? Number(cVal.updatedAt) : 0;
            const lData = (lVal && lVal.data !== undefined) ? lVal.data : lVal;
            const cData = (cVal && cVal.data !== undefined) ? cVal.data : cVal;
            const lCount = (lData && typeof lData === 'object') ? Object.keys(lData).length : 0;
            const cCount = (cData && typeof cData === 'object') ? Object.keys(cData).length : 0;

            if (cTime > lTime) {
              merged.voxelOverrides[charKey] = cVal;
            } else if (lTime > cTime) {
              merged.voxelOverrides[charKey] = lVal;
            } else if (cTime === 0 && lTime === 0) {
              // 雙端皆無時間戳時，優先保留方塊數量較豐富之成果
              merged.voxelOverrides[charKey] = (lCount >= cCount && lCount > 0) ? lVal : cVal;
            } else {
              // 時間戳完全一致時，以雲端為準
              merged.voxelOverrides[charKey] = cVal;
            }
          }
        });
      }
    } else if (local && local.voxelOverrides && typeof local.voxelOverrides === 'object') {
      merged.voxelOverrides = { ...local.voxelOverrides };
    }

    // 3D 藍圖停留狀態 (角色與各角色切片層數)
    if (cloud && cloud.blueprint3D && typeof cloud.blueprint3D === 'object') {
      merged.blueprint3D = { ...cloud.blueprint3D };
      if (local && local.blueprint3D && typeof local.blueprint3D === 'object') {
        merged.blueprint3D = { ...cloud.blueprint3D, ...local.blueprint3D };
      }
    } else if (local && local.blueprint3D && typeof local.blueprint3D === 'object') {
      merged.blueprint3D = { ...local.blueprint3D };
    }

    return merged;
  }

  let _progressUnsubscribe = null;

  async function subscribeCloudProgress(uid, callback) {
    unsubscribeCloudProgress();
    try {
      const { doc, onSnapshot } = await import(CDN + '/firebase-firestore.js');
      const docRef = doc(_db, progressDocPath(uid));
      _progressUnsubscribe = onSnapshot(docRef, function (snap) {
        if (snap.exists()) {
          const data = normalizeCloudData(snap.data());
          const hasPendingWrites = snap.metadata ? snap.metadata.hasPendingWrites : false;
          callback(data, hasPendingWrites);
        }
      }, function (err) {
        console.warn('[Firebase] onSnapshot error:', err);
      });
    } catch (e) {
      console.warn('[Firebase] subscribeCloudProgress failed:', e);
    }
  }

  function unsubscribeCloudProgress() {
    if (_progressUnsubscribe) {
      try { _progressUnsubscribe(); } catch (e) {}
      _progressUnsubscribe = null;
    }
  }

  function debouncedSave(uid, progressData, delay) {
    delay = delay || 600;
    if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
    _saveDebounceTimer = setTimeout(function () {
      saveCloudProgress(uid, progressData);
    }, delay);
  }

  async function signInWithGoogle() {
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import(CDN + '/firebase-auth.js');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(_auth, provider);
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        console.error('[Firebase] Google 登入失敗:', e);
        alert('Google 登入失敗，請稍後再試。\n' + (e.message || ''));
      }
    }
  }

  async function signOut() {
    try {
      unsubscribeCloudProgress();
      const { signOut: fbSignOut } = await import(CDN + '/firebase-auth.js');
      await fbSignOut(_auth);
    } catch (e) {
      console.error('[Firebase] 登出失敗:', e);
    }
  }

  function onAuthChange(callback) {
    _authChangeCallbacks.push(callback);
  }

  function getCurrentUser() {
    return _currentUser;
  }

  async function initFirebase() {
    try {
      const { initializeApp } = await import(CDN + '/firebase-app.js');
      const { getAuth, onAuthStateChanged } = await import(CDN + '/firebase-auth.js');
      const { getFirestore } = await import(CDN + '/firebase-firestore.js');

      const app = initializeApp(firebaseConfig);
      _auth = getAuth(app);
      _db = getFirestore(app);

      onAuthStateChanged(_auth, function (user) {
        _currentUser = user;
        if (!user) {
          unsubscribeCloudProgress();
        }
        _authChangeCallbacks.forEach(function (cb) {
          try { cb(user); } catch (e) { console.warn('[Firebase] authChange callback error:', e); }
        });
      });

      console.log('[Firebase] 初始化成功');
    } catch (e) {
      console.error('[Firebase] 初始化失敗:', e);
    }
  }

  async function saveVoxelOverrides(charKey, overrides, updatedAt) {
    try {
      const now = updatedAt || Date.now();
      const storageKey = 'pokopia_voxel_overrides_' + charKey;
      const timeKey = 'pokopia_voxel_time_' + charKey;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(overrides || {}));
        localStorage.setItem(timeKey, String(now));
      }

      if (_currentUser) {
        // 角色級原子整份替換：以 mergeFields 明確鎖定 voxelOverrides.${charKey}
        // 關鍵修復：Firestore SDK 要求 mergeFields 指定 'voxelOverrides.charKey' 時，傳入資料必須為標準巢狀物件結構
        const cloudSaved = await saveCloudProgress(_currentUser.uid, {
          voxelOverrides: {
            [charKey]: {
              data: overrides || {},
              updatedAt: now
            }
          }
        }, [`voxelOverrides.${charKey}`]);

        if (cloudSaved) {
          return { success: true, cloud: true, message: '已成功儲存至您的 Google 雲端帳號！' };
        } else {
          return { success: true, cloud: false, message: '雲端同步延遲，已先儲存至本機！' };
        }
      }
      return { success: true, cloud: false, message: '已保存至本地瀏覽器！登入 Google 帳號可跨裝置永久同步。' };
    } catch (e) {
      console.error('[Firebase] saveVoxelOverrides failed:', e);
      return { success: false, error: e };
    }
  }

  function loadVoxelOverrides(charKey) {
    try {
      const storageKey = 'pokopia_voxel_overrides_' + charKey;
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return parsed.data !== undefined ? parsed.data : parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[Firebase] loadVoxelOverrides failed:', e);
    }
    return {};
  }

  window.PokopiaFirebase = {
    init: initFirebase,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    onAuthChange: onAuthChange,
    getCurrentUser: getCurrentUser,
    loadCloudProgress: loadCloudProgress,
    saveCloudProgress: saveCloudProgress,
    debouncedSave: debouncedSave,
    subscribeCloudProgress: subscribeCloudProgress,
    unsubscribeCloudProgress: unsubscribeCloudProgress,
    mergeProgressUnion: mergeProgressUnion,
    normalizeCloudData: normalizeCloudData,
    saveVoxelOverrides: saveVoxelOverrides,
    loadVoxelOverrides: loadVoxelOverrides
  };

})();
