/* Danh sách bản vẽ (tạo bởi tools/add_drawings.py; sửa tay title/note được). */
const GUIDE_DRAWINGS = [
 {
  "file": "an-hung",
  "title": "An Hưng — phân vùng INV, lắp pin NLMT",
  "note": "Bản vẽ hoàn công (KC-00, 25/12/2020): mặt bằng mái, các dãy pin và phân vùng inverter.",
  "landscape": false,
  "md5": "923a7da0061c5cf6a71c59d2164778e4"
 },
 {
  "file": "dong-tam",
  "title": "Đồng Tâm (HDV) — sơ đồ mái pin",
  "note": "Sơ đồ mái pin theo từng inverter, kèm bảng string và số tấm.",
  "landscape": true,
  "md5": "15039206f9cbb53e5849adedf66283d1"
 },
 {
  "file": "loc-thai",
  "title": "Lộc Thái (HDV) — sơ đồ mái pin",
  "note": "Sơ đồ mái pin theo từng inverter, kèm bảng công suất, string và số tấm.",
  "landscape": true,
  "md5": "1182e3aa5ccb4542a7b71c535a616918"
 },
 {
  "file": "loc-hiep-le-minh",
  "title": "Lộc Hiệp – Lê Minh — sơ đồ mái pin",
  "note": "Sơ đồ mái pin theo từng inverter, kèm bảng công suất, string và số tấm.",
  "landscape": true,
  "md5": "d653321a8d578510d6e89e0bd98d9188"
 },
 {
  "file": "dong-tam-998kw",
  "title": "Đồng Tâm (HDV) — tổng hợp 998,4 kWp",
  "note": "Sơ đồ mái pin kèm bảng tổng: 2.496 tấm, công suất tổng 998,4 kWp.",
  "landscape": true,
  "md5": "ad3babc5abfade8c3d0b4ceefc264741"
 },
 {
  "file": "loc-thai-le-minh",
  "title": "Lộc Thái – Lê Minh — sơ đồ mái pin",
  "note": "Sơ đồ mái pin theo từng inverter, kèm bảng công suất, string và số tấm.",
  "landscape": true,
  "md5": "7bcf8fc8ed24a8ffa9cf61144ca227e5"
 },
 {
  "file": "minh-hung",
  "title": "Minh Hưng (HDV) – Lê Minh — sơ đồ mái pin",
  "note": "Sơ đồ mái pin theo từng inverter, kèm bảng công suất, string và số tấm.",
  "landscape": true,
  "md5": "5df20a3734093188013bab97946ed787"
 },
 {
  "file": "tan-hung",
  "title": "Tân Hưng – Lê Minh — sơ đồ mái pin",
  "note": "Sơ đồ mái pin theo từng inverter, kèm bảng string.",
  "landscape": true,
  "md5": "b05c5f981aea45191b169b96448d258f"
 },
 {
  "file": "thuan-loi",
  "title": "Thuận Lợi (HDV) — sơ đồ mái pin",
  "note": "Sơ đồ mái pin theo từng inverter, kèm bảng công suất, string và số tấm (tổng 988,16 kWp, 2.240 tấm).",
  "landscape": true,
  "md5": "6e1237384dc991c1449125de7a052c39"
 },
 {
  "file": "mai-c-atung-cong",
  "title": "Mái của Tùng Công",
  "note": "",
  "landscape": true,
  "md5": "e50f0a6769413ec50a6d8951434b49aa"
 },
 {
  "file": "nlmt-an-phu-12mwp",
  "title": "An Phú Bình Long 1,2 MWp — sơ đồ string",
  "note": "",
  "landscape": false,
  "md5": "9e9ba4bf26b47567aa0d93861ec1a64f"
 },
 {
  "file": "tr-i-heo-l-c-thu-n-999kwp",
  "title": "Trại heo Lộc Thuận 999 kWp",
  "note": "",
  "landscape": false,
  "md5": "dc7b44becf415ce3e6123c1ae84cae1a"
 },
 {
  "file": "nlmt-gia-han-12m",
  "title": "Gia Hân Hớn Quản 1,2 MWp — sơ đồ string",
  "note": "",
  "landscape": false,
  "md5": "02faf326e7402f4fa33f3d08b8f7aba2"
 },
 {
  "file": "1-hi-p-minh-th-nh-02-bv-pin-vi-tri-moi-355kwp",
  "title": "Hiệp Minh Thịnh 02 — bản vẽ pin vị trí mới 355 kWp",
  "note": "",
  "landscape": false,
  "md5": "63aae86a5ba3a6a74d6877cfe0d4faee"
 },
 {
  "file": "hoang-vien-long-binh",
  "title": "Hoàng Viên – Long Bình — sơ đồ nguyên lý",
  "note": "",
  "landscape": true,
  "md5": "3ac9e5f98a5e849e32f1e5550ee38da9"
 },
 {
  "file": "hc-hmt-1-m-26-05-2021",
  "title": "Hoàn công HMT 1 MW (26/05/2021)",
  "note": "",
  "landscape": false,
  "md5": "dce75017c7fc6e67268021b12f485120"
 },
 {
  "file": "nl-xanh-tuan-minh",
  "title": "NL Xanh Tuấn Minh — phân vùng inverter",
  "note": "",
  "landscape": false,
  "md5": "b1b4c54d6a8e58dd22614a062f6f9b6b"
 },
 {
  "file": "tk-hmt-2-498-4kwp-ray",
  "title": "Thiết kế HMT 2 — 498,4 kWp (ray)",
  "note": "",
  "landscape": false,
  "md5": "757d1ae6144d8f61f0f3c00546fb2743"
 },
 {
  "file": "tr-i-heo-nam-nh-t-999kwp",
  "title": "Trại heo Nam Nhất 999 kWp",
  "note": "",
  "landscape": false,
  "md5": "446dbb7cccba0936d5aae40b5716c8f3"
 },
 {
  "file": "l-c-kh-nh-01-inv1",
  "title": "Lộc Khánh 01 — INV1",
  "note": "",
  "landscape": false,
  "md5": "bae6d1aed61dcf6e9a544d32b87be614"
 },
 {
  "file": "tk-nguyen-van-thang-model-1",
  "title": "Thiết kế Nguyễn Văn Thắng",
  "note": "",
  "landscape": false,
  "md5": "5a7a33a1797240d22b6adbe91710f545"
 },
 {
  "file": "hoang-vien-loc-hiep",
  "title": "Hoàng Viên – Lộc Hiệp — sơ đồ nguyên lý",
  "note": "",
  "landscape": true,
  "md5": "111629b7b490650f7b1425a0a19553c2"
 },
 {
  "file": "nlmt-570kwp-hmt-g-4tuan-cap",
  "title": "NLMT 570 kWp HMT (G 4Tuan Cap)",
  "note": "",
  "landscape": true,
  "md5": "69ab836a15188a33bd2fb40c9e0b0d3d"
 },
 {
  "file": "hc-cty-khoi-minh-1",
  "title": "Hoàn công Cty Khôi Minh",
  "note": "",
  "landscape": false,
  "md5": "e7ca9d11071381092eba24d70b7fd51c"
 },
 {
  "file": "l-c-kh-nh-01-lap-pin-2",
  "title": "Lộc Khánh 01 — lắp pin 2",
  "note": "",
  "landscape": false,
  "md5": "8e176e5abdd38d169f389e5f50bd0b44"
 },
 {
  "file": "phan-noi-ray-trai-phuoc-thien-9",
  "title": "Phân nối ray — Trại Phước Thiện 9",
  "note": "",
  "landscape": false,
  "md5": "adfc94aa999c5345bd95cbdf35073fec"
 },
 {
  "file": "nlmt-gia-han-12kwp",
  "title": "Gia Hân Bình Long 1,2 MWp — sơ đồ string",
  "note": "",
  "landscape": false,
  "md5": "2c67bfa3eadb45f41bf8dd8f717acd16"
 },
 {
  "file": "solar-panel-layout-tt-t-mai-model",
  "title": "Solar panel layout TT.T.Mai",
  "note": "",
  "landscape": true,
  "md5": "13a4eb92e1dd7685b5b292b329fddc20"
 },
 {
  "file": "danh-dau-string-trai-phuoc-thien-9",
  "title": "Đánh dấu string — Trại Phước Thiện 9",
  "note": "",
  "landscape": false,
  "md5": "835ed44f86fc8bdbcd23dea0e82bb665"
 },
 {
  "file": "gia-phuc",
  "title": "Gia Phúc — phân vùng inverter",
  "note": "",
  "landscape": false,
  "md5": "c6059aefae75c35136b90a032491ecf8"
 },
 {
  "file": "tttm-mr-68-04kwp",
  "title": "TTTM MR 68,04 kWp",
  "note": "",
  "landscape": false,
  "md5": "2ddc5b9b8d7fa30607fed5bb67461dd2"
 },
 {
  "file": "bv-hc-cty-trong-dat-model-1",
  "title": "Bản vẽ hoàn công Cty Trong Dat",
  "note": "",
  "landscape": false,
  "md5": "5b4b5630255ec0dd6ec3bac996493bfd"
 },
 {
  "file": "ph-ng-tuy-n-ch-thanh",
  "title": "Phương tuyến — chị Thanh",
  "note": "",
  "landscape": false,
  "md5": "e69d7bb8cf27a040cd436dfe66136485"
 },
 {
  "file": "nlmt-an-phu-12m",
  "title": "An Phú Hớn Quản 1,2 MWp — sơ đồ string",
  "note": "",
  "landscape": false,
  "md5": "3ae0341ca87be8c41b47d150aa2a3005"
 },
 {
  "file": "tk-c-ng-hoa",
  "title": "TK Cong Hoa",
  "note": "",
  "landscape": true,
  "md5": "867c9d99a0595647b99ca23f1a2fc2ec"
 },
 {
  "file": "3-bv-phan-vung-inv-a-bi",
  "title": "BV phân vùng INV A.BI",
  "note": "",
  "landscape": false,
  "md5": "ae6bef837455f707b7b4fd91e675d75c"
 },
 {
  "file": "2-hi-p-minh-th-nh-02-ban-ve-tong-quan-mong-vi-tri-moi",
  "title": "Hiệp Minh Thịnh 02 — tổng quan móng vị trí mới",
  "note": "",
  "landscape": false,
  "md5": "5e2da648b7f1fda3443056552382f39b"
 },
 {
  "file": "1-hi-p-minh-th-nh-02-khung-mai-vi-tri-moi-355kwp",
  "title": "Hiệp Minh Thịnh 02 — khung mái vị trí mới 355 kWp",
  "note": "",
  "landscape": false,
  "md5": "987e7a01474880bf29ca90df985d7aae"
 },
 {
  "file": "mai-hoan-gia",
  "title": "Mai Hoàn Gia — phân vùng inverter",
  "note": "",
  "landscape": false,
  "md5": "019c9a2ced1210c6c17a4973e0f7e0b8"
 },
 {
  "file": "hoan-tuan-minh",
  "title": "Hoàn Tuấn Minh — phân vùng inverter",
  "note": "",
  "landscape": false,
  "md5": "92e2535730a8636e59278fae76ef299f"
 },
 {
  "file": "l-c-kh-nh-01-lap-pin1",
  "title": "Lộc Khánh 01 — lắp pin 1",
  "note": "",
  "landscape": false,
  "md5": "804a137349485a8cd4dbca646dde32c1"
 },
 {
  "file": "hoang-vien-phuoc-minh",
  "title": "Hoàng Viên – Phước Minh — sơ đồ nguyên lý",
  "note": "",
  "landscape": true,
  "md5": "baf04bdf17c347ff24aeabad1caf48a6"
 }
];
