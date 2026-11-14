# Pokopia 專案專屬規格與雲端儲存記憶規範

本文件記錄 Pokopia 體素建造系統已驗收通過之核心「雲端儲存架構」與規範。後續任何功能擴充、模型新增或除錯，皆必須嚴格遵守以下架構，不得破壞或回退。

---

## 一、體素雲端儲存核心架構 (Cloud Storage Architecture)

### 1. 原子字串封裝 (Atomic String Packing - `voxelOverridesPack`)
- **封裝格式**：
  在寫入 Firebase Firestore 時，體素覆寫資料絕對不得直接平鋪為單獨欄位（防止超過 Firestore 欄位數量上限與 Quota 爆炸），一律打包為壓縮原子字串包：
  ```javascript
  voxelOverridesPack: {
    [charKey]: {
      json: JSON.stringify(overrides), // 體素座標與色號物件字串化 (約 150KB)
      updatedAt: Date.now()            // 毫秒級更新時間戳
    }
  }
  ```
- **解包機制 (`normalizeCloudData`)**：
  雲端資料讀取或 `onSnapshot` 觸發時，優先從 `voxelOverridesPack[charKey]` 解析 `json`，還原成記憶體中的 `voxelOverrides[charKey]` 物件。

### 2. 角色資料絕對隔離 (Strict Character Data Isolation)
- 系統支援的五大角色藍圖各自擁有獨立的 LocalStorage 鍵值與雲端字串包欄位：
  | 角色代碼 | 角色名稱 | LocalStorage 鍵值 | 雲端字串包欄位 | 說明 |
  | :--- | :--- | :--- | :--- | :--- |
  | `bulbasaur28_v2` | 🍃 妙蛙種子 (28層超採樣版) | `pokopia_voxel_overrides_bulbasaur28_v2` | `voxelOverridesPack.bulbasaur28_v2` | 4,204 顆方塊高傳真五官雙眼超採樣，獨立 Undo/Redo |
  | `bulbasaur28` | 🍃 妙蛙種子 (28層精巧版) | `pokopia_voxel_overrides_bulbasaur28` | `voxelOverridesPack.bulbasaur28` | 5,032 顆方塊精巧工作台，獨立 Undo/Redo |
  | `bulbasaur` | 🍃 妙蛙種子 (53層經典版) | `pokopia_voxel_overrides_bulbasaur` | `voxelOverridesPack.bulbasaur` | 基礎官方 53 層模型 |
  | `ivysaur40` | 🌿 妙蛙草 (40層精巧版) | `pokopia_voxel_overrides_ivysaur40` | `voxelOverridesPack.ivysaur40` | 14,698 顆方塊精巧工作台，獨立 Undo/Redo |
  | `ivysaur` | 🌿 妙蛙草 (76層經典版) | `pokopia_voxel_overrides_ivysaur` | `voxelOverridesPack.ivysaur` | 具備 11,726 筆固化防護與 13,708 筆雲端資產 |
  | `buzz` | 🚀 巴斯光年 | `pokopia_voxel_overrides_buzz` | `voxelOverridesPack.buzz` | 42 層建造模型 |
  | `venusaur80` | 🌺 妙蛙花 (80層精巧版) | `pokopia_voxel_overrides_venusaur80` | `voxelOverridesPack.venusaur80` | 43,663 顆方塊等比例精巧工作台，獨立 Undo/Redo |
  | `venusaur` | 🌺 妙蛙花 (103層巨型版) | `pokopia_voxel_overrides_venusaur` | `voxelOverridesPack.venusaur` | 68,180 顆方塊大型展演模型 |
- **禁止交叉污染**：在任何角色工作台進行的體素塗色、刪除、鏡像或復原，僅得寫入所屬之 `charKey`，嚴禁影響其他角色的資料。

### 3. 防降級守護機制 (Anti-Downgrade Armor)
- **76 層妙蛙草 11,726 筆固化基線**：
  本地與雲端內建 11,726 筆（`ivysaur_saved_overrides.json`）最新精雕模型防護線。
- **守護規則**：
  雲端水合抵達時，若雲端資料筆數 `< 11,726` 筆，系統判定為舊版過期快照，立即啟動防禦攔截，**絕對阻斷**舊雲端資料覆蓋本地；僅有當雲端筆數 `>= 11,726` 筆且時間戳較新時，方允許正常水合。

### 4. 水合深層內容 Diff 比對 (Deep Content Diffing)
- **根除通知死循環**：
  在 Firebase `onSnapshot` 即時監聽中，收到遠端快照時，必須逐筆比對 `key` 與 `value` 是否產生實質差異。
  - 若內容與本地完全相同，則直接忽略（0 次 Toast、0 次重繪），徹底避免「電腦與手機互跳更新通知死循環」。
  - 僅當內容確有變更時，觸發 1 次提示並更新記憶體與畫面。

### 5. 跨端/跨裝置 3D 即時幾何重構 (`syncCurrentMesh`)
- 水合完成後，必須顯式呼叫 `VoxelDeltaStore.syncCurrentMesh()`。
- 透過更新 Three.js `instancedMesh.setMatrixAt` 與 `setColorAt`，保證手機端、平板端或多開視窗在 0ms 內即時重組幾何體並刷新 2D 切片。

### 6. 本地 0ms 鏡像快照與手動瞬發儲存 (Zero-latency Local Snapshot & Manual Cloud Upload)
- **本地極速寫入**：使用者每一次點擊（塗色、橡皮擦、一鍵鏡像、批量修改），第一時間 0ms 寫入 `localStorage`，重整或斷網不丟失進度。
- **UI 狀態追蹤**：修改後右側工具欄的儲存按鈕進入 dirty 狀態（橘黃脈衝提示）；點擊儲存按鈕時，瞬發打包上傳 Firebase 並重設為綠色已儲存狀態。

---

## 二、品質與驗收準則
- 任何關於體素資料結構、儲存流程或 2D/3D 連動的修改，均需執行全套自動化測試套件（`verify_homepage_ivysaur43_unified_suite.js`、`verify_main_homepage_solidified_suite.js`、`verify_v491_ultimate_sync_suite.js` 等），確保 100% 通過。

