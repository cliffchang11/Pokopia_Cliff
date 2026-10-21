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

  async function loadCloudProgress(uid) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase load timeout after 5000ms')), 5000)
      );
      const fetchPromise = (async () => {
        const { doc, getDoc } = await import(CDN + '/firebase-firestore.js');
        const docRef = doc(_db, progressDocPath(uid));
        const snap = await getDoc(docRef);
        if (snap.exists()) return snap.data();
        return null;
      })();
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (e) {
      console.warn('[Firebase] loadCloudProgress failed or timed out:', e);
    }
    return null;
  }

  async function saveCloudProgress(uid, progressData) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase save timeout after 5000ms')), 5000)
      );
      const savePromise = (async () => {
        const { doc, setDoc, serverTimestamp } = await import(CDN + '/firebase-firestore.js');
        const docRef = doc(_db, progressDocPath(uid));
        await setDoc(docRef, { ...progressData, lastUpdated: serverTimestamp() }, { merge: true });
        return true;
      })();
      await Promise.race([savePromise, timeoutPromise]);
    } catch (e) {
      console.warn('[Firebase] saveCloudProgress failed or timed out:', e);
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
          const data = snap.data();
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
    mergeProgressUnion: mergeProgressUnion
  };

})();
