/**
 * Pokopia Voxel Editor & Delta Store
 * 體素手動編輯器核心：差異覆蓋 (Delta Overrides)、歷史復原 (Undo/Redo)、左右鏡像對稱、3D 射線拾取與互動
 */

(function (global) {
  'use strict';

  let _lastLocalActionTimes = {}; // 記錄各角色最近一次本地手動操作時間，用於阻斷 onSnapshot 自身回彈
  const MAX_HISTORY_STEPS = 10; // 嚴格限制最多 10 步復原與重做

  // 11/4 妙蛙草歷史修改搶救資料 (含上色與消除共 1,161 顆方塊)
  const IVYSAUR_SAVED_OVERRIDES = {"60,36,53":-1,"54,37,84":-1,"58,34,45":-1,"69,22,56":1,"30,14,68":-1,"65,0,44":10,"41,17,91":-1,"67,2,57":1,"62,29,86":10,"69,22,69":1,"68,22,42":3,"61,4,57":-1,"56,36,68":-1,"64,22,33":1,"68,23,83":1,"69,22,81":1,"70,22,77":1,"31,13,35":3,"69,26,79":1,"62,35,54":9,"62,29,88":1,"65,33,79":3,"34,27,85":10,"32,16,76":-1,"62,34,43":9,"67,33,72":-1,"39,33,57":1,"33,12,49":-1,"30,12,34":-1,"63,21,90":1,"70,16,37":1,"67,23,85":1,"69,17,52":1,"59,3,33":-1,"69,18,53":1,"61,25,34":1,"69,19,45":1,"66,26,85":10,"67,24,85":1,"34,32,73":3,"30,13,41":-1,"57,3,41":-1,"30,17,57":-1,"59,23,91":11,"59,3,43":-1,"53,18,30":1,"60,1,66":-1,"40,11,81":-1,"55,36,48":9,"57,26,91":3,"47,16,93":-1,"53,35,41":9,"68,25,57":1,"40,16,90":-1,"44,28,91":1,"64,29,86":10,"71,11,58":1,"69,27,78":1,"60,23,91":11,"30,13,68":-1,"32,19,34":-1,"56,34,61":-1,"41,23,91":11,"34,33,76":-1,"56,22,93":1,"64,40,76":-1,"34,29,64":-1,"30,9,34":1,"36,23,88":11,"62,34,84":1,"71,5,59":1,"64,16,87":-1,"63,29,44":3,"69,29,73":1,"70,21,63":1,"70,0,62":1,"31,18,68":-1,"59,2,61":-1,"69,6,33":1,"72,9,60":3,"64,28,43":3,"70,3,67":1,"44,17,93":-1,"63,27,88":11,"65,30,62":1,"69,20,48":1,"69,19,56":1,"68,7,69":1,"30,14,42":-1,"34,14,76":-1,"69,24,80":1,"63,33,66":1,"57,18,30":3,"32,16,77":-1,"68,22,40":1,"30,15,66":3,"36,34,77":-1,"34,15,82":-1,"37,32,65":-1,"30,14,35":-1,"31,29,72":-1,"54,36,52":9,"64,34,77":-1,"30,7,39":3,"68,5,44":1,"69,19,50":1,"56,7,64":1,"34,32,75":3,"37,30,50":1,"70,5,35":1,"65,21,33":1,"35,1,70":10,"69,19,47":1,"69,18,73":1,"65,33,75":-1,"58,9,32":-1,"68,5,32":1,"68,30,78":1,"62,33,65":1,"39,28,89":1,"60,21,92":1,"32,17,69":-1,"63,30,48":3,"68,24,66":1,"66,27,48":3,"72,11,64":3,"65,29,85":10,"42,0,40":1,"60,24,91":12,"31,16,43":-1,"30,13,42":-1,"69,0,36":1,"59,4,59":-1,"29,15,65":3,"67,38,75":3,"70,22,73":1,"70,0,64":1,"50,30,91":1,"32,16,75":-1,"70,20,74":1,"31,40,76":1,"56,36,45":8,"38,35,37":-1,"51,35,52":8,"68,0,43":10,"66,34,73":3,"36,35,78":3,"70,19,78":1,"69,19,46":1,"67,27,57":1,"66,25,40":3,"31,29,76":1,"30,14,36":1,"64,30,52":1,"63,27,38":1,"36,26,85":10,"30,15,41":-1,"63,36,32":9,"65,33,76":-1,"35,33,79":3,"67,9,31":1,"54,4,50":1,"67,26,84":1,"60,27,90":1,"60,36,52":-1,"43,26,91":3,"39,32,53":1,"55,21,94":1,"57,20,94":1,"70,4,67":1,"59,35,36":-1,"71,10,65":3,"55,34,87":3,"69,23,61":1,"31,18,41":-1,"30,15,37":1,"70,16,57":1,"61,1,58":-1,"34,16,31":-1,"34,33,73":-1,"65,30,65":1,"64,40,73":-1,"38,14,86":-1,"31,29,73":1,"41,19,93":-1,"44,39,73":-1,"68,1,43":10,"37,15,87":1,"36,40,74":-1,"68,2,33":1,"68,24,53":1,"70,21,74":1,"34,27,49":1,"68,14,52":1,"42,6,64":1,"70,1,41":10,"41,23,90":11,"60,36,51":-1,"41,24,91":11,"58,25,33":1,"40,27,90":1,"53,32,42":1,"70,20,73":1,"35,36,80":-1,"39,12,72":-1,"32,14,53":1,"69,2,68":10,"72,11,61":3,"58,3,34":-1,"61,3,57":-1,"58,8,65":1,"40,14,88":-1,"61,34,85":1,"59,24,91":11,"60,27,88":12,"67,24,41":3,"38,12,69":-1,"37,32,64":-1,"30,12,56":-1,"31,29,75":1,"66,25,84":10,"31,26,69":-1,"67,27,56":3,"35,34,75":-1,"64,31,62":1,"68,14,51":1,"67,31,79":1,"62,16,30":1,"70,21,72":1,"35,18,88":-1,"64,29,47":3,"34,35,75":-1,"34,33,77":-1,"59,32,43":9,"68,21,50":1,"32,23,57":1,"54,35,47":-1,"45,17,94":-1,"60,33,46":9,"63,21,32":1,"64,27,87":11,"34,37,76":3,"30,15,40":-1,"57,34,46":8,"69,18,47":1,"56,39,75":1,"38,14,30":1,"39,33,40":-1,"69,19,49":1,"62,24,89":11,"70,20,76":1,"63,36,34":8,"68,0,45":10,"60,39,74":-1,"70,4,41":1,"66,32,81":1,"39,39,73":-1,"54,34,39":-1,"58,5,47":1,"60,34,83":-1,"64,39,75":1,"67,26,54":3,"59,35,47":-1,"70,25,76":1,"40,11,69":-1,"70,21,77":1,"68,14,49":1,"69,18,49":1,"58,10,69":1,"68,1,44":10,"48,17,95":-1,"42,0,39":1,"69,28,77":1,"57,8,33":-1,"34,34,74":-1,"29,14,58":-1,"64,40,74":-1,"67,31,80":1,"64,31,65":1,"66,33,73":-1,"64,34,75":-1,"72,9,64":3,"60,4,58":-1,"65,34,68":1,"65,32,67":1,"62,32,54":1,"61,39,76":-1,"65,35,77":-1,"59,10,67":1,"30,21,63":1,"55,34,50":9,"63,36,35":8,"41,36,64":-1,"56,22,31":1,"72,11,65":3,"66,7,55":1,"33,24,85":1,"61,39,75":-1,"70,8,57":3,"69,21,66":1,"30,20,60":-1,"72,13,62":3,"65,29,54":1,"34,35,74":-1,"70,19,75":1,"57,35,62":1,"72,7,63":3,"65,34,75":-1,"47,23,31":1,"65,24,36":1,"56,8,67":1,"31,14,35":1,"69,21,52":1,"30,15,67":3,"56,24,32":1,"70,24,75":1,"62,32,55":1,"70,6,68":1,"36,34,78":3,"67,36,61":9,"67,11,31":1,"64,36,58":9,"48,27,92":3,"41,1,64":1,"29,16,65":-1,"64,31,61":1,"64,25,36":1,"58,36,66":1,"56,5,40":1,"48,23,31":1,"30,13,56":-1,"61,33,58":1,"59,33,50":9,"68,22,39":1,"69,1,35":1,"38,0,44":10,"64,35,76":-1,"62,7,52":1,"54,36,53":9,"70,24,72":1,"57,36,63":-1,"31,18,80":-1,"60,35,68":-1,"65,30,64":1,"68,24,51":1,"69,3,42":1,"42,16,91":-1,"64,36,46":9,"65,32,83":1,"69,19,38":1,"29,14,64":3,"55,10,83":1,"69,29,74":1,"65,27,84":10,"30,19,58":-1,"62,36,39":-1,"43,2,38":1,"40,10,67":1,"59,36,80":-1,"67,28,83":1,"67,32,77":1,"29,15,66":-1,"58,24,91":11,"30,7,40":1,"48,28,92":3,"45,29,91":1,"69,20,55":1,"34,29,61":-1,"69,18,48":1,"71,8,66":3,"41,14,89":-1,"58,10,32":-1,"70,19,74":1,"32,26,82":-1,"34,35,76":-1,"30,19,59":-1,"70,23,77":1,"71,7,65":3,"41,27,35":-1,"72,6,63":1,"41,25,90":12,"68,14,48":1,"70,20,64":1,"66,34,74":-1,"60,36,54":-1,"64,34,78":3,"68,24,50":3,"39,12,83":-1,"70,20,75":1,"61,31,46":1,"58,7,64":-1,"35,33,75":-1,"30,16,39":-1,"69,20,56":1,"69,19,81":1,"33,27,66":-1,"67,30,81":1,"68,10,55":1,"33,12,47":-1,"69,17,50":1,"67,26,51":1,"66,30,83":1,"69,2,58":1,"70,7,68":1,"63,36,33":9,"69,7,57":3,"54,10,84":1,"40,11,75":-1,"29,16,59":-1,"69,20,82":1,"69,0,39":1,"70,21,76":1,"32,2,68":10,"61,39,72":-1,"33,36,74":-1,"29,13,67":-1,"44,39,75":1,"71,3,65":1,"61,0,67":-1,"64,30,54":1,"65,0,33":1,"69,19,55":1,"29,13,64":3,"38,13,70":-1,"65,26,40":1,"36,14,70":-1,"33,24,49":1,"67,36,37":-1,"57,3,36":-1,"60,36,79":-1,"64,36,57":9,"66,34,72":3,"34,29,62":-1,"69,18,50":1,"69,17,53":1,"57,34,53":8,"34,32,77":3,"65,29,53":1,"70,21,73":1,"68,5,56":1,"67,22,36":1,"51,27,34":1,"63,29,87":12,"37,15,86":10,"41,1,63":1,"37,16,87":10,"60,33,45":9,"67,35,38":9,"61,26,35":1,"51,35,48":8,"60,36,55":8,"64,40,75":-1,"41,3,60":1,"66,32,74":3,"70,2,37":1,"33,12,50":-1,"33,17,83":-1,"33,35,73":-1,"70,20,78":1,"31,18,42":-1,"46,34,88":1,"55,9,32":1,"70,21,75":1,"69,1,69":10,"69,29,76":1,"32,23,49":1,"34,36,78":-1,"69,20,47":1,"60,30,41":1,"64,23,86":1,"66,23,86":10,"71,3,61":1,"62,35,48":9,"69,17,51":1,"28,13,63":3,"72,10,63":3,"33,12,51":-1,"65,27,86":10,"43,32,41":9,"67,27,59":1,"70,4,35":1,"28,10,65":3,"70,19,77":1,"69,28,72":1,"62,30,88":1,"70,25,75":1,"69,18,52":1,"72,9,61":3,"30,11,42":-1,"34,2,44":10,"70,2,59":1,"66,36,75":-1,"58,33,88":1,"30,15,68":-1,"69,23,62":1,"69,23,64":1,"67,4,56":1,"34,29,63":-1,"64,33,83":1,"63,25,35":1,"68,8,69":1,"59,31,89":1,"72,8,64":3,"68,21,37":1,"66,27,50":3,"29,18,62":-1,"47,12,30":-1,"61,0,59":-1,"66,31,82":1,"62,20,91":1,"58,35,67":-1,"63,36,52":9,"59,2,60":-1,"70,3,37":1,"68,28,68":1,"63,17,88":10,"69,23,60":1,"69,28,76":1,"38,13,30":1,"64,21,89":1,"69,21,54":1,"61,5,68":-1,"60,31,44":1,"65,30,59":1,"70,23,72":1,"31,15,55":-1,"33,15,75":-1,"45,31,40":-1,"65,28,47":3,"36,39,74":1,"58,5,46":1,"69,15,43":1,"72,6,62":1,"30,21,62":1,"30,21,79":1,"31,26,80":-1,"58,34,46":-1,"67,26,52":1,"33,14,31":-1,"62,27,89":12,"35,16,85":-1,"63,30,86":1,"55,24,93":1,"31,18,35":-1,"31,13,33":-1,"71,17,63":1,"61,34,58":9,"30,1,66":-1,"36,29,50":1,"36,34,79":3,"32,37,74":-1,"35,19,88":1,"36,40,73":-1,"60,36,40":8,"67,23,38":1,"69,21,55":1,"69,17,47":1,"68,23,47":3,"69,19,53":1,"62,36,64":9,"69,20,46":1,"32,22,45":1,"64,35,42":9,"34,19,86":1,"66,21,87":1,"61,33,42":9,"38,32,56":1,"69,19,40":1,"59,4,66":-1,"62,7,46":1,"31,12,55":-1,"52,35,50":-1,"62,35,55":9,"28,9,60":1,"33,17,32":-1,"30,13,34":-1,"55,35,66":-1,"59,36,64":-1,"37,17,88":10,"68,14,47":1,"59,21,31":1,"31,17,75":-1,"35,17,87":-1,"70,8,68":1,"35,33,77":-1,"30,20,79":1,"41,26,90":12,"59,28,90":3,"67,25,45":3,"67,25,46":3,"43,2,39":1,"29,17,60":-1,"30,10,34":1,"72,12,62":3,"66,32,78":3,"67,24,42":3,"33,26,58":3,"60,33,87":1,"31,14,34":1,"72,10,64":3,"71,2,64":1,"30,8,35":1,"59,4,43":-1,"68,31,71":1,"33,13,31":-1,"31,14,33":-1,"30,15,36":-1,"71,9,66":3,"34,32,78":3,"51,36,46":9,"65,36,77":3,"69,18,54":1,"29,13,58":-1,"40,34,86":1,"40,34,62":-1,"65,10,53":1,"71,4,60":1,"70,24,77":1,"70,21,78":1,"41,22,92":1,"37,18,90":-1,"52,23,31":1,"35,34,78":-1,"29,16,60":-1,"31,12,33":1,"33,15,74":-1,"36,16,87":-1,"71,8,58":3,"31,27,70":-1,"64,23,88":11,"71,8,67":1,"29,7,66":1,"30,19,75":1,"28,8,65":1,"41,11,70":-1,"70,23,71":1,"65,36,44":9,"42,24,92":12,"52,4,52":1,"37,23,89":11,"33,12,52":-1,"58,35,48":8,"59,2,65":-1,"69,23,81":1,"35,33,76":-1,"33,15,78":-1,"65,36,75":3,"33,38,75":3,"57,34,47":8,"29,16,66":-1,"69,17,48":1,"61,35,80":-1,"37,27,86":10,"33,32,78":1,"53,36,53":9,"38,15,30":1,"58,27,91":3,"59,36,42":-1,"69,20,53":1,"67,1,33":1,"60,34,86":1,"69,19,82":1,"69,19,71":1,"61,33,57":1,"70,25,73":1,"35,23,87":10,"29,8,66":1,"30,12,42":-1,"65,27,44":3,"70,0,65":1,"61,34,47":9,"60,4,44":-1,"28,12,64":3,"59,35,48":-1,"61,32,51":1,"59,36,41":8,"70,24,71":1,"69,19,54":1,"39,35,66":-1,"32,14,32":-1,"72,8,63":3,"37,12,77":-1,"67,0,68":10,"72,10,65":3,"55,34,88":3,"59,33,52":9,"66,32,77":3,"30,17,67":-1,"58,21,93":1,"34,33,74":-1,"38,35,49":-1,"69,19,51":1,"63,8,53":1,"66,27,85":10,"63,23,87":1,"46,18,95":-1,"72,11,62":3,"70,8,34":1,"57,7,34":-1,"61,34,82":-1,"61,7,54":1,"38,29,88":1,"38,31,51":1,"43,2,37":1,"70,23,78":1,"29,7,67":1,"61,39,73":-1,"70,11,34":1,"68,14,46":1,"67,29,82":1,"32,25,58":3,"32,25,65":-1,"63,30,49":3,"39,39,75":-1,"69,21,56":1,"67,25,53":3,"33,35,72":3,"59,31,43":1,"29,12,67":-1,"70,21,62":1,"70,16,38":1,"60,3,67":-1,"71,9,67":1,"30,6,68":1,"68,24,54":1,"32,18,84":-1,"33,16,81":-1,"42,6,61":1,"64,18,31":1,"35,35,76":-1,"31,36,73":-1,"32,25,67":-1,"70,7,57":3,"70,22,76":1,"34,32,72":3,"30,19,66":-1,"34,32,74":3,"58,24,92":12,"61,36,40":-1,"61,29,40":1,"71,11,67":1,"67,35,73":-1,"52,36,54":-1,"69,19,39":1,"63,8,46":1,"62,28,88":12,"69,15,55":1,"67,29,67":1,"72,12,61":3,"62,13,30":1,"70,7,34":1,"60,35,34":-1,"60,29,90":1,"45,27,92":1,"38,24,89":11,"33,35,74":-1,"34,32,71":3,"69,21,69":1,"70,20,79":1,"62,34,81":-1,"53,23,31":1,"63,15,86":1,"34,20,33":-1,"65,21,88":1,"68,21,38":1,"67,26,53":3,"67,32,78":1,"68,29,69":1,"33,24,46":1,"62,36,63":9,"30,19,74":1,"56,5,37":-1,"29,17,65":-1,"35,33,78":3,"67,26,58":1,"62,28,39":1,"63,31,54":1,"39,29,88":12,"32,17,81":-1,"70,2,39":1,"64,31,60":1,"72,12,63":3,"42,5,63":1,"34,15,71":-1,"68,14,50":1,"72,10,61":3,"57,34,48":8,"65,33,78":3,"67,25,84":1,"66,32,76":3,"34,33,75":-1,"61,28,89":1,"33,15,77":-1,"70,5,41":1,"43,2,40":1,"35,35,78":3,"34,34,75":-1,"60,32,49":1,"65,30,60":1,"35,34,79":3,"48,19,95":3,"69,17,49":1,"39,39,76":-1,"32,17,33":-1,"65,35,78":3,"72,8,65":3,"69,20,81":1,"64,34,79":3,"29,15,59":-1,"34,11,54":-1,"56,35,86":3,"38,19,91":-1,"63,31,53":1,"59,34,84":-1,"67,21,86":1,"70,8,42":1,"69,18,46":1,"38,17,89":-1,"56,36,85":3,"54,28,35":1,"31,18,72":-1,"70,36,37":9,"31,16,55":-1,"65,31,84":1,"69,4,57":1,"30,1,60":-1,"66,32,68":1,"38,12,81":-1,"65,1,44":10,"60,0,34":-1,"62,7,51":1,"38,27,87":11,"66,33,74":-1,"58,36,69":-1,"35,36,77":3,"42,28,36":-1,"42,6,62":1,"63,5,68":1,"66,28,55":3,"33,36,75":-1,"57,5,52":1,"66,35,74":-1,"33,27,65":-1,"67,37,74":3,"38,18,87":10,"69,18,79":1,"66,27,49":3,"65,5,45":1,"34,36,76":-1,"66,32,73":3,"33,25,58":1,"62,7,50":1,"72,9,65":3,"71,7,58":3,"62,35,56":9,"53,20,30":1,"72,8,61":3,"66,36,76":-1,"68,22,50":1,"61,39,74":-1,"64,27,40":1,"64,24,87":11,"49,31,90":1,"33,37,75":-1,"33,13,54":-1,"31,13,34":1,"69,19,48":1,"69,19,52":1,"30,12,68":-1,"58,34,38":-1,"65,28,48":3,"70,3,36":1,"69,22,58":1,"69,14,55":1,"63,15,87":1,"69,29,75":1,"52,19,95":3,"69,25,80":1,"42,5,62":1,"69,24,69":1,"31,28,71":-1,"66,7,69":3,"42,27,91":3,"68,22,67":1,"30,21,61":-1,"68,23,46":3,"67,36,74":-1,"62,7,47":1,"70,22,78":1,"65,35,76":-1,"68,23,45":3,"61,36,39":8,"32,14,46":1,"64,23,34":1,"37,30,86":1,"34,23,86":10,"55,36,44":8,"69,3,34":1,"67,24,40":3,"33,12,48":-1,"63,23,89":11,"37,31,56":1,"42,0,37":1,"65,35,70":-1,"42,4,63":1,"65,27,43":3,"65,34,79":3,"72,12,64":3,"31,25,69":-1,"72,13,63":3,"70,3,40":1,"32,35,72":-1,"65,33,77":-1,"39,26,88":12,"70,20,77":1,"68,22,41":3,"72,7,64":3,"69,20,51":1,"35,34,76":-1,"66,32,75":3,"52,36,53":-1,"64,30,85":10,"67,26,49":3,"66,29,84":1,"64,39,74":1,"28,11,65":3,"55,5,56":1,"35,28,49":1,"68,25,58":1,"35,23,85":10,"70,2,38":1,"69,0,37":1,"63,36,31":9,"54,5,38":1,"54,36,51":-1,"69,20,50":1,"35,14,72":-1,"33,19,86":-1,"55,8,33":1,"58,30,90":1,"67,32,69":1,"60,36,67":1,"42,24,91":11,"55,36,53":-1,"65,23,87":10,"63,35,38":-1,"30,13,35":-1,"71,7,67":1,"67,26,50":3,"37,29,87":12,"72,7,62":3,"70,24,76":1,"36,40,76":-1,"65,17,31":1,"32,20,45":1,"70,15,37":1,"66,35,75":-1,"59,34,87":1,"70,9,57":3,"32,16,78":-1,"67,9,45":1,"35,34,77":-1,"34,11,46":-1,"36,40,75":-1,"55,36,52":-1,"68,24,52":1,"70,36,38":9,"67,37,75":-1,"70,4,58":1,"68,29,79":1,"71,4,66":1,"66,26,44":3,"59,22,92":1,"58,23,92":11,"58,5,45":1,"31,11,42":3,"33,15,73":-1,"69,18,51":1,"39,39,74":-1,"63,32,61":1,"60,8,31":-1,"29,17,64":-1,"63,34,78":3,"64,30,53":1,"38,12,73":-1,"68,31,72":1,"31,18,36":-1,"69,20,52":1,"68,14,53":1,"59,34,61":-1,"41,34,61":-1,"65,34,76":-1,"67,10,31":1,"67,0,58":1,"57,35,63":1,"70,20,63":1,"66,28,56":1,"69,18,41":1,"32,22,50":1,"71,10,67":1,"66,37,77":3,"36,23,87":10,"69,22,57":1,"71,8,65":3,"69,21,81":1,"40,24,90":12,"41,34,87":1,"49,37,84":3,"69,21,53":1,"42,23,92":11,"65,31,66":1,"62,15,30":1,"70,21,79":1,"69,23,63":1,"35,35,77":-1,"37,14,85":-1,"60,36,41":-1,"58,5,33":-1,"41,28,90":3,"64,13,80":1,"47,33,89":1,"59,33,51":9,"38,16,30":1,"69,21,57":1,"70,22,72":1,"58,35,62":-1,"36,35,81":-1,"36,13,73":-1,"33,15,76":-1,"66,37,76":3,"58,10,78":1,"60,36,50":-1,"69,18,56":1,"70,25,74":1,"69,20,49":1,"67,23,39":3,"31,15,43":-1,"58,29,38":-1,"71,2,62":1,"33,34,73":-1,"53,36,54":-1,"31,1,69":10,"60,2,59":-1,"64,36,77":3,"62,7,49":1,"70,7,42":1,"62,31,49":1,"66,33,75":-1,"65,2,69":-1,"42,0,38":1,"70,15,38":1,"57,8,66":1,"59,32,44":9,"65,11,30":1,"72,11,63":3,"70,19,76":1,"62,7,48":1,"32,16,74":-1,"61,30,89":1,"31,19,42":-1,"69,20,54":1,"60,36,49":-1,"29,8,65":1,"66,36,71":-1,"30,7,37":1,"64,35,78":3,"68,28,80":1,"64,8,55":-1,"60,33,54":1,"39,16,89":-1,"30,14,41":-1,"62,30,45":1,"67,27,58":1,"57,7,63":1,"55,30,38":1,"42,29,38":-1,"65,30,61":1,"38,36,30":9,"62,36,30":9,"37,36,30":9,"63,36,30":9,"31,36,37":9,"32,37,63":9,"35,36,62":9,"57,21,31":1,"56,20,31":1,"60,19,31":3,"60,18,31":3,"60,17,31":3,"59,16,31":3,"68,21,43":1,"66,26,50":1,"64,29,50":1,"35,18,87":1,"65,18,87":1,"35,17,86":1,"65,17,86":1,"37,18,89":10,"63,18,89":10,"64,16,86":1,"36,16,86":1,"50,37,84":3,"46,26,92":1,"48,26,92":3,"48,29,91":1,"35,0,45":-1,"33,0,69":-1,"33,1,69":-1,"68,0,69":10,"32,0,69":10,"68,1,69":10,"32,1,69":10,"31,0,70":10,"69,0,70":10,"38,0,70":10,"62,0,70":10,"37,1,45":10,"66,0,45":10,"34,0,45":10,"70,0,40":10,"70,1,40":10,"30,1,40":10,"70,1,42":-1,"30,1,42":-1,"69,2,41":-1,"31,2,41":-1,"64,1,45":-1,"36,1,45":-1,"32,1,45":-1,"66,1,45":10,"34,1,45":10,"31,0,39":1,"69,2,40":10,"38,2,68":10,"67,32,76":1,"38,33,63":-1,"40,34,64":-1,"40,34,63":-1,"38,33,62":-1,"37,32,60":-1,"38,30,87":1,"65,34,74":3,"35,34,74":3,"34,34,73":3,"67,36,62":9,"33,36,62":9,"32,36,73":-1,"32,36,72":1,"34,36,75":-1,"36,36,78":3,"68,40,73":-1,"32,40,73":-1,"67,40,73":-1,"33,40,73":-1,"66,40,73":-1,"34,40,73":-1,"65,40,73":-1,"35,40,73":-1,"68,36,73":-1,"68,33,72":-1,"32,33,72":-1,"68,34,72":-1,"32,34,72":-1,"32,32,71":-1,"69,40,76":1,"69,40,75":1,"69,39,74":1,"69,38,73":1,"69,37,72":1,"68,38,74":3,"32,38,74":3,"67,38,74":3,"33,38,74":3,"67,32,71":-1,"33,32,71":-1,"68,33,70":-1,"32,33,70":-1,"68,33,71":-1,"32,33,71":-1,"33,33,71":-1,"68,32,70":-1,"32,32,70":-1,"61,33,64":-1,"39,33,64":-1,"32,31,70":-1,"33,33,72":-1,"67,34,72":-1,"33,34,72":-1,"66,33,72":3,"34,33,72":3,"34,34,72":3,"68,37,73":3,"32,37,73":3,"68,38,73":3,"32,38,73":3,"69,37,73":1,"65,33,80":3,"35,33,80":3,"65,34,80":1,"35,34,80":1,"66,33,80":1,"34,33,80":1,"67,32,72":-1,"68,30,70":1,"65,35,79":1,"36,36,80":-1,"64,36,80":-1,"33,36,73":3,"33,32,72":-1,"69,36,72":1,"66,35,73":3,"34,35,73":3,"65,36,76":-1,"35,36,76":-1,"36,36,77":3,"64,36,76":3,"36,36,76":3,"35,36,75":3,"66,37,75":3,"34,37,75":3,"66,36,74":3,"34,36,74":3,"64,35,77":3,"36,35,77":3,"65,35,75":-1,"35,35,75":-1,"65,37,76":3,"35,37,76":3,"65,37,77":3,"35,37,77":3,"64,34,76":-1,"36,34,76":-1,"64,35,75":3,"36,35,75":3,"65,35,74":3,"35,35,74":3,"33,37,74":3,"69,39,75":1,"69,38,74":1,"33,32,73":-1,"33,32,74":-1,"33,32,75":-1,"64,33,77":3,"36,33,77":3,"65,32,77":3,"35,32,77":3,"68,34,70":1,"67,33,71":-1,"66,33,71":3,"34,33,71":3,"65,33,74":-1,"35,33,74":-1,"64,33,74":3,"36,33,74":3,"65,33,73":3,"35,33,73":3,"65,32,74":3,"35,32,74":3,"65,32,76":3,"35,32,76":3,"65,32,75":3,"35,32,75":3,"64,33,75":3,"36,33,75":3,"64,33,76":3,"36,33,76":3,"63,34,75":3,"37,34,75":3,"63,34,74":3,"37,34,74":3,"64,34,74":3,"36,34,74":3,"37,34,78":3,"63,34,77":3,"37,34,77":3,"63,34,76":3,"37,34,76":3,"63,35,76":3,"37,35,76":3,"66,34,71":3,"34,34,71":3,"65,34,73":3,"35,34,73":3,"66,35,72":3,"34,35,72":3,"65,35,73":3,"35,35,73":3,"36,34,73":3,"64,34,73":3,"36,35,74":3,"64,35,74":3,"37,35,75":3,"63,35,75":3,"37,35,77":3,"63,35,77":3,"66,36,73":3,"34,36,73":3,"65,36,74":3,"35,36,74":3,"64,36,75":3,"36,36,75":3,"67,33,69":1,"32,37,71":-1,"68,35,72":-1,"68,34,71":-1,"32,34,71":-1,"68,35,70":1,"32,35,70":1,"68,39,74":3,"32,39,74":3,"33,34,71":1,"68,39,75":3,"32,39,75":3,"33,37,72":1,"34,37,74":1,"37,37,78":1,"63,37,78":1,"54,37,81":-1,"56,37,80":-1,"46,37,84":-1,"58,37,78":-1};

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
            const data = parsed.data !== undefined ? parsed.data : parsed;
            const count = (data && typeof data === 'object') ? Object.keys(data).length : 0;
            // 妙蛙草正式定稿 1,321 顆 (1321)：凡本地快取為空、舊版（<= 1161 顆）或前一版（1384 顆），升級定稿為 1,321 顆！
            if (charKey === 'ivysaur') {
              if (count === 0 || count <= 1161 || count === 1384) {
                return Object.assign({}, IVYSAUR_SAVED_OVERRIDES);
              }
            }
            if (count > 0) return data;
          }
        }
      }
    } catch (e) {
      console.warn('[VoxelStore] LocalStorage load error:', e);
    }
    if (charKey === 'ivysaur' && typeof IVYSAUR_SAVED_OVERRIDES !== 'undefined') {
      return Object.assign({}, IVYSAUR_SAVED_OVERRIDES);
    }
    return {};
  }

  // 狀態按鈕視覺更新 (未儲存高亮亮起、儲存中、已儲存)
  function updateSaveButtonUI(charKey, status) {
    if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
    const btn = document.getElementById(`btnSaveCloud_${charKey}`);
    if (!btn) return;
    const icon = btn.querySelector('.ve-save-icon');
    const text = btn.querySelector('.ve-save-text');

    if (status === 'dirty') {
      btn.classList.add('is-dirty');
      btn.removeAttribute('disabled');
      if (icon) icon.textContent = '💾';
      if (text) text.textContent = '儲存修改 (未儲存)';
    } else if (status === 'saving') {
      btn.classList.remove('is-dirty');
      btn.setAttribute('disabled', 'true');
      if (icon) icon.textContent = '⏳';
      if (text) text.textContent = '儲存中...';
    } else {
      btn.classList.remove('is-dirty');
      btn.removeAttribute('disabled');
      if (icon) icon.textContent = '✔';
      if (text) text.textContent = '已儲存至雲端';
      setTimeout(() => {
        if (!btn.classList.contains('is-dirty')) {
          if (icon) icon.textContent = '✔';
          if (text) text.textContent = '已是最新';
        }
      }, 2500);
    }
  }

  // 手動儲存按鈕動作：點擊時一次性完整寫入 Firebase 與 LocalStorage
  async function saveOverridesToCloud(charKey) {
    if (typeof window === 'undefined') return { success: false };
    const char = _state.characters[charKey];
    if (!char) return { success: false };

    updateSaveButtonUI(charKey, 'saving');
    const now = Date.now();
    saveOverridesToStorage(charKey, now);

    let res = { success: true, cloud: false };
    if (window.PokopiaFirebase && typeof window.PokopiaFirebase.saveVoxelOverrides === 'function') {
      res = await window.PokopiaFirebase.saveVoxelOverrides(charKey, getOverrides(charKey), now);
    }

    char.isDirty = false;
    updateSaveButtonUI(charKey, 'saved');

    // 彈出成功提示
    if (typeof showToast === 'function') {
      showToast('✔ 已成功儲存至 Google 雲端！');
    }
    return res;
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

  // 妙蛙草歷史存檔自救水合：若 LocalStorage 為空、或方塊數為 1,161 舊版、或 1,384 舊版，自動清洗為 1,321 顆定稿版！
  if (typeof localStorage !== 'undefined' && _state.characters.ivysaur) {
    try {
      const storageKey = 'pokopia_voxel_overrides_ivysaur';
      const localRaw = localStorage.getItem(storageKey);
      let localCount = 0;
      if (localRaw) {
        const parsed = JSON.parse(localRaw);
        const data = (parsed && parsed.data !== undefined) ? parsed.data : parsed;
        localCount = Object.keys(data || {}).length;
      }
      if (localCount === 0 || localCount <= 1161 || localCount === 1384) {
        _state.characters.ivysaur.overrides = Object.assign({}, IVYSAUR_SAVED_OVERRIDES);
        saveOverridesToStorage('ivysaur');
        if (typeof window !== 'undefined' && window.PokopiaFirebase && typeof window.PokopiaFirebase.saveVoxelOverrides === 'function') {
          window.PokopiaFirebase.saveVoxelOverrides('ivysaur', _state.characters.ivysaur.overrides);
        }
      }
    } catch (e) {
      console.warn('[VoxelStore] Auto-hydration error:', e);
    }
  }

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
      char.isDirty = true;
      _lastLocalActionTimes[charKey] = Date.now();
      const affectedCoords = historyRecord.map(h => ({ x: h.x, y: h.y, z: h.z }));
      notifyListeners(charKey, false, affectedCoords);
      updateSaveButtonUI(charKey, 'dirty');
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
    _lastLocalActionTimes[charKey] = Date.now();
    char.isDirty = true;
    const affectedCoords = redoRecord.map(h => ({ x: h.x, y: h.y, z: h.z }));
    notifyListeners(charKey, false, affectedCoords);
    updateSaveButtonUI(charKey, 'dirty');
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
    _lastLocalActionTimes[charKey] = Date.now();
    char.isDirty = true;
    const affectedCoords = historyRecord.map(h => ({ x: h.x, y: h.y, z: h.z }));
    notifyListeners(charKey, false, affectedCoords);
    updateSaveButtonUI(charKey, 'dirty');
    return true;
  }

  // 恢復官方原版預設值
  function resetToDefault(charKey) {
    const char = _state.characters[charKey];
    if (!char) return;
    char.overrides = {};
    char.history = [];
    char.redoStack = [];
    char.isDirty = false;
    _lastLocalActionTimes[charKey] = 0;
    notifyListeners(charKey);
    updateSaveButtonUI(charKey, 'saved');
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

  function notifyListeners(charKey, skipBroadcast = false, affectedCoords = null, isDrag = false) {
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

    // 5. 持久化存儲至本地 LocalStorage (防未存檔意外關閉丟失)
    saveOverridesToStorage(charKey);

    // 6. 標記未儲存狀態 (手動儲存模式：編輯期間純本地操作不發出連網請求，徹底杜絕反彈)
    if (!skipBroadcast && _state.characters[charKey] && _state.characters[charKey].isDirty) {
      updateSaveButtonUI(charKey, 'dirty');
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

  // 從 Google 雲端水合注入修改 (跨裝置手機載入時 100% 直接以雲端為最高權威優先水合)
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

        // 核心邏輯：
        // 1. 本地編輯保護（Anti-Bounce 反彈阻斷）：
        // 若本地在過去 10 秒內剛執行過手動操作 (_lastLocalActionTime)，且遠端時間不高於該操作，
        // 判定為本地發出寫入後產生的自身回音 (Echo) 或舊快照，絕對阻斷覆蓋本地塗色！
        let shouldHydrate = false;
        const lastAction = _lastLocalActionTimes[k] || 0;
        const isRecentLocalAction = (lastAction > 0 && (Date.now() - lastAction < 10000));
        if (isRecentLocalAction) {
          if (remoteTime !== null && remoteTime > lastAction) {
            shouldHydrate = true;
          } else {
            shouldHydrate = false; // 阻斷自身回音
          }
        } else if (_state.characters[k] && _state.characters[k].isDirty) {
          // 本地正在手動編輯中且尚未點擊儲存，維持本地編輯狀態
          shouldHydrate = false;
        } else if (remoteTime !== null) {
          // 重新整理或初次載入：雲端手動存檔具備最高權威，無條件直接載入
          shouldHydrate = true;
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
            <button type="button" class="ve-btn ve-btn-save-cloud" id="btnSaveCloud_${charKey}" title="點擊將當前所有修改儲存至 Google 雲端帳號" style="width:100%;margin-top:4px;">
              <span class="ve-save-icon">✔</span>
              <span class="ve-save-text">已是最新</span>
            </button>
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

      if (target.id.startsWith('btnSaveCloud_') || target.closest('[id^="btnSaveCloud_"]')) {
        saveOverridesToCloud(charKey);
        return;
      }

      if (target.id.startsWith('btnReset_')) {
        const confirmMsg = '⚠️ 警告：這將會清除您對當前角色的所有自訂方塊與改動，恢復為官方預設值，且無法撤銷！\n\n確定要重置嗎？';
        if (confirm(confirmMsg)) {
          resetToDefault(charKey);
          _lastLocalActionTimes[charKey] = Date.now();
          saveOverridesToStorage(charKey);
          saveOverridesToCloud(charKey);
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
    saveOverridesToCloud,
    resetLocalActionTime: function (charKey) {
      if (charKey) {
        _lastLocalActionTimes[charKey] = 0;
        if (_state.characters[charKey]) _state.characters[charKey].isDirty = false;
      } else {
        _lastLocalActionTimes = {};
        Object.keys(_state.characters).forEach(k => {
          if (_state.characters[k]) _state.characters[k].isDirty = false;
        });
      }
    },
    // Three 編輯器模組
    attachEditorToScene,
    attachEditorTo2D,
    syncThreeMeshFromOverrides,
    updateToolbarUI
  };

  // 網頁載入時若有已存在的修改，主動為其做一次備份
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      ['bulbasaur', 'ivysaur', 'venusaur', 'buzz'].forEach(k => {
        const ov = getOverrides(k);
        if (ov && Object.keys(ov).length > 0) {
          saveOverridesToStorage(k);
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
