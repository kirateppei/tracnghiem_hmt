/* Hướng dẫn cài đặt biến tần (tổng hợp từ nhiều nguồn; v=0: chưa xác minh với tài liệu hãng). */
const GUIDE_INVERTERS = [
 {
  "id": "sma",
  "name": "SMA",
  "color": "#F5A800",
  "badge": "SMA",
  "app": "Giao diện web của biến tần (user interface, qua LAN/WLAN) với Installation Assistant; ứng dụng SMA 360° (SMA 360° App) và cổng giám sát Sunny Portal",
  "types": {
   "grid": {
    "model": "SMA Sunny Boy / Sunny Tripower (ví dụ Sunny Tripower CORE2, STP 50-40, STP 20000TL)",
    "steps": [
     [
      "Đọc sách hướng dẫn đúng model trên manuals.sma.de trước khi lắp. Kiểm tra <b>điện áp DC tối đa</b> (Voc của chuỗi ở nhiệt độ thấp nhất phải nhỏ hơn giới hạn), dải MPPT, dòng vào tối đa mỗi MPPT và tỉ lệ công suất DC/AC theo datasheet.",
      0
     ],
     [
      "Lắp biến tần đúng vị trí, khoảng hở thông gió và hướng dẫn của sách; thực hiện <b>tiếp địa</b> và đấu AC/DC đúng cực tính, đúng thứ tự do sách của model quy định. Thường phải ngắt hoàn toàn AC và DC trước khi thao tác.",
      0
     ],
     [
      "Đóng nguồn AC và DC theo thứ tự trong sách rồi quan sát đèn LED. Nếu <b>chưa chọn country data set (bộ dữ liệu quốc gia)</b> thì biến tần không hòa lưới (feed-in bị dừng) và LED báo trạng thái dừng.",
      1
     ],
     [
      "Kết nối vào giao diện người dùng của biến tần (qua LAN/WLAN hoặc SMA 360° App) và chạy <b>Installation Assistant</b> (trình hướng dẫn cài đặt). Địa chỉ truy cập và mật khẩu ban đầu: lấy theo nhãn trên thiết bị/sách hướng dẫn của model, không tự đoán.",
      0
     ],
     [
      "Chọn <b>country data set</b> phù hợp quốc gia, mục đích và quy mô hệ thống. SMA cảnh báo chọn sai có thể gây rối loạn hệ thống và sự cố với đơn vị vận hành lưới; cần theo quy định địa phương, nếu chưa chắc hãy hỏi điện lực.",
      1
     ],
     [
      "Với dòng Sunny Tripower có mục NetID, cài đặt NetID khi lắp nhiều biến tần trong cùng mạng truyền thông (xem mục \"Setting the NetID\" trong sách của model).",
      0
     ],
     [
      "Thay đổi tham số liên quan lưới (Grid Guard) cần <b>mã Grid Guard cá nhân</b>, xin qua Online Service Center của SMA và chỉ khả dụng sau 10 giờ vận hành đầu tiên. Cấu hình chống chảy ngược/giới hạn công suất (nếu điện lực yêu cầu) tuỳ model, xem sách.",
      1
     ],
     [
      "Có thể tắt tạm Webconnect khi đang commissioning để tránh biến tần cố kết nối không cần thiết, sau đó bật lại. Đăng ký thiết bị vào Sunny Portal (SMA 360° App cần tài khoản Sunny Portal có sẵn) để giám sát từ xa.",
      1
     ],
     [
      "Kiểm tra vận hành: biến tần chuyển sang trạng thái hòa lưới, công suất và điện áp lưới hợp lý, không có thông báo lỗi. Ghi lại thông số và chụp ảnh nghiệm thu. Lỗi hay gặp: chưa chọn country data set, sai cực tính DC, mất kết nối mạng.",
      0
     ]
    ],
    "tips": [
     "An toàn: ngắt cả AC và DC, chờ tụ xả theo sách trước khi mở nắp; tấm pin vẫn phát điện khi có ánh sáng.",
     "Tuyệt đối chọn đúng country data set và tuân thủ quy định/hồ sơ đấu nối của điện lực địa phương; luôn làm theo sách hướng dẫn của đúng model."
    ]
   },
   "hybrid": {
    "model": "SMA Sunny Boy Storage 3.7 / 5.0 / 6.0 (SBS-10); Sunny Tripower Smart Energy (STPxx-SE)",
    "steps": [
     [
      "Xác nhận pin nằm trong danh sách <b>pin được SMA chấp thuận</b> (Approved batteries) và phiên bản firmware tương thích. Ví dụ tài liệu tích hợp SMA-BYD áp dụng cho SBS3.7/5.0/6.0-10 firmware 3.11.10.R trở lên với BYD Battery-Box Premium HVS/HVM.",
      1
     ],
     [
      "Kiểm tra giới hạn điện áp/dòng của pin so với biến tần theo sách. Sách SBS có mục kết nối DC với các giới hạn dòng theo từng loại pin; xem đúng bảng của model.",
      1
     ],
     [
      "Đấu nối AC, tiếp địa và DC pin theo đúng cực tính, thứ tự trong sách. Nếu dùng dự phòng (battery-backup) thì đấu thêm công tơ/bộ chuyển mạch backup theo sơ đồ của SMA.",
      0
     ],
     [
      "Đấu <b>cáp CAN</b> giữa pin và biến tần theo mục \"Connecting CAN communication cable\" của sách; chân cáp và điện trở cuối theo tài liệu từng hãng pin.",
      1
     ],
     [
      "Sách SBS có hạng mục công tắc cấp nguồn an toàn (secure power supply) và công tắc <b>black start</b> cho hệ thống battery-backup; thao tác theo đúng sách khi khởi động lại từ trạng thái pin cạn.",
      1
     ],
     [
      "Chạy Installation Assistant trên giao diện web hoặc SMA 360° App: chọn <b>country data set</b>, loại pin, và chế độ làm việc. Không có country data set thì không hòa lưới.",
      1
     ],
     [
      "Cấu hình giới hạn sạc/xả, SOC/DoD tối thiểu, chế độ tự dùng, ưu tiên pin hoặc theo giờ. Tên menu và giá trị cụ thể thay đổi theo firmware; xem sách của model.",
      0
     ],
     [
      "SMA nêu cấp nguồn dự phòng tới 8 kW và tuỳ chọn dự phòng toàn nhà tự động. Kiểm tra bằng cách giả lập mất lưới (theo hướng dẫn) để xác nhận chuyển sang backup.",
      1
     ],
     [
      "Kiểm tra vận hành: pin sạc/xả đúng, không báo lỗi CAN/BMS, dữ liệu hiện trên Sunny Portal. Lỗi hay gặp: pin không được nhận do sai cáp CAN hoặc firmware chưa tương thích.",
      0
     ]
    ],
    "tips": [
     "Pin cao áp có điện áp nguy hiểm; chỉ kỹ thuật viên có chứng chỉ thao tác và theo đúng quy trình của hãng pin và SMA.",
     "Chỉ dùng pin và firmware nằm trong danh sách tương thích của SMA; tuân thủ quy định điện lực địa phương cho hệ thống có pin."
    ]
   },
   "offgrid": {
    "model": "SMA Sunny Island (4.4M / 6.0H / 8.0H, 48 V) kết hợp Sunny Boy/Tripower",
    "steps": [
     [
      "Sunny Island là biến tần/sạc <b>48 V</b>, công suất danh định lần lượt 3,3 / 4,6 / 6,0 kVA. Dung lượng pin cho phép 100–10.000 Ah (chì-axit) hoặc 50–10.000 Ah (Li-ion). Chọn pin chì hoặc Li-ion được SMA chấp thuận.",
      1
     ],
     [
      "Tính tải cực đại và dòng khởi động của tải; quyết định có dùng nhiều Sunny Island ghép cụm hay không. Kiểm tra cầu chì/aptomat DC phía pin theo sách.",
      0
     ],
     [
      "Đấu nối pin (đúng cực tính, có bảo vệ DC), ngõ ra tải AC, tiếp địa. Với Li-ion, đấu giao tiếp BMS theo sách. Ngõ vào AC nhận lưới hoặc <b>máy phát</b>: lưới 172,5–264,5 V/40–70 Hz; chế độ độc lập 202–253 V/45–65 Hz; tối đa 50 A hoặc 11.500 W.",
      1
     ],
     [
      "Thiết bị có nhận dạng thứ tự pha tự động (rotary field detection) và hướng dẫn cấu hình nhanh (quick configuration guide). Thứ tự khởi động và đóng aptomat theo đúng sách của model.",
      1
     ],
     [
      "Cấu hình qua LAN/WLAN bằng điện thoại hoặc máy tính bảng: chạy quick configuration, khai báo loại pin, dung lượng, điện áp/tần số ngõ ra đúng chuẩn địa phương. Tên menu cụ thể xem sách.",
      1
     ],
     [
      "Cấu hình nguồn máy phát (giới hạn dòng, điều kiện khởi động/dừng, thời gian chạy tối thiểu) và quản lý sạc pin (OptiBat) theo sách. Nếu có Sunny Boy/Tripower nối ngõ ra Sunny Island, cần cài đặt để dòng PV giảm khi pin đầy (thường qua dịch tần số).",
      0
     ],
     [
      "Kiểm tra vận hành: ngõ ra ổn định, pin sạc/xả đúng, máy phát tự khởi động khi pin thấp, tải bảo vệ ngắt đúng. Theo dõi từ xa qua Sunny Portal nếu có mạng.",
      0
     ]
    ],
    "tips": [
     "Lỗi hay gặp: dung lượng pin quá nhỏ so với tải, sai cấu hình pin hoặc máy phát không đạt dải điện áp/tần số cho phép.",
     "Tuân thủ sách hướng dẫn của đúng model Sunny Island và quy định an toàn điện địa phương; không tự ý đổi tham số bảo vệ pin."
    ]
   }
  },
  "missing": "Không truy cập được manuals.sma.de (bị chặn mạng), chỉ có đoạn tóm tắt từ kết quả tìm kiếm nên nhiều bước chi tiết (tên menu, mật khẩu/IP mặc định, thứ tự đóng AC/DC, thông số pin) để v=0 hoặc nhắc xem sách. Không ghi mật khẩu hay IP mặc định. Sunny Tripower Smart Energy chỉ nêu tên dòng, chưa kiểm chứng chi tiết."
 },
 {
  "id": "huawei",
  "name": "Huawei",
  "color": "#C7000B",
  "badge": "HW",
  "app": "FusionSolar App / SUN2000 App (cấu hình tại chỗ qua Bluetooth/WLAN), portal FusionSolar để giám sát",
  "types": {
   "grid": {
    "model": "SUN2000 hòa lưới: SUN2000-(2KTL-6KTL)-L1 (1 pha), SUN2000-(3KTL-10KTL)-M1 (3 pha)",
    "steps": [
     [
      "Trước khi lắp, đối chiếu thông số trên nhãn/datasheet của đúng model: <b>điện áp DC tối đa</b>, dải MPPT, dòng vào tối đa mỗi MPPT. Tính Voc của chuỗi ở nhiệt độ thấp nhất tại địa điểm, không để vượt điện áp DC tối đa (tuỳ model, xem sách hướng dẫn).",
      0
     ],
     [
      "Kiểm tra tỷ lệ công suất DC/AC và số chuỗi trên mỗi MPPT theo giới hạn của model; công suất tấm thường không nên vượt mức tối đa Huawei cho phép trong sách hướng dẫn.",
      0
     ],
     [
      "Lắp biến tần đúng vị trí, khoảng hở thông gió và hướng lắp theo sách hướng dẫn; tránh nắng trực tiếp và nơi ẩm ướt.",
      0
     ],
     [
      "Đấu <b>tiếp địa (PE)</b> trước, sau đó đấu cáp AC qua aptomat AC riêng, rồi đấu chuỗi PV bằng đầu MC4 đúng cực tính (kiểm tra cực tính bằng đồng hồ trước khi cắm).",
      0
     ],
     [
      "Thứ tự bật nguồn thường là: đóng aptomat AC trước, sau đó bật <b>DC switch</b> trên biến tần. Thứ tự tắt ngược lại. Xác nhận thứ tự trong chương 'Verification before Power-On / System Power-On' của sách hướng dẫn.",
      1
     ],
     [
      "Kết nối app qua Bluetooth/WLAN (tuỳ model, có thể cần bộ Smart Dongle) bằng ứng dụng <b>FusionSolar</b> (hoặc SUN2000 App cho kỹ thuật viên); mật khẩu khởi tạo xem trong tài liệu kèm máy, nên đổi ngay sau lần đăng nhập đầu.",
      0
     ],
     [
      "Trong chương 'App Commissioning' chọn <b>Grid Code</b> phù hợp quy định điện lực địa phương (Việt Nam: hỏi điện lực về mã lưới được chấp nhận; sách hướng dẫn có phụ lục Grid Code liệt kê các lựa chọn).",
      1
     ],
     [
      "Cài ngày giờ, tạo nhà máy (PV plant) và tài khoản trên FusionSolar để giám sát từ xa; nếu điện lực yêu cầu chống chảy ngược, cấu hình giới hạn công suất xuất lưới (cần meter/thiết bị đo theo hướng dẫn của model).",
      0
     ],
     [
      "Kiểm tra vận hành: trạng thái 'Grid-connected', điện áp/tần số lưới, sản lượng; xử lý các cảnh báo thường gặp như điện áp lưới bất thường, cách điện thấp (Low insulation resistance), tra mã lỗi trong sách hướng dẫn.",
      0
     ]
    ],
    "tips": [
     "Chỉ làm theo sách hướng dẫn đúng model và quy định điện lực địa phương; chỉ cài Grid Code được điện lực chấp nhận.",
     "Có điện DC ngay khi tấm pin nhận nắng: luôn ngắt AC và DC switch và chờ theo thời gian xả trong sách hướng dẫn trước khi thao tác."
    ]
   },
   "hybrid": {
    "model": "SUN2000-(2-6)KTL-L1 / SUN2000-(3-10)KTL-M1 + pin LUNA2000",
    "steps": [
     [
      "Xác định cấu hình: SUN2000-(2-6)KTL-L1 (1 pha) hoặc SUN2000-(3-10)KTL-M1 (3 pha) kết hợp pin <b>LUNA2000</b>. Kiểm tra tương thích dung lượng pin, số module pin và công suất biến tần theo bảng trong sách hướng dẫn.",
      1
     ],
     [
      "Kiểm tra DC: điện áp DC tối đa, Voc ở nhiệt độ thấp, dòng MPPT và tỷ lệ DC/AC theo datasheet đúng model.",
      0
     ],
     [
      "Lắp pin LUNA2000 và biến tần theo hướng dẫn lắp đặt; đấu tiếp địa (PE) trước, cáp nguồn pin và cáp giao tiếp pin-biến tần đúng sơ đồ trong sách hướng dẫn, không tự ý đổi cáp.",
      0
     ],
     [
      "Lắp <b>smart power sensor / meter</b> tại điểm đấu nối lưới: Huawei nêu meter là thiết bị thiết yếu khi lắp pin; đấu RS485 của meter theo sơ đồ quick guide.",
      1
     ],
     [
      "Nếu cần cấp điện dự phòng khi mất lưới, dùng hộp backup (Backup Box) hoặc cổng backup nếu model hỗ trợ; việc có hay không cổng EPS tuỳ model và thị trường, xem sách hướng dẫn.",
      0
     ],
     [
      "Bật nguồn theo trình tự của sách hướng dẫn (thường đóng AC, bật DC switch biến tần, rồi bật pin). Kết nối app FusionSolar/SUN2000 và chạy <b>Quick Settings</b>/'App Commissioning' để chọn Grid Code, thêm pin LUNA2000 và meter.",
      0
     ],
     [
      "Chọn chế độ làm việc (Working mode) như tự dùng tối đa (Maximize self-consumption), bán hết lên lưới, hoặc theo giờ (Time-of-use); tên menu chính xác tuỳ phiên bản app.",
      1
     ],
     [
      "Đặt giới hạn SOC: ngưỡng xả tối thiểu (end-of-discharge SOC), SOC dự trữ cho backup, công suất sạc/xả tối đa, tuỳ chọn sạc từ lưới nếu quy định cho phép. Giá trị cụ thể theo khuyến nghị của Huawei.",
      0
     ],
     [
      "Kiểm tra vận hành: pin hiện đúng trạng thái sạc/xả, meter đọc đúng chiều công suất, giám sát từ xa trên FusionSolar; thử mất lưới nếu có backup. Lỗi thường gặp: mất liên lạc meter, pin không nhận (cáp/đấu sai), Grid Code sai.",
      0
     ]
    ],
    "tips": [
     "Pin lithium: không tự đấu hoặc thay cáp pin khi chưa tắt đúng trình tự; làm theo quick guide của model và LUNA2000.",
     "Thiếu meter hoặc đấu sai chiều CT/RS485 là lỗi hay gặp, làm sai chế độ tự dùng và chống chảy ngược."
    ]
   }
  },
  "missing": "Huawei không có dòng biến tần off-grid thuần (không nối lưới); hệ SUN2000 + LUNA2000 là hybrid hòa lưới, backup khi mất lưới tuỳ model. Hạn chế: các domain solar.huawei.com, support.huawei.com, midsummer.ie, vattenfall.se bị chặn nên không đọc được toàn văn sách hướng dẫn, chỉ có tóm tắt từ kết quả tìm kiếm; vì vậy đa số bước để v=0 (chưa xác minh). Không ghi mật khẩu/SSID mặc định vì chưa xác minh."
 },
 {
  "id": "goodwe",
  "name": "GoodWe",
  "color": "#0072BC",
  "badge": "GW",
  "app": "PV Master (cấu hình tại chỗ qua Bluetooth/WiFi), SolarGo (dòng mới), SEMS Portal (app/web giám sát: semsportal.com); cấu hình WiFi/mạng cho module giám sát qua trình duyệt tại http://10.10.100.253",
  "types": {
   "grid": {
    "model": "DNS (G3), MS (G3), SMT hòa lưới",
    "steps": [
     [
      "Đọc sách hướng dẫn đúng model (DNS G3, MS G3 hoặc SMT) và chỉ để kỹ thuật viên có chuyên môn thực hiện. Kiểm tra <b>Voc ở nhiệt độ thấp nhất</b> của chuỗi không vượt điện áp DC tối đa, dòng chuỗi trong giới hạn từng <b>MPPT</b>, và tỷ lệ công suất DC/AC theo datasheet.",
      0
     ],
     [
      "Chọn vị trí lắp thoáng mát, đúng khoảng cách tản nhiệt theo sách, tránh nắng trực tiếp. Nối <b>tiếp địa</b> vỏ biến tần trước khi đấu các nguồn khác.",
      0
     ],
     [
      "Đảm bảo CB/cầu dao AC và DC (nếu có) đang <b>ngắt</b>. Đấu cáp AC đúng pha/trung tính/PE theo nhãn trên đầu nối, lực siết theo sách hướng dẫn.",
      0
     ],
     [
      "Đấu cáp DC từ chuỗi PV, kiểm tra <b>cực tính</b> bằng đồng hồ trước khi cắm đầu MC4. Thường đóng AC trước rồi mới đóng DC; thứ tự chính xác xem sách của model.",
      0
     ],
     [
      "Cấp nguồn, chờ biến tần tự kiểm tra. Kết nối PV Master/SolarGo với biến tần để vào phần cài đặt cơ bản.",
      0
     ],
     [
      "Chọn <b>quốc gia/tiêu chuẩn lưới (Safety Country)</b> trong phần cài đặt cơ bản của PV Master. Cài sai thông số có thể khiến biến tần không hòa lưới đúng yêu cầu. Chọn mã lưới phù hợp quy định điện lực Việt Nam, nếu không có thì hỏi nhà phân phối.",
      1
     ],
     [
      "Cấu hình giám sát: nối điện thoại/laptop vào WiFi AP của module WiFi biến tần, mở trình duyệt vào <b>http://10.10.100.253</b> (gõ vào thanh địa chỉ), chọn router WiFi nhà máy và nhập mật khẩu. Sau đó thêm trạm trên SEMS Portal bằng số serial. Thông tin đăng nhập mặc định xem nhãn/sách model.",
      1
     ],
     [
      "Nếu cần chống chảy ngược (zero export) thì lắp đồng hồ/CT đo công suất và bật giới hạn xuất lưới theo sách của model. Không phải model nào cũng hỗ trợ.",
      0
     ],
     [
      "Kiểm tra vận hành: biến tần hòa lưới, công suất và điện áp lưới ổn định, không có mã lỗi, dữ liệu hiển thị trên SEMS Portal. Lỗi thường gặp: điện áp/tần số lưới ngoài ngưỡng, cách điện (ISO) thấp, mất kết nối WiFi.",
      0
     ]
    ],
    "tips": [
     "Làm theo đúng sách hướng dẫn của model và quy định điện lực địa phương; ngắt AC/DC và chờ xả tụ trước khi mở nắp.",
     "Chọn sai Safety Country là lỗi hay gặp, dẫn đến cắt lưới hoặc không đạt yêu cầu đấu nối."
    ]
   },
   "hybrid": {
    "model": "ET (G2, Plus+), EH, EM; đo bằng đồng hồ thông minh/CT",
    "steps": [
     [
      "Xác nhận model (ví dụ ET G2 GW6000-GW15K-ET-20) và pin tương thích trong danh sách của GoodWe. Kiểm tra điện áp DC tối đa, <b>Voc ở nhiệt độ thấp</b>, dòng MPPT và dải điện áp pin.",
      0
     ],
     [
      "Lắp biến tần, đấu <b>tiếp địa</b>. Với cổng BACK-UP (EPS) thường phải tách riêng tải thiết yếu; không nối trung tính/tải sai giữa cổng lưới và cổng backup.",
      0
     ],
     [
      "Đấu cáp pin đúng cực tính và cáp giao tiếp BMS (thường <b>CAN</b> hoặc RS485) theo tài liệu pin. Sách GoodWe tham chiếu sổ tay của pin cho các thao tác pin.",
      1
     ],
     [
      "Đấu đồng hồ thông minh/CT đo công suất lưới đúng chiều và vị trí, đấu AC lưới và backup. Thường đóng AC, pin rồi DC; thứ tự đúng xem sách.",
      0
     ],
     [
      "Bật nguồn, kết nối PV Master/SolarGo, chọn <b>Safety Country</b> và <b>loại pin</b> (Battery Type) trong cài đặt cơ bản; PV Master có mục chọn Work Mode và Battery Type.",
      1
     ],
     [
      "Cài giới hạn sạc/xả, <b>DoD / SOC tối thiểu</b> theo khuyến cáo nhà sản xuất pin; chọn chế độ làm việc (tự dùng, ưu tiên pin, theo giờ, backup) và bật cổng backup nếu cần.",
      0
     ],
     [
      "Cấu hình giám sát: nối vào WiFi AP của module, mở <b>http://10.10.100.253</b> trên trình duyệt để chọn router và nhập mật khẩu. Sau đó thêm trạm trên SEMS Portal; module mới cần firmware phù hợp.",
      1
     ],
     [
      "Cấu hình giới hạn xuất lưới (zero export) nếu điện lực yêu cầu, dựa trên đồng hồ đo.",
      0
     ],
     [
      "Thử vận hành: kiểm tra sạc/xả pin, thử mất lưới để xác nhận chuyển sang backup, dữ liệu lên SEMS Portal. Lỗi thường gặp: mất giao tiếp BMS, sai cực CT/đồng hồ, sai Battery Type.",
      0
     ]
    ],
    "tips": [
     "Pin có điện áp cao và luôn có điện kể cả khi biến tần tắt; chỉ làm theo sách pin và biến tần đúng model.",
     "Sai cực tính hoặc chiều CT/đồng hồ làm công suất lưới đo sai, gây sạc xả và zero export sai."
    ]
   }
  },
  "missing": "Chưa tìm được dòng off-grid thuần của GoodWe trong tài liệu truy cập được; dòng ES/EM thường được dùng hybrid có lưới. Trang chính en.goodwe.com bị chặn nên chưa đọc trực tiếp sách ET G2 và PV Master; phần lớn bước ghi v=0. Địa chỉ 10.10.100.253 chỉ xác nhận qua trang hỗ trợ bên thứ ba (V2C, Columbus Energy), không phải tài liệu GoodWe."
 },
 {
  "id": "sungrow",
  "name": "Sungrow",
  "color": "#E60012",
  "badge": "SG",
  "app": "iSolarCloud App (cấu hình qua WiNet-S / WiNet-S2, đăng nhập tài khoản Installer) và cổng iSolarCloud trên web",
  "types": {
   "grid": {
    "model": "Sungrow SG RT (SG3.0RT đến SG20RT, ba pha, hòa lưới) / dòng SG CX cùng loại",
    "steps": [
     [
      "Trước khi lắp, đối chiếu datasheet đúng model: điện áp DC đầu vào tối đa, dải MPPT, dòng vào tối đa mỗi MPPT và công suất DC/AC. Tính <b>Voc ở nhiệt độ thấp nhất</b> của chuỗi tấm pin, không để vượt điện áp DC tối đa của biến tần.",
      0
     ],
     [
      "Lắp biến tần nơi thông thoáng, tránh nắng trực tiếp và mưa hắt, chừa khoảng hở tản nhiệt theo sách hướng dẫn. Nối <b>tiếp địa (PE)</b> trước khi đấu các dây khác.",
      0
     ],
     [
      "Đấu cáp AC qua aptomat/cầu dao riêng đúng dòng định mức, đúng thứ tự pha L1/L2/L3, N, PE. Khi chưa đấu xong phải giữ aptomat AC ở trạng thái ngắt.",
      0
     ],
     [
      "Đấu chuỗi DC bằng đầu MC4 đúng <b>cực tính +/-</b>, đo điện áp từng chuỗi bằng đồng hồ trước khi cắm vào biến tần. Chuỗi bị ngược cực hoặc quá áp có thể làm hỏng biến tần.",
      0
     ],
     [
      "Thứ tự bật nguồn thường là đóng aptomat AC trước, sau đó đóng cầu dao DC (DC switch). Thứ tự ngắt ngược lại. Xem lại thứ tự này trong sách hướng dẫn của model đang lắp.",
      0
     ],
     [
      "Gắn module truyền thông WiNet-S hoặc WiNet-S2 (Wi-Fi/Ethernet) vào biến tần, mở iSolarCloud App, đăng nhập tài khoản Installer, kết nối vào biến tần và chạy trình hướng dẫn cài đặt (commissioning wizard).",
      1
     ],
     [
      "Trong lúc cài đặt phải chọn đúng <b>mã lưới / grid code</b> của quốc gia hoặc điện lực. Tài liệu hãng nhấn mạnh thông số lưới phải được thống nhất theo yêu cầu của nhà vận hành lưới. Ở Việt Nam, hỏi điện lực địa phương về mã lưới và thông số bảo vệ cần dùng, tên menu cụ thể tuỳ phiên bản firmware và app.",
      1
     ],
     [
      "Cài ngày giờ, múi giờ, tên và vị trí nhà máy (Plant) trong app. Nếu điện lực yêu cầu hạn chế công suất hoặc chống chảy ngược, thường cấu hình qua mục giới hạn công suất (Power Limitation) kèm đồng hồ đo (smart meter) hoặc CT. Menu cụ thể tuỳ model, xem sách hướng dẫn.",
      0
     ],
     [
      "Kiểm tra vận hành: biến tần chuyển sang trạng thái chạy và hòa lưới sau thời gian chờ kiểm tra lưới, công suất AC tăng theo bức xạ. Kiểm tra không có cảnh báo, các MPPT đều có điện áp và dòng hợp lý.",
      0
     ],
     [
      "Thêm nhà máy lên iSolarCloud để giám sát từ xa, kiểm tra tín hiệu Wi-Fi hoặc mạng LAN ổn định. Có thể xuất báo cáo commissioning (PDF) từ app để bàn giao cho khách hoặc điện lực.",
      1
     ]
    ],
    "tips": [
     "Luôn làm theo sách hướng dẫn của đúng model và phiên bản firmware, và theo quy định của điện lực địa phương. Tài liệu hãng nêu thông số lưới phải được xác nhận theo yêu cầu của nhà vận hành lưới tại từng dự án.",
     "Ngắt cả AC và DC, chờ tụ xả điện theo thời gian ghi trong sách hướng dẫn trước khi mở nắp hoặc đấu lại dây. Chuỗi DC vẫn có điện áp cao khi có ánh sáng."
    ]
   },
   "hybrid": {
    "model": "Sungrow SH RT (SH5.0RT đến SH10RT, ba pha) và SH RS (một pha), kết hợp pin Sungrow SBR (SBR096 đến SBR256) hoặc SBH",
    "steps": [
     [
      "Trước khi lắp, kiểm tra datasheet model SH...RT/RS: điện áp DC tối đa, dải MPPT, dòng mỗi MPPT, công suất DC/AC và công suất, thời gian cấp điện ở cổng backup. Tính <b>Voc ở nhiệt độ thấp</b> của chuỗi pin mặt trời. Công suất backup ngắn hạn cao hơn mức liên tục, đừng nhầm hai giá trị này.",
      0
     ],
     [
      "Chỉ dùng pin đúng dòng tương thích do hãng chỉ định (SBR/SBH cho SH...RT/RS). Các nhà phân phối cho biết pin SBR chỉ hoạt động với biến tần Sungrow. Chọn số module pin theo bảng cấu hình của hãng.",
      1
     ],
     [
      "Lắp biến tần và pin đúng khoảng cách, vị trí theo sách hướng dẫn. Nối <b>tiếp địa</b> cho biến tần và tủ pin. Cáp nguồn pin và cáp truyền thông BMS đấu đúng cực tính, đúng cổng theo sơ đồ của hãng.",
      0
     ],
     [
      "Đấu nối lưới (GRID) và cổng tải dự phòng (BACKUP/EPS) vào đúng đầu ra. Không đấu lẫn hai cổng này và không nối tải lưới vào cổng backup. Lắp đồng hồ đo thông minh (smart meter) và CT tại điểm đấu nối lưới theo hướng dẫn để biến tần đo được công suất lưới.",
      0
     ],
     [
      "Thứ tự bật nguồn thường là đóng AC và bật pin trước rồi mới đóng DC. Thứ tự đúng tuỳ model, làm theo sách hướng dẫn của hãng. Đảm bảo pin đã khởi động và biến tần nhận được tín hiệu từ pin.",
      0
     ],
     [
      "Dùng iSolarCloud App với tài khoản Installer, kết nối biến tần qua WiNet, chạy trình hướng dẫn cài đặt. Chọn đúng <b>mã lưới / grid code</b> theo yêu cầu điện lực, đặt ngày giờ, rồi khai báo loại pin và công suất pin.",
      1
     ],
     [
      "Cài chế độ quản lý năng lượng (Energy Management) trong app. Hãng mô tả chế độ tự tiêu thụ (Self-consumption) ưu tiên dùng điện mặt trời và pin để giảm điện lấy từ lưới. Có tính năng sạc cưỡng bức (Forced Charging) đặt theo ngày, giờ bắt đầu, kết thúc và SOC mục tiêu. Tên mục và các chế độ còn lại tuỳ phiên bản app.",
      1
     ],
     [
      "Đặt giới hạn SOC trên và SOC dưới cho pin, và mức SOC dự trữ cho backup. Tài liệu hãng cho biết SOC dự trữ của chức năng Peak shaving phải lớn hơn SOC dưới của backup ít nhất 2 phần trăm. Chọn giá trị theo khuyến nghị của hãng pin và nhu cầu dự phòng của khách.",
      1
     ],
     [
      "Cấu hình chống chảy ngược hoặc giới hạn công suất xuất lưới (nếu điện lực yêu cầu) qua mục giới hạn công suất xuất lưới, cần đồng hồ đo đúng chiều. Menu cụ thể tuỳ model, xem sách hướng dẫn.",
      0
     ],
     [
      "Kiểm tra vận hành: pin sạc khi dư PV và xả khi tải cao, công suất lưới đọc đúng dấu. Thử cắt lưới để kiểm tra chuyển sang cấp điện backup (EPS), theo hướng dẫn an toàn, với tải nhỏ trước. Thêm nhà máy lên iSolarCloud để giám sát từ xa.",
      0
     ]
    ],
    "tips": [
     "Pin lithium có năng lượng lớn: đấu nối, bật nguồn pin và cài thông số theo sách hướng dẫn SBR/SBH của đúng model. Không tự thay đổi thông số sạc xả ngoài phạm vi hãng cho phép.",
     "Cổng backup/EPS có công suất giới hạn. Không nối tải động cơ lớn, máy nén dòng khởi động cao nếu sách hướng dẫn không cho phép. Làm theo quy định điện lực địa phương về đấu nối có pin và chống chảy ngược."
    ]
   }
  },
  "missing": "Không tìm được tài liệu chính hãng xác nhận Sungrow có dòng off-grid thuần (độc lập, không nối lưới) trong danh mục SG/SH. Các dòng hybrid SH RT/RS có cổng backup nhưng vẫn là hệ hòa lưới có pin. Cần hỏi hãng hoặc nhà phân phối nếu cần giải pháp off-grid. Ngoài ra không truy cập được sách hướng dẫn chính thức (info-support.sungrowpower.com và support.gridx.ai bị chặn), nên tên menu iSolarCloud chính xác, thứ tự đóng/ngắt chính thức và các chế độ làm việc đầy đủ chưa được xác minh; các bước đánh dấu v=0 là thực hành chung."
 },
 {
  "id": "solis",
  "name": "Solis",
  "color": "#F39800",
  "badge": "SO",
  "app": "SolisCloud (đăng ký/giám sát, quét mã để thêm datalogger) và SolisAPP / màn hình LCD trên máy để cài đặt tại chỗ; menu cụ thể tuỳ model và phiên bản firmware, xem sách hướng dẫn",
  "types": {
   "grid": {
    "model": "Solis S5-GR3P(3-20)K (3 pha), S5-GR1P (1 pha); S6-GR là thế hệ mới cùng loại hòa lưới",
    "steps": [
     [
      "Tải <b>sách hướng dẫn đúng model và đúng khu vực</b> (Solis phát hành manual riêng theo dòng công suất và thị trường) và đọc phần an toàn, lắp đặt, cài đặt trước khi thi công.",
      1
     ],
     [
      "Kiểm tra chuỗi PV: <b>Voc ở nhiệt độ thấp nhất</b> phải nhỏ hơn điện áp DC tối đa của máy; Vmpp nằm trong dải MPPT; dòng chuỗi không vượt dòng MPPT cho phép. Tỉ lệ DC/AC thường chọn khoảng 1.1-1.3 tuỳ giới hạn của model.",
      0
     ],
     [
      "Lắp máy nơi thông thoáng, tránh nắng trực tiếp và nước đọng, chừa khoảng hở tản nhiệt theo sách. Đấu <b>tiếp địa (PE)</b> trước khi đấu các dây khác.",
      0
     ],
     [
      "Đấu AC (L1/L2/L3/N/PE theo đúng nhãn cổng) qua aptomat riêng, tiết diện dây theo bảng trong sách. Đấu DC đúng <b>cực tính +/-</b> bằng đầu MC4, đo điện áp từng chuỗi bằng đồng hồ trước khi cắm.",
      0
     ],
     [
      "Trình tự bật thường là: đóng aptomat AC trước, sau đó đóng công tắc DC. Trình tự tắt ngược lại (ngắt DC rồi ngắt AC). Làm theo đúng thứ tự trong sách của model.",
      0
     ],
     [
      "Vào cài đặt qua màn hình LCD hoặc SolisAPP (kết nối với datalogger/WiFi của máy) và chọn <b>tiêu chuẩn lưới (Grid Standard / Grid Code)</b> phù hợp quy định điện lực Việt Nam; không chọn tiêu chuẩn châu Âu mặc định nếu không được yêu cầu. Tên mục và mật khẩu cài đặt nâng cao xem sách hướng dẫn, không dùng mật khẩu lấy từ nguồn không chính thức.",
      0
     ],
     [
      "Cài ngày giờ. Nếu điện lực yêu cầu <b>chống chảy ngược / giới hạn công suất xuất lưới</b>, cấu hình bằng công tơ/đầu đo (smart meter hoặc CT) mà Solis hỗ trợ cho model đó; chức năng và thiết bị đi kèm tuỳ model.",
      0
     ],
     [
      "Đăng ký trạm trên <b>SolisCloud</b> (quét mã trên datalogger để thêm thiết bị), kiểm tra tín hiệu WiFi/4G và dữ liệu đã lên cloud.",
      1
     ],
     [
      "Kiểm tra vận hành: máy tự kiểm tra rồi hòa lưới, công suất AC tăng dần theo bức xạ, không có cảnh báo. Ghi lại số serial, ảnh đấu nối, điện áp chuỗi để bàn giao. Lỗi thường gặp: mất lưới/điện áp lưới ngoài ngưỡng, điện trở cách điện thấp, chọn sai grid code.",
      0
     ]
    ],
    "tips": [
     "Chỉ làm theo sách hướng dẫn của đúng model và quy định của điện lực địa phương; ngắt cả AC và DC, chờ tụ xả trước khi mở nắp máy.",
     "Voc chuỗi PV vào mùa lạnh có thể vượt giới hạn DC của máy, gây hỏng; luôn tính theo hệ số nhiệt độ của tấm."
    ]
   },
   "hybrid": {
    "model": "Solis RHI-(3-6)K-48ES-5G (1 pha, pin áp thấp 48V), S6-EH1P(3-10)K-L-PLUS (1 pha, pin áp thấp 40-60V), S6-EH3P (3 pha)",
    "steps": [
     [
      "Xác định model và tải sách hướng dẫn đúng bản. Dòng S6-EH1P(3-10)K-L-PLUS và RHI-48ES dùng pin áp thấp (khoảng 40-60V), hoạt động với pin lithium-ion và pin chì-axit.",
      1
     ],
     [
      "Kiểm tra PV: Voc ở nhiệt độ thấp không vượt điện áp DC tối đa, dòng mỗi MPPT trong giới hạn (dòng MPPT S6-EH1P(3-10)K-L-PLUS theo trang sản phẩm khoảng 21 A, 2 MPPT; xem datasheet từng model).",
      1
     ],
     [
      "Chọn pin được Solis liệt kê tương thích với đúng model máy (danh sách pin tương thích do Solis công bố); kiểm tra điện áp danh định, dòng sạc/xả tối đa của pin so với giới hạn của máy.",
      0
     ],
     [
      "Đấu tiếp địa, rồi đấu cổng <b>GRID</b> và cổng <b>BACKUP/EPS</b> (tải ưu tiên) đúng nhãn; không nối cổng GRID với cổng BACKUP. Đấu pin đúng <b>cực tính</b> qua cầu dao/cầu chì DC cho pin; đấu cáp giao tiếp BMS (<b>CAN hoặc RS485</b> tuỳ pin) theo sơ đồ chân trong sách.",
      0
     ],
     [
      "Trình tự bật thường: đóng cầu dao pin, sau đó AC, rồi DC từ PV; tắt theo thứ tự ngược lại. Nếu sách quy định khác, theo sách.",
      0
     ],
     [
      "Vào cài đặt (LCD hoặc SolisAPP), chọn <b>tiêu chuẩn lưới (Grid Code)</b> phù hợp quy định điện lực, cài ngày giờ.",
      0
     ],
     [
      "Chọn loại pin và kiểu giao tiếp (pin lithium có BMS giao tiếp, hoặc pin chì cài thủ công). Cài giới hạn: dòng sạc/xả tối đa, <b>mức xả thấp nhất (SOC/DoD tối thiểu / over-discharge)</b> theo khuyến cáo nhà sản xuất pin.",
      0
     ],
     [
      "Chọn chế độ làm việc (thường có các chế độ tự dùng, ưu tiên bán lưới, sạc theo giờ, backup; tên menu chính xác tuỳ firmware, xem sách). Bật chức năng <b>backup/EPS</b> và kiểm tra tổng công suất tải trên cổng backup nằm trong giới hạn máy.",
      0
     ],
     [
      "Nếu cần chống chảy ngược, lắp công tơ/CT của Solis theo sách và bật giới hạn xuất lưới. Đăng ký thiết bị trên <b>SolisCloud</b> bằng cách quét mã datalogger.",
      1
     ],
     [
      "Thử vận hành: kiểm tra pin sạc/xả đúng, thử ngắt lưới để xác nhận chuyển sang backup (RHI-48ES có thời gian chuyển khoảng dưới 20 ms theo datasheet của dòng RAI cùng nền tảng). Lỗi hay gặp: mất giao tiếp BMS, sai cực tính pin, quá tải cổng backup.",
      0
     ]
    ],
    "tips": [
     "Pin có điện áp luôn hiện diện ngay cả khi ngắt AC/DC; chỉ mở máy khi đã cách ly cầu dao pin và theo sách hướng dẫn.",
     "Làm đúng sách model và quy định điện lực; chỉ dùng pin trong danh sách tương thích để tránh lỗi giao tiếp BMS."
    ]
   },
   "offgrid": {
    "model": "Solis RAI-3K-48ES-5G (off-grid/backup, pin 48V)",
    "steps": [
     [
      "Xác nhận RAI-3K-48ES-5G là dòng của Solis dùng được cho độc lập/backup: datasheet ghi có chức năng backup/EPS, dùng pin chì-axit hoặc li-ion, điện áp pin 40-60 V, dòng sạc/xả tối đa 60 A.",
      1
     ],
     [
      "Tính tải: công suất backup định mức 3 kW (cần điện áp pin trên 55 V), công suất biểu kiến tối đa 4.5 kVA. Tính cả dòng khởi động của tải cảm (bơm, máy nén, điều hoà).",
      1
     ],
     [
      "Kiểm tra PV: Voc ở nhiệt độ thấp không vượt giới hạn DC, dòng MPPT trong giới hạn theo datasheet bản đang dùng (các bản datasheet có số liệu khác nhau, đối chiếu đúng bản).",
      1
     ],
     [
      "Chọn dung lượng pin theo số giờ tự chủ và dòng xả; pin 48V kèm cầu dao/cầu chì DC phù hợp. Đấu tiếp địa, đấu pin đúng cực tính, đấu tải vào cổng ngõ ra backup.",
      0
     ],
     [
      "Nếu dùng máy phát hoặc lưới làm nguồn phụ, đấu vào cổng ngõ vào AC theo sách; máy RAI có cổng nối lưới nên xác nhận cách dùng máy phát được hỗ trợ hay không trong sách hướng dẫn.",
      0
     ],
     [
      "Thứ tự khởi động thường: đóng cầu dao pin, đóng DC từ PV, rồi bật tải từng nhóm từ tải nhỏ đến tải lớn để tránh sốc dòng.",
      0
     ],
     [
      "Cài điện áp/tần số ngõ ra (tại Việt Nam thường 220-230 V, 50 Hz), loại pin, ngưỡng xả tối thiểu và dòng sạc theo khuyến cáo nhà sản xuất pin; tên menu xem sách hướng dẫn.",
      0
     ],
     [
      "Kết nối SolisCloud/WiFi nếu có datalogger, kiểm tra dữ liệu.",
      0
     ],
     [
      "Kiểm tra vận hành: điện áp ngõ ra ổn định khi tải tăng, pin sạc từ PV, cảnh báo pin yếu hoạt động. Lỗi hay gặp: quá tải, sụt áp pin do dây nhỏ, cắt do pin xả sâu.",
      0
     ]
    ],
    "tips": [
     "Nguồn dòng RAI-3K-48ES-5G và cách dùng thuần off-grid cần đối chiếu sách hướng dẫn chính hãng; chưa đọc được manual đầy đủ.",
     "Không đấu quá tải ngõ ra backup; làm theo sách model và quy định an toàn điện địa phương."
    ]
   }
  },
  "missing": "Các miền solisinverters.com, ginlong.com và baywa bị chặn nên không đọc được manual đầy đủ; chỉ xác minh thông tin từ kết quả tìm kiếm và datasheet (điện áp pin 40-60 V, backup/EPS, 3 kW, SolisCloud quét mã). Tên menu, mật khẩu, trình tự bật nguồn đều để v=0. Solis không có dòng off-grid thuần riêng nổi bật; RAI-48ES là dòng backup/off-grid cần đối chiếu. S6-GR chưa tìm được tài liệu riêng."
 },
 {
  "id": "deye",
  "name": "Deye",
  "color": "#00A0E9",
  "badge": "DY",
  "app": "Màn hình LCD trên máy + SOLARMAN Smart / SOLARMAN Business (qua Stick Logger Wi-Fi) để giám sát; cài đặt thông số sâu theo sách hướng dẫn đúng model",
  "types": {
   "grid": {
    "model": "Deye SUN-xK-G (hòa lưới string, ví dụ SUN-12/15K-G03, SUN-18/20/25K-G05, SUN-40/45/50K-G-LV, SUN-60/80K-G, SUN-70/110K-G03)",
    "steps": [
     [
      "Tải <b>sách hướng dẫn chính hãng đúng model</b> (deyeinverter.com) và đối chiếu nhãn máy: SUN-xK-G có nhiều biến thể (G03, G05, G-LV...), menu và thông số khác nhau.",
      1
     ],
     [
      "Kiểm tra thiết kế string: <b>Voc ở nhiệt độ thấp nhất</b> của chuỗi phải nhỏ hơn điện áp DC tối đa, dòng Isc không vượt dòng vào tối đa mỗi MPPT, tỉ lệ DC/AC theo giới hạn của model. Lấy số liệu cụ thể từ datasheet.",
      0
     ],
     [
      "Lắp máy nơi thông thoáng, tránh nắng trực tiếp và mưa hắt, chừa khoảng hở tản nhiệt theo sách hướng dẫn; bắt vào tường chắc chắn.",
      0
     ],
     [
      "Nối <b>tiếp địa (PE)</b> trước, rồi đấu cáp AC (đúng pha/trung tính, có CB/aptomat AC riêng đúng cỡ). Giữ CB AC và công tắc DC ở trạng thái OFF trong lúc đấu.",
      0
     ],
     [
      "Đấu các string PV bằng đầu MC4: kiểm tra <b>đúng cực +/-</b> và đo Voc từng string bằng đồng hồ trước khi cắm vào đầu vào MPPT.",
      0
     ],
     [
      "Bật nguồn: thường đóng <b>CB AC trước</b>, sau đó đóng <b>công tắc DC</b> (thứ tự đúng theo sách hướng dẫn model). Máy tự kiểm tra rồi đếm giờ chờ trước khi hòa lưới.",
      0
     ],
     [
      "Cắm Stick Logger Wi-Fi và cấu hình mạng qua app SOLARMAN để giám sát từ xa; thêm trạm (plant) bằng số serial của logger.",
      1
     ],
     [
      "Chọn <b>tiêu chuẩn lưới (Grid Standard / Grid Code)</b> phù hợp quy định điện lực Việt Nam và các thông số điện áp/tần số/thời gian bảo vệ theo yêu cầu đơn vị điện lực. Tên menu cụ thể tuỳ model, xem sách hướng dẫn.",
      0
     ],
     [
      "Nếu điện lực yêu cầu <b>chống phát ngược / giới hạn công suất phát</b>, thường dùng thiết bị chống ngược (CT hoặc đồng hồ, ví dụ hộp anti-reflux của Solarman) và cài giới hạn công suất theo hướng dẫn của thiết bị.",
      0
     ],
     [
      "Kiểm tra vận hành: trạng thái hòa lưới, điện áp/dòng từng MPPT, công suất AC; đối chiếu app với đồng hồ điện; ghi lại mã lỗi nếu có và tra bảng lỗi trong sách hướng dẫn.",
      0
     ]
    ],
    "tips": [
     "Điện áp DC của dàn pin có thể rất cao và vẫn còn khi trời sáng: chỉ thao tác khi đã ngắt DC/AC, dùng đồ bảo hộ, và chờ tụ xả theo sách hướng dẫn trước khi mở máy.",
     "Chỉ cài grid code và giới hạn phát theo yêu cầu của điện lực địa phương; không tự ý sửa thông số bảo vệ lưới.",
     "Lỗi hay gặp: Voc vượt giới hạn do lạnh, đảo cực string, lưới ngoài dải điện áp/tần số, tiếp địa không tốt."
    ]
   },
   "hybrid": {
    "model": "Deye SUN-xK-SG0x (ví dụ SUN-5/8/10/12K-SG04LP3 ba pha pin thấp áp 48V; SUN-7/8/10/12K-SG06LP1 một pha; các dòng SG05LP3 / SG01HP3 pin cao áp tuỳ model)",
    "steps": [
     [
      "Tải <b>sách hướng dẫn đúng model</b> và xác nhận biến thể (pin thấp áp 48V hay cao áp, một pha hay ba pha, hậu tố -EU/-LV...) vì menu và dải điện áp pin khác nhau.",
      1
     ],
     [
      "Kiểm tra thiết kế: Voc string ở nhiệt độ thấp không vượt điện áp DC tối đa, dòng Isc mỗi MPPT trong giới hạn, công suất pin và dòng sạc/xả tối đa khớp với dải của biến tần.",
      0
     ],
     [
      "Đấu nối khi mọi CB đã OFF: tiếp địa, cổng <b>GRID</b> (lưới), cổng <b>LOAD</b> (tải backup, thường là ngõ ra dự phòng/EPS), cổng <b>GEN</b> (nếu có máy phát), pin (đúng cực, có cầu chì/CB DC) và PV.",
      0
     ],
     [
      "Lắp <b>CT hoặc đồng hồ đo</b> tại điểm đấu lưới theo đúng chiều mũi tên (hướng về phía lưới) nếu dùng chế độ zero export / theo tải; đấu sai chiều CT thường làm số liệu công suất sai.",
      0
     ],
     [
      "Nếu pin lithium có BMS: nối cáp <b>CAN hoặc RS485</b> giữa pin và biến tần, chọn đúng giao thức BMS của hãng pin trong menu pin (thường chọn loại pin Lithium). Chỉ dùng loại pin nằm trong danh sách tương thích của Deye.",
      0
     ],
     [
      "Bật nguồn theo thứ tự trong sách hướng dẫn (thường pin trước, rồi PV, rồi lưới). Vào menu <b>Battery Setup</b> để đặt loại pin, dung lượng, dòng sạc/xả tối đa và các ngưỡng bảo vệ (tắt, pin yếu, khởi động lại theo %SOC hoặc điện áp) theo datasheet nhà sản xuất pin.",
      0
     ],
     [
      "Chọn <b>System Work Mode</b>: Deye có các chế độ như <b>Selling First</b> (ưu tiên bán điện), <b>Zero Export To Load</b> (chỉ cấp tải backup) và <b>Zero Export To CT</b> (cấp cả tải nhà, không phát lên lưới). Có tuỳ chọn Solar Sell cho phép bán dư và đặt Max Sell Power.",
      1
     ],
     [
      "Cài <b>Time of Use</b> (theo khung giờ): đặt giờ, công suất và SOC mục tiêu cho từng khung, bật/tắt sạc từ lưới (Grid Charge) tuỳ nhu cầu. Chọn <b>Grid Standard / Grid Code</b> theo quy định điện lực địa phương.",
      0
     ],
     [
      "Kiểm tra chuyển sang dự phòng: ngắt lưới thử và xem tải backup có tiếp tục cấp điện không; kiểm tra pin sạc/xả, đồng bộ giờ của máy và thông tin CT.",
      0
     ],
     [
      "Cắm Stick Logger, cấu hình Wi-Fi qua SOLARMAN để giám sát từ xa; theo dõi cảnh báo và tra mã lỗi trong sách hướng dẫn.",
      1
     ]
    ],
    "tips": [
     "Pin có dòng ngắn mạch rất lớn: dùng cáp, cầu chì/CB DC đúng cỡ, đúng cực tính; không đấu hoặc ngắt pin khi máy đang tải nặng.",
     "Giao thức BMS (CAN/RS485) sai thường khiến máy bị giới hạn dòng sạc/xả hoặc báo lỗi pin: đối chiếu bảng tương thích pin và phiên bản firmware.",
     "Chiều CT, tải backup quá công suất ngõ ra, và cài sai chế độ làm việc là các lỗi hay gặp. Luôn theo sách hướng dẫn model và quy định điện lực địa phương."
    ]
   },
   "offgrid": {
    "model": "Deye không có dòng off-grid thuần trong tài liệu tôi đã tìm thấy; dùng hybrid SUN-xK-SG0x ở chế độ không nối lưới (cổng GRID để trống hoặc dùng máy phát qua cổng GEN)",
    "steps": [
     [
      "Xác nhận trong sách hướng dẫn đúng model rằng biến tần hybrid được phép vận hành <b>không có lưới</b> và thông số ngõ ra (điện áp, tần số, công suất) khi chạy ở chế độ backup.",
      0
     ],
     [
      "Tính công suất tải và dòng khởi động của tải cảm kháng (động cơ, máy lạnh, bơm) để chọn công suất biến tần và dung lượng pin có dự phòng; kiểm tra Voc string và dòng MPPT như hybrid.",
      0
     ],
     [
      "Đấu tiếp địa, pin (đúng cực, có cầu chì/CB DC) và PV; đấu tải vào cổng <b>LOAD</b> (ngõ ra backup). Cổng GRID để hở hoặc không cấp điện lưới; chỉ nối máy phát vào cổng <b>GEN</b> nếu model có.",
      0
     ],
     [
      "Nếu dùng pin lithium có BMS, nối CAN/RS485 và chọn giao thức tương ứng; với pin chì-axit đặt loại pin, dung lượng, dòng sạc theo nhà sản xuất pin.",
      0
     ],
     [
      "Bật nguồn: cấp pin trước, sau đó PV, rồi đóng tải từng nhóm để tránh sụt áp ngõ ra do khởi động đồng thời. Thứ tự chính xác tuỳ model.",
      0
     ],
     [
      "Trong <b>Battery Setup</b> đặt các ngưỡng bảo vệ pin (tắt, pin yếu, khởi động lại theo SOC hoặc điện áp) để tránh xả sâu khi không có lưới.",
      0
     ],
     [
      "Nếu có máy phát: cấu hình cổng GEN (công suất máy phát tối đa, ngưỡng tự khởi động theo điện áp/SOC nếu model hỗ trợ) và kiểm tra máy phát có đủ công suất cho tải cộng sạc pin.",
      0
     ],
     [
      "Kiểm tra vận hành: tải chạy ổn định, điện áp và tần số ngõ ra đúng, pin sạc từ PV; giám sát từ xa qua Stick Logger và SOLARMAN.",
      1
     ]
    ],
    "tips": [
     "Không có lưới nên tải phải nằm trong công suất ngõ ra của biến tần; quá tải hoặc khởi động động cơ lớn có thể làm máy ngắt.",
     "Cách dùng hybrid ở chế độ không nối lưới và các giới hạn bảo hành cần được xác nhận với Deye hoặc nhà phân phối và sách hướng dẫn model."
    ]
   }
  },
  "missing": "Các trang chính hãng (deyeinverter.com) và các mirror sách hướng dẫn bị chặn truy cập, nên chưa đọc được nội dung sách hướng dẫn, chỉ có tiêu đề và đoạn trích từ kết quả tìm kiếm. Vì vậy phần lớn bước ở mức thực hành chung (v=0). Chưa xác minh tên menu chính xác, ngưỡng pin, thứ tự bật/tắt. Deye không có dòng off-grid thuần trong nguồn đã tìm thấy: phần off-grid dùng hybrid ở chế độ không nối lưới và chưa được xác nhận từ tài liệu hãng."
 },
 {
  "id": "luxpower",
  "name": "LuxPower",
  "color": "#1E5AA8",
  "badge": "LX",
  "app": "Màn hình LCD trên biến tần (menu Advanced settings) và cổng giám sát web/app LuxPower (monitor.luxpowertek.com) qua datalogger WiFi/LAN",
  "types": {
   "hybrid": {
    "model": "LXP-LB-EU 8-10K, LXP-LB-EU 12K, GEN-LB-EU 3-6K / 7-10K (hybrid 1 pha, pin 48V)",
    "steps": [
     [
      "Đọc đúng sách hướng dẫn của model đang lắp (LXP-LB-EU 8-10K, 12K, GEN-LB-EU 3-6K hoặc 7-10K) vì giá trị khác nhau theo model. Kiểm tra <b>điện áp DC tối đa</b>, dải MPPT, dòng tối đa mỗi MPPT và công suất DC tối đa trong datasheet. Dòng LXP-LB-EU 10K có 2 MPPT, công suất DC tối đa 15 kW theo trang bán hàng.",
      1
     ],
     [
      "Tính <b>Voc của chuỗi ở nhiệt độ thấp nhất</b> và đảm bảo không vượt điện áp DC tối đa của biến tần. Kiểm tra dòng Isc từng chuỗi không vượt dòng cho phép của cổng MPPT, và tỷ lệ DC/AC theo khuyến nghị hãng.",
      0
     ],
     [
      "Chọn pin điện áp danh định <b>48V (51.2V)</b>. Chọn cầu dao DC/cáp pin theo dòng sạc/xả tối đa của model. Tiếp địa vỏ biến tần trước khi đấu các cổng khác.",
      0
     ],
     [
      "Đấu nối: nguồn lưới vào cổng GRID, tải dự phòng vào cổng EPS/Backup (nếu dùng), cáp pin, rồi cáp PV. Thứ tự đóng thường là pin, rồi PV, rồi AC; ngắt thì ngược lại. Kiểm tra cực tính bằng đồng hồ trước khi đóng, và làm đúng thứ tự trong sách của model.",
      0
     ],
     [
      "Với pin lithium có giao tiếp, đấu cáp truyền thông vào cổng pin dạng <b>RJ45 hỗ trợ CAN và RS485</b> (ví dụ 8-10K EU: CAN H chân 4, CAN L chân 5; tuỳ model, kiểm tra sơ đồ chân trong sách).",
      1
     ],
     [
      "Sau khi đấu cáp pin và cáp truyền thông, vào menu <b>Advanced settings</b> trên LCD để chọn loại pin và hãng pin. Pin Luxpower chọn Lithium, brand số 6 (Luxpower); pin Hina chọn Lithium, brand số 1. Nếu pin lithium không giao tiếp được, sách cho phép chọn <b>Lead-acid</b> và nhập dung lượng Ah.",
      1
     ],
     [
      "Nếu chạy song song nhiều biến tần, gạt công tắc DIP điện trở cân bằng CAN (2 bit) sang ON chỉ ở biến tần đầu và cuối của chuỗi nối. Các biến tần ở giữa để OFF.",
      1
     ],
     [
      "Cài datalogger WiFi/LAN và tạo tài khoản trên cổng giám sát LuxPower để cấu hình từ xa. Trên đó đặt <b>chuẩn lưới/Grid Regulation</b>, giới hạn sạc/xả, SOC/điện áp ngắt xả, chế độ làm việc (ưu tiên tải, ưu tiên sạc pin, theo giờ) và giới hạn xuất lưới. Tên mục chính xác có thể đổi theo phiên bản giao diện, hãy đối chiếu giao diện hiện tại.",
      0
     ],
     [
      "Với tình huống cần giới hạn xuất lưới, sách hướng dẫn giám sát của hãng (bản US 12K) có tuỳ chọn <b>Charge Last</b>: PV cấp tải trước, rồi bán lưới, và chỉ sạc pin khi công suất xuất lưới đạt giới hạn. Kiểm tra bản EU có tuỳ chọn tương ứng không và quy định điện lực địa phương về chống chảy ngược.",
      1
     ],
     [
      "Chạy thử: kiểm tra biến tần lên lưới, pin sạc/xả đúng, chuyển sang EPS khi cắt lưới, và dữ liệu hiện trên web giám sát. Ghi lại mã lỗi (nếu có) và đối chiếu bảng xử lý sự cố trong sách.",
      0
     ]
    ],
    "tips": [
     "Luôn làm theo sách hướng dẫn đúng model, đúng phiên bản firmware và quy định của điện lực địa phương. Giao diện giám sát và tên mục có thể thay đổi giữa các bản.",
     "Pin lithium không giao tiếp được (sai cáp CAN/RS485 hoặc sai brand) là lỗi hay gặp. Kiểm tra cáp và lựa chọn brand trước khi chuyển sang chế độ Lead-acid.",
     "Cắt cả AC, PV và pin và chờ tụ xả điện trước khi mở nắp biến tần."
    ]
   },
   "offgrid": {
    "model": "LuxPower SNA 3000-6000 (SNA3000/5000/6000), SNA 12K (off-grid 1 pha, có thể chạy backup/tự dùng)",
    "steps": [
     [
      "Đọc sách hướng dẫn SNA đúng model (SNA 3-6K hoặc SNA 12K). Theo sách SNA 3-6K, máy có <b>2 bộ MPPT, dải MPPT 120V~385V</b>, đối chiếu thêm điện áp DC tối đa và dòng tối đa mỗi MPPT trong datasheet.",
      1
     ],
     [
      "Tính Voc chuỗi ở nhiệt độ thấp nhất để không vượt điện áp DC tối đa, và chọn số tấm sao cho điện áp làm việc nằm trong dải MPPT. Chọn công suất PV và tải phù hợp công suất biến tần.",
      0
     ],
     [
      "Tiếp địa vỏ máy, chọn cầu dao và cáp pin theo dòng tối đa của model. Đấu cáp pin trước (kiểm tra cực tính), sau đó PV, rồi các ngõ AC. Làm đúng thứ tự trong sách.",
      0
     ],
     [
      "Máy có <b>cổng riêng cho máy phát</b> (điều khiển máy phát từ xa được) và hỗ trợ <b>CAN/RS485</b> để giao tiếp BMS pin lithium. Đấu cáp BMS và máy phát theo sơ đồ chân trong sách.",
      1
     ],
     [
      "Trên LCD, vào cài đặt để chọn <b>loại pin và hãng pin</b> (lithium có BMS hoặc lead-acid kèm dung lượng Ah). Với các dòng LuxPower khác, sách ghi rõ phải chọn loại/hãng pin sau khi đấu pin. Hãy xác nhận menu chính xác trên SNA.",
      0
     ],
     [
      "Cài điện áp và tần số ngõ ra (thường 230V/50Hz tại Việt Nam), nguồn ưu tiên (PV, pin, lưới/máy phát) và ngưỡng điện áp/SOC ngắt xả và khởi động máy phát. Tên mục thay đổi theo model, xem sách.",
      0
     ],
     [
      "Thứ tự khởi động thường là: đóng pin, bật biến tần, đóng PV, rồi mới đóng tải từng nhóm. Không khởi động mọi tải cùng lúc để tránh sụt áp pin và quá tải.",
      0
     ],
     [
      "Máy hỗ trợ <b>chạy song song</b> (sách ghi tối đa 16 máy). Nếu song song, thực hiện đúng quy trình đấu cáp và cài đặt trong sách, tuyệt đối không tự suy diễn.",
      1
     ],
     [
      "Chạy thử: kiểm tra điện áp ngõ ra, sạc PV, chuyển nguồn sang máy phát và tải có ổn định. Kết nối datalogger lên cổng giám sát LuxPower để theo dõi từ xa, nếu model hỗ trợ.",
      0
     ]
    ],
    "tips": [
     "Làm theo sách hướng dẫn đúng model SNA và các quy định an toàn điện của địa phương. Tên menu LCD và thông số khác nhau giữa SNA 3-6K và SNA 12K.",
     "Không đấu ngược cực pin, không để tải khởi động lớn (động cơ, máy nén) vượt khả năng quá tải của máy."
    ]
   }
  },
  "missing": "Không truy cập được trực tiếp các file PDF hướng dẫn (luxpowertek.com và các trang lưu trữ bị chặn); nội dung v=1 chỉ lấy từ đoạn trích kết quả tìm kiếm của sách hướng dẫn chính hãng/nhà phân phối. Chưa tìm thấy dòng biến tần hòa lưới thuần (on-grid không pin) của LuxPower nên grid=null; LuxPower tập trung hybrid (LXP/GEN-LB) và off-grid (SNA). Chưa xác minh tên mục chính xác trên web giám sát, mật khẩu mặc định hay địa chỉ IP nên không ghi."
 },
 {
  "id": "sernergy",
  "name": "Sernergy",
  "color": "#2E7D32",
  "badge": "SE",
  "app": "",
  "types": {},
  "missing": "Chưa tìm được tài liệu công khai cho hãng này (nghi là \"Senergy\"). Xem tem máy và sách hướng dẫn kèm theo; gửi tên hãng/model chính xác để bổ sung."
 },
 {
  "id": "powermaster",
  "name": "PowerMaster",
  "color": "#6A1B9A",
  "badge": "PM",
  "app": "",
  "types": {},
  "missing": "Chưa tìm được hãng/model PowerMaster có tài liệu công khai đáng tin (chỉ thấy các dòng cũ đã ngừng sản xuất). Xem tem máy và sách hướng dẫn kèm theo; gửi tên model chính xác để bổ sung."
 }
];
