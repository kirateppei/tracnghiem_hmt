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
      "Tải và đọc sách hướng dẫn đúng model trên manuals.sma.de trước khi lắp (mỗi dòng có sách riêng, tên menu và số sự kiện thay đổi theo model/firmware).",
      0
     ],
     [
      "Kiểm tra <b>điện áp DC tối đa</b>: Voc của chuỗi ở nhiệt độ thấp nhất phải nhỏ hơn giới hạn của model.",
      0
     ],
     [
      "Kiểm tra dải MPPT, dòng vào tối đa mỗi ngõ MPPT và tỉ lệ công suất DC/AC theo datasheet của model.",
      0
     ],
     [
      "Lắp biến tần đúng vị trí và khoảng hở thông gió theo sách; thực hiện <b>tiếp địa</b>.",
      0
     ],
     [
      "Ngắt hoàn toàn AC và DC trước khi đấu dây; đấu AC/DC đúng cực tính, đúng thứ tự do sách của model quy định.",
      0
     ],
     [
      "Siết ốc đấu nối đúng mô-men trong sách. Ví dụ dòng STP-S/STPS-20 (xem bảng): ốc đầu AC 20 Nm, ốc cos DC 24 Nm ± 2 Nm, ốc nắp 18 Nm; model khác có giá trị khác.",
      1
     ],
     [
      "Đóng nguồn AC và DC theo thứ tự trong sách rồi quan sát đèn LED trạng thái.",
      0
     ],
     [
      "Nếu <b>chưa chọn country data set (bộ dữ liệu quốc gia)</b> thì biến tần không hòa lưới (feed-in bị dừng) và LED báo trạng thái dừng.",
      1
     ],
     [
      "Kết nối vào giao diện người dùng của biến tần qua LAN/WLAN hoặc SMA 360° App. Địa chỉ truy cập và mật khẩu ban đầu: lấy theo nhãn trên thiết bị/sách của model, không tự đoán.",
      0
     ],
     [
      "Chạy <b>Installation Assistant</b> (trình hướng dẫn cài đặt) trên giao diện web, đi lần lượt từng trang.",
      1
     ],
     [
      "Trong Installation Assistant chọn <b>country data set</b> phù hợp quốc gia, mục đích và quy mô hệ thống. SMA cảnh báo chọn sai gây rối loạn hệ thống và sự cố với đơn vị vận hành lưới; chưa chắc thì hỏi điện lực.",
      1
     ],
     [
      "Khi lắp nhiều biến tần trong cùng mạng truyền thông (Speedwire/Bluetooth), đặt <b>NetID</b> đúng; với Sunny Explorer phải chọn đúng Net ID và biến tần khi tạo nhà máy mới (mục \"Setting the NetID\" trong sách).",
      1
     ],
     [
      "Đổi tham số lưới (Grid Guard) cần <b>mã Grid Guard cá nhân</b>, xin qua Online Service Center của SMA, chỉ khả dụng sau 10 giờ vận hành đầu tiên.",
      1
     ],
     [
      "Đời cũ dùng Sunny Explorer: tạo nhà máy, đăng nhập tài khoản <b>Installer</b>, vào Option > SMA Grid Guard để nhập mã.",
      1
     ],
     [
      "Khi có biểu tượng cờ lê cạnh số serial thì sửa được tham số lưới (Grid Monitoring > Edit, nhớ lưu). Một bản chép trên diễn đàn ghi mật khẩu installer đời cũ là 1111 (chưa kiểm chứng, tuỳ model) - luôn đổi sau khi cài.",
      1
     ],
     [
      "Cấu hình chống chảy ngược/giới hạn công suất nếu điện lực yêu cầu: tên menu tuỳ model/firmware, xem sách.",
      0
     ],
     [
      "Có thể tắt tạm Webconnect khi commissioning để tránh biến tần cố kết nối không cần thiết, xong bật lại.",
      1
     ],
     [
      "Đăng ký thiết bị vào Sunny Portal để giám sát từ xa (SMA 360° App cần tài khoản Sunny Portal có sẵn).",
      1
     ],
     [
      "Nếu không lên Sunny Portal: đăng ký Webconnect cần mã <b>PIC</b> (chỉ số) và <b>RID</b> (6 ký tự chữ-số) trên nhãn; nên chép lại trước khi lắp vì rất khó đọc sau khi module đã gắn.",
      1
     ],
     [
      "Cắm cáp mạng thẳng vào router, bật DHCP; tránh bộ chuyển powerline/WLAN không hỗ trợ multicast/IGMP; kiểm tra firewall không chặn ied.sma.de:9523 và stun.sma.de:3478.",
      1
     ],
     [
      "Kiểm tra vận hành: biến tần chuyển sang trạng thái hòa lưới, công suất và điện áp lưới hợp lý, không có thông báo lỗi.",
      0
     ],
     [
      "Ghi lại thông số, chụp ảnh nghiệm thu; đổi mật khẩu mặc định và bàn giao tài khoản cho chủ hệ thống.",
      0
     ]
    ],
    "tips": [
     "An toàn: ngắt cả AC và DC, chờ tụ xả theo sách trước khi mở nắp; tấm pin vẫn phát điện khi có ánh sáng.",
     "Tuyệt đối chọn đúng country data set và tuân thủ quy định/hồ sơ đấu nối của điện lực địa phương; luôn làm theo sách hướng dẫn của đúng model.",
     "Quên mật khẩu installer: theo trao đổi trên diễn đàn dịch vụ SMA, hướng xử lý là xin mã PUK qua Online Service Center. Không có \"mật khẩu/mã Grid Guard vạn năng\" chính thức; đừng dùng mã lấy từ diễn đàn (đã có CVE về mã Grid Guard dễ đoán ở vài đời TL-21/TL-10/TL-30)."
    ],
    "tables": [
     {
      "t": "Mô-men siết - Sunny Tripower Storage/STPS-20 (theo sách ESSX-20)",
      "c": [
       "Vị trí",
       "Mô-men",
       "Ghi chú"
      ],
      "r": [
       [
        "Ốc đầu AC L1/L2/L3/N/PE (AF5)",
        "20 Nm",
        "dây 16-95 mm²"
       ],
       [
        "Ốc cos DC (M10x40, AF16)",
        "24 Nm ± 2 Nm",
        ""
       ],
       [
        "Ốc nắp (AF8)",
        "18 Nm",
        ""
       ],
       [
        "Tiếp địa phụ (M6x16)",
        "6 Nm",
        "tuỳ chọn"
       ]
      ]
     },
     {
      "t": "Mô-men siết - Sunny Tripower US (SIxx-US480-20) và loại lớn",
      "c": [
       "Vị trí",
       "Mô-men",
       "Ghi chú"
      ],
      "r": [
       [
        "Ốc đầu AC 16-95 mm²",
        "20 Nm",
        "SI27/40/60-US"
       ],
       [
        "Ốc cos DC (M10x40)",
        "24 Nm ± 2 Nm",
        "212 in-lb"
       ],
       [
        "Tiếp địa",
        "6 Nm",
        ""
       ],
       [
        "Ốc AC dây 120-150 mm²",
        "30 Nm",
        "dòng SHP (SHPxxx21)"
       ],
       [
        "Model Sunny Boy/Tripower nhỏ (CORE2, STP 3-12...)",
        "tuỳ model",
        "xem sách"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "3501",
      "m": "Điện trở cách điện của chuỗi PV thấp (biến tần đo trước khi hòa lưới). Có thể xuất hiện tạm thời khi mưa/sương.",
      "x": "Kiểm tra cách điện dây DC, giắc MC4, tấm pin; đo từng chuỗi. Xem trang Event 3501 và tài liệu Isolationsfehler của SMA.",
      "v": 1
     },
     {
      "c": "3301-3303",
      "m": "Hoạt động không ổn định: công suất DC đầu vào không đủ cho vận hành ổn định (nguồn bên thứ ba).",
      "x": "Thường gặp lúc bình minh/hoàng hôn hoặc nắng yếu; nếu kéo dài kiểm tra chuỗi/MPPT. Xem sách model.",
      "v": 1
     },
     {
      "c": "101",
      "m": "Lỗi lưới/quá áp lưới (giá trị tức thời): điện áp hoặc tổng trở lưới tại điểm đấu nối quá cao, biến tần ngắt lưới.",
      "x": "Đo điện áp lưới, kiểm tra dây AC đủ tiết diện, liên hệ điện lực nếu lưới cao kéo dài; không tự đổi tham số lưới.",
      "v": 1
     },
     {
      "c": "6101",
      "m": "Tự chẩn đoán - thiết bị nhiễu: lỗi chạy chương trình hoặc bản ghi hỏng; biến tần ngừng hòa lưới.",
      "x": "Khởi động lại biến tần; nếu còn thì cần thay cụm/biến tần theo SMA.",
      "v": 1
     },
     {
      "c": "6002-6412",
      "m": "Nhóm sự kiện tự chẩn đoán/thiết bị nhiễu, nguyên nhân do SMA Service xác định.",
      "x": "Ghi mã, khởi động lại thử, nếu còn thì liên hệ SMA Service Line.",
      "v": 1
     },
     {
      "c": "6202",
      "m": "Nhiễu ở khối giám sát dòng dư (RCMU/RCD) bên trong biến tần.",
      "x": "Khởi động lại; kiểm tra rò điện phía DC; còn lỗi thì liên hệ SMA Service.",
      "v": 1
     },
     {
      "c": "Không hòa lưới, LED báo dừng",
      "m": "Chưa chọn country data set trong Installation Assistant.",
      "x": "Chọn đúng country data set theo quy định địa phương.",
      "v": 1
     },
     {
      "c": "Không lên Sunny Portal",
      "m": "Sai/không nhập PIC-RID, DHCP tắt, firewall chặn cổng, hoặc powerline không multicast.",
      "x": "Xem bước kết nối mạng ở trên.",
      "v": 1
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Voc chuỗi ở nhiệt độ thấp nhất nhỏ hơn giới hạn DC tối đa của model",
      "Đúng cực tính DC, không chạm đất; đo cách điện chuỗi",
      "Ốc AC/DC đã siết đúng mô-men theo sách",
      "Tiếp địa biến tần chắc chắn, khoảng hở thông gió đủ",
      "CB/cầu dao AC đúng cỡ theo sách model, ghi nhãn",
      "Đã chép PIC/RID (nhãn) trước khi lắp và có mạng LAN/WLAN"
     ],
     "sau_khi_bat": [
      "LED trạng thái và giao diện web báo hòa lưới, không có sự kiện lỗi",
      "Đã chọn đúng country data set (Installation Assistant)",
      "Điện áp/tần số lưới và công suất hợp lý",
      "Đặt NetID đúng nếu nhiều biến tần cùng mạng",
      "Thiết bị lên Sunny Portal / SMA 360° App",
      "Chống chảy ngược/giới hạn công suất theo yêu cầu điện lực (nếu có)"
     ],
     "ban_giao": [
      "Đổi mật khẩu mặc định/installer; không dùng mã Grid Guard lấy từ diễn đàn",
      "Lưu mã Grid Guard cá nhân và tài khoản Sunny Portal cho chủ hệ thống",
      "Chụp ảnh nhãn (PIC/RID, serial), thông số cài đặt",
      "Hướng dẫn chủ nhà đọc App và liên hệ khi có lỗi",
      "Bàn giao sách hướng dẫn đúng model"
     ]
    }
   },
   "hybrid": {
    "model": "SMA Sunny Boy Storage 3.7 / 5.0 / 6.0 (SBS-10); Sunny Tripower Smart Energy (STPxx-SE)",
    "steps": [
     [
      "Xác nhận pin nằm trong danh sách <b>pin được SMA chấp thuận</b> (Approved batteries).",
      1
     ],
     [
      "Kiểm tra phiên bản firmware tương thích. Ví dụ tài liệu SMA-BYD áp dụng cho SBS3.7/5.0/6.0-10 firmware 3.11.10.R trở lên với BYD Battery-Box Premium HVS/HVM.",
      1
     ],
     [
      "Kiểm tra giới hạn điện áp/dòng của pin so với biến tần theo bảng trong sách (mục kết nối DC có giới hạn dòng theo từng loại pin). Ví dụ SBS5.0-10 (datasheet bán lẻ): dải DC 100-550 V, định mức 360 V.",
      1
     ],
     [
      "Ngắt toàn bộ nguồn, đấu AC và tiếp địa theo đúng cực tính, thứ tự trong sách.",
      0
     ],
     [
      "Đấu DC pin vào đúng cực tính, có bảo vệ DC theo hãng pin.",
      0
     ],
     [
      "Nếu dùng dự phòng (battery-backup): đấu thêm công tơ/bộ chuyển mạch backup theo sơ đồ SMA.",
      0
     ],
     [
      "Đấu <b>cáp CAN</b> giữa pin và biến tần theo mục \"Connecting CAN communication cable\" của sách; cáp tối thiểu CAT5e.",
      1
     ],
     [
      "Dây CAN tới BYD HVM/HVS vào cổng RJ45 hoặc domino của pin. Với BCU 2.0: cực 1 (CAN H) - chân 4, cực 2 (Enable) - chân 7, cực 3 (CAN L) - chân 5, cực 4 (GND) - chân 8.",
      1
     ],
     [
      "BCU 1.0 dùng bảng chân khác: kiểm tra phiên bản BCU của pin trước khi bấm cáp; điện trở cuối theo tài liệu hãng pin.",
      1
     ],
     [
      "Bật theo đúng thứ tự trong sách (AC, DC, pin). Với backup: biết vị trí công tắc cấp nguồn an toàn (secure power supply) và công tắc <b>black start</b> khi khởi động lại từ trạng thái pin cạn.",
      1
     ],
     [
      "Kết nối giao diện web hoặc SMA 360° App, chạy Installation Assistant.",
      1
     ],
     [
      "Trong Installation Assistant chọn <b>country data set</b>; không có country data set thì không hòa lưới.",
      1
     ],
     [
      "Khai báo loại pin và chế độ làm việc trong Installation Assistant.",
      1
     ],
     [
      "Cấu hình giới hạn sạc/xả, SOC/DoD tối thiểu, chế độ tự dùng, ưu tiên pin hoặc theo giờ. Tên menu và giá trị thay đổi theo firmware; xem sách.",
      0
     ],
     [
      "Chờ khoảng 5 phút sau khi cấp nguồn để biến tần dò BMS (theo kinh nghiệm người dùng); nếu pin không được nhận, kiểm tra cáp/địa chỉ CAN.",
      1
     ],
     [
      "Kiểm tra firmware pin đúng bảng tương thích BYD (ví dụ bộ HVS 5.1 + SBS2.5 nêu BMU 3.15, BMS 3.21).",
      1
     ],
     [
      "Thử dự phòng: SMA nêu cấp nguồn dự phòng tới 8 kW và tuỳ chọn dự phòng toàn nhà tự động. Giả lập mất lưới theo hướng dẫn để xác nhận chuyển sang backup.",
      1
     ],
     [
      "Kiểm tra pin sạc/xả đúng, không báo lỗi CAN/BMS, dữ liệu hiện trên Sunny Portal; ghi thông số bàn giao.",
      1
     ]
    ],
    "tips": [
     "Pin cao áp có điện áp nguy hiểm; chỉ kỹ thuật viên có chứng chỉ thao tác và theo đúng quy trình của hãng pin và SMA.",
     "Chỉ dùng pin và firmware nằm trong danh sách tương thích của SMA; tuân thủ quy định điện lực địa phương cho hệ thống có pin.",
     "Điều khiển sạc/xả qua Modbus (Home Assistant, Loxone) theo người dùng có thể bị Sunny Home Manager 2.0 ghi đè hoặc đổi hành vi sau cập nhật firmware; chỉ dùng khi đã kiểm tra firmware."
    ],
    "tables": [
     {
      "t": "Ngõ DC SBS5.0-10 (datasheet nhà bán lẻ, bản EU)",
      "c": [
       "Thông số",
       "Giá trị"
      ],
      "r": [
       [
        "Dải điện áp DC / định mức",
        "100-550 V / 360 V"
       ],
       [
        "Điện áp DC khởi động tối thiểu",
        "100 V"
       ],
       [
        "Dòng DC mỗi ngõ / số ngõ",
        "10 A / 3 x 10 A"
       ],
       [
        "Bản US 5.0-US: điện áp DC tối đa",
        "600 V (dải 100-550 V)"
       ],
       [
        "Dòng sạc/xả pin tối đa",
        "tuỳ model, xem sách"
       ]
      ]
     },
     {
      "t": "Chân cáp CAN SBS - BYD BCU 2.0",
      "c": [
       "Cực domino",
       "Chức năng",
       "Chân RJ45"
      ],
      "r": [
       [
        "1",
        "CAN H",
        "4"
       ],
       [
        "2",
        "Enable",
        "7"
       ],
       [
        "3",
        "CAN L",
        "5"
       ],
       [
        "4",
        "GND",
        "8"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "3501",
      "m": "Điện trở cách điện thấp (áp dụng khi có chuỗi PV nối vào, ví dụ Sunny Tripower Smart Energy).",
      "x": "Kiểm tra cách điện dây DC và giắc MC4; có thể tạm thời khi mưa/sương.",
      "v": 1
     },
     {
      "c": "101",
      "m": "Quá áp lưới (giá trị tức thời) - biến tần ngắt lưới.",
      "x": "Đo điện áp lưới, kiểm tra dây AC, liên hệ điện lực.",
      "v": 1
     },
     {
      "c": "6101",
      "m": "Tự chẩn đoán - thiết bị nhiễu.",
      "x": "Khởi động lại; còn lỗi thì liên hệ SMA Service.",
      "v": 1
     },
     {
      "c": "9325",
      "m": "Hiệu chỉnh lại SOC 20% với bước nhảy lớn hơn 10% (thấy trên hệ Sunny Island 8.0H theo diễn đàn).",
      "x": "Thông báo hiệu chuẩn SOC; không có cách xử lý xác nhận, xem sách model.",
      "v": 0
     },
     {
      "c": "Lỗi giao tiếp CAN/BMS (pin không được nhận)",
      "m": "Sai chân cáp CAN (BCU 1.0 khác 2.0), firmware pin không tương thích hoặc chưa đủ ~5 phút dò BMS.",
      "x": "Kiểm tra chân cáp, firmware pin theo bảng BYD, thử khởi động lại tuần tự.",
      "v": 1
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Pin và firmware thuộc danh sách tương thích SMA",
      "Cáp CAN đúng chân (kiểm tra BCU 1.0/2.0), CAT5e trở lên",
      "Cực tính DC pin đúng, bảo vệ DC đúng theo hãng pin",
      "Tiếp địa và đấu AC xong, ốc siết đúng mô-men",
      "Đã biết vị trí công tắc black start / secure power supply (nếu có backup)"
     ],
     "sau_khi_bat": [
      "Chạy Installation Assistant: country data set, loại pin, chế độ",
      "Biến tần nhận được pin sau ~5 phút, không lỗi CAN/BMS",
      "Pin sạc và xả đúng, SOC hiển thị hợp lý",
      "Thử mất lưới: chuyển sang backup đúng (nếu có)",
      "Dữ liệu lên Sunny Portal / SMA 360° App"
     ],
     "ban_giao": [
      "Ghi lại cài đặt SOC/DoD, chế độ vận hành",
      "Đổi mật khẩu mặc định, giao tài khoản Sunny Portal",
      "Hướng dẫn quy trình black start cho chủ nhà",
      "Lưu tài liệu tương thích pin/firmware"
     ]
    }
   },
   "offgrid": {
    "model": "SMA Sunny Island (4.4M / 6.0H / 8.0H, 48 V) kết hợp Sunny Boy/Tripower",
    "steps": [
     [
      "Sunny Island là biến tần/sạc <b>48 V</b>, công suất danh định lần lượt 3,3 / 4,6 / 6,0 kVA (4.4M / 6.0H / 8.0H).",
      1
     ],
     [
      "Chọn pin chì-axit hoặc Li-ion được SMA chấp thuận; dung lượng cho phép 100-10.000 Ah (chì) hoặc 50-10.000 Ah (Li-ion).",
      1
     ],
     [
      "Tính tải cực đại và dòng khởi động của tải; quyết định có ghép nhiều Sunny Island thành cụm hay không.",
      0
     ],
     [
      "Chọn cầu chì/aptomat DC phía pin theo sách của model.",
      0
     ],
     [
      "Đấu pin đúng cực tính, có bảo vệ DC; tiếp địa.",
      0
     ],
     [
      "Với Li-ion: đấu giao tiếp BMS theo sách.",
      0
     ],
     [
      "Đấu ngõ ra tải AC (AC loads). Ngõ vào AC nhận lưới hoặc <b>máy phát</b>: lưới 172,5-264,5 V/40-70 Hz; chế độ độc lập 202-253 V/45-65 Hz; tối đa 50 A hoặc 11.500 W.",
      1
     ],
     [
      "Thiết bị tự nhận dạng thứ tự pha (rotary field detection); thứ tự khởi động và đóng aptomat theo sách của model.",
      1
     ],
     [
      "Cấu hình qua LAN/WLAN bằng điện thoại hoặc máy tính bảng, chạy hướng dẫn cấu hình nhanh (quick configuration). Tên menu cụ thể xem sách.",
      1
     ],
     [
      "Khai báo loại pin, dung lượng, điện áp/tần số ngõ ra đúng chuẩn địa phương trong quick configuration.",
      1
     ],
     [
      "Nguồn máy phát: trong Quick Configuration chọn nguồn ngoài là <b>Gen</b>; mặc định của SMA phù hợp máy phát dòng danh định trên 16 A (khoảng 4 kVA).",
      1
     ],
     [
      "Tinh chỉnh dòng, điện áp, tần số, thời gian chạy tối thiểu của máy phát. Mở rộng dải chấp nhận nếu máy phát hay bị ngắt khi nóng máy (người dùng gặp lỗi W351/W319).",
      1
     ],
     [
      "Với Sunny Boy nối ngõ ra Sunny Island: khi lưới mất và pin đầy, Sunny Island <b>tăng tần số</b> để Sunny Boy giảm công suất (theo người dùng, lưới 60 Hz bắt đầu giảm ở khoảng 60,5 Hz, ngắt ở 61 Hz; lưới 50 Hz dịch quanh 50 Hz - xem sách).",
      1
     ],
     [
      "Sunny Boy bản US cần tham số <b>Backup Mode = On All</b> (tuỳ model/firmware).",
      1
     ],
     [
      "Kiểm tra vận hành: ngõ ra ổn định, pin sạc/xả đúng, máy phát tự khởi động khi pin thấp, tải bảo vệ ngắt đúng.",
      0
     ],
     [
      "Theo dõi từ xa qua Sunny Portal nếu có mạng; ghi cài đặt bàn giao.",
      0
     ]
    ],
    "tips": [
     "Lỗi hay gặp: dung lượng pin quá nhỏ so với tải, sai cấu hình pin hoặc máy phát không đạt dải điện áp/tần số cho phép.",
     "Tuân thủ sách hướng dẫn của đúng model Sunny Island và quy định an toàn điện địa phương; không tự ý đổi tham số bảo vệ pin.",
     "Theo người dùng, một số Sunny Boy US-40 đời mới không có RS485 nên không đổi được tham số qua Sunny Island; kiểm tra khả năng tương thích trước khi mua."
    ],
    "tables": [
     {
      "t": "Sunny Island 4.4M / 6.0H / 8.0H",
      "c": [
       "Thông số",
       "Giá trị"
      ],
      "r": [
       [
        "Điện áp pin",
        "48 V"
       ],
       [
        "Công suất danh định",
        "3,3 / 4,6 / 6,0 kVA"
       ],
       [
        "Dung lượng pin chì-axit",
        "100-10.000 Ah"
       ],
       [
        "Dung lượng pin Li-ion",
        "50-10.000 Ah"
       ],
       [
        "Dòng sạc tối đa 6.0H (nhà bán lẻ)",
        "110 A"
       ]
      ]
     },
     {
      "t": "Ngõ vào AC (lưới/máy phát)",
      "c": [
       "Chế độ",
       "Điện áp",
       "Tần số"
      ],
      "r": [
       [
        "Nối lưới",
        "172,5-264,5 V",
        "40-70 Hz"
       ],
       [
        "Độc lập",
        "202-253 V",
        "45-65 Hz"
       ],
       [
        "Tối đa",
        "50 A hoặc 11.500 W",
        ""
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "W351",
      "m": "Cảnh báo máy phát/nguồn ngoài (người dùng gặp cùng W319 khi máy phát sụt áp xuống dưới 180 V lúc sạc).",
      "x": "Kiểm tra công suất máy phát, mở rộng dải điện áp/tần số chấp nhận, kiểm tra dây; nghĩa chính thức xem sách.",
      "v": 0
     },
     {
      "c": "W319",
      "m": "Cảnh báo liên quan nguồn ngoài/máy phát (xuất hiện cùng W351 theo diễn đàn).",
      "x": "Như trên; xem sách Sunny Island.",
      "v": 0
     },
     {
      "c": "9325",
      "m": "Hiệu chỉnh lại SOC 20% với bước nhảy lớn hơn 10% (theo người dùng Sunny Island 8.0H).",
      "x": "Kiểm tra dung lượng pin khai báo và SOC; xem sách.",
      "v": 0
     },
     {
      "c": "Máy phát không sạc",
      "m": "Máy phát không đạt dải điện áp/tần số cho phép hoặc công suất quá nhỏ.",
      "x": "Chọn nguồn ngoài Gen, đặt giới hạn dòng đúng, mở rộng dải chấp nhận.",
      "v": 1
     },
     {
      "c": "Sunny Boy không đổi được tham số qua SI",
      "m": "Một số Sunny Boy US-40 đời mới không có RS485 (theo người dùng).",
      "x": "Kiểm tra tương thích trước khi mua.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Pin đúng loại được SMA chấp thuận, dung lượng nằm trong dải cho phép",
      "Cực tính DC pin đúng, có cầu chì/aptomat DC",
      "Tiếp địa và đấu ngõ ra tải AC đúng",
      "Giao tiếp BMS đã đấu (nếu Li-ion)",
      "Máy phát nằm trong dải điện áp/tần số của ngõ vào AC"
     ],
     "sau_khi_bat": [
      "Hoàn tất quick configuration: loại pin, dung lượng, điện áp/tần số",
      "Ngõ ra AC ổn định đúng chuẩn địa phương",
      "Pin sạc/xả đúng, SOC hợp lý",
      "Máy phát tự khởi động khi pin thấp và nạp được",
      "Sunny Boy giảm công suất khi pin đầy (dịch tần số)"
     ],
     "ban_giao": [
      "Không tự đổi tham số bảo vệ pin; ghi lại cài đặt",
      "Hướng dẫn chủ nhà về giới hạn tải và dung lượng pin",
      "Đổi mật khẩu mặc định (nếu có), lưu tài khoản Sunny Portal",
      "Bàn giao sách đúng model"
     ]
    }
   }
  },
  "missing": "Không truy cập được manuals.sma.de (bị chặn mạng), chỉ có đoạn tóm tắt từ kết quả tìm kiếm nên nhiều bước chi tiết (tên menu, mật khẩu/IP mặc định, thứ tự đóng AC/DC, thông số pin) để v=0 hoặc nhắc xem sách. Không ghi mật khẩu hay IP mặc định. Sunny Tripower Smart Energy chỉ nêu tên dòng, chưa kiểm chứng chi tiết. Vòng bổ sung: mọi URL không chính thức đều bị chặn egress, chỉ dùng đoạn trích tìm kiếm (da_doc=false); không tìm được nguồn tiếng Việt hay DIY Solar/Whirlpool đọc được."
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
      "Đối chiếu nhãn/datasheet đúng model (<b>SUN2000-(2KTL-6KTL)-L1</b> 1 pha hoặc <b>SUN2000-(3KTL-10KTL)-M1</b> 3 pha): điện áp DC tối đa, dải MPPT, dòng vào tối đa mỗi MPPT (tuỳ model, xem sách hướng dẫn).",
      0
     ],
     [
      "Tính Voc của chuỗi ở nhiệt độ thấp nhất tại địa điểm, không để vượt điện áp DC tối đa của model.",
      0
     ],
     [
      "Kiểm tra tỷ lệ công suất DC/AC và số chuỗi trên mỗi MPPT theo giới hạn của model; công suất tấm không nên vượt mức tối đa Huawei cho phép trong sách hướng dẫn.",
      0
     ],
     [
      "Lắp biến tần đúng vị trí, khoảng hở thông gió và hướng lắp theo sách hướng dẫn; tránh nắng trực tiếp và nơi ẩm ướt.",
      0
     ],
     [
      "Chuẩn bị aptomat AC riêng: theo sách Huawei, L1 dùng CB 1 pha ≥ 250 V AC (32 A cho 4–6 kW), M1 dùng CB 3 pha ≥ 380 V AC (16 A cho 3–6 kW, 25 A cho 8–10 kW). Xem bảng.",
      1
     ],
     [
      "Đấu <b>tiếp địa (PE)</b> trước tiên.",
      0
     ],
     [
      "Đấu cáp AC vào đầu AC của biến tần rồi lên aptomat AC (chưa đóng); siết theo mô-men và tiết diện trong sách hướng dẫn.",
      0
     ],
     [
      "Đo và kiểm tra cực tính từng chuỗi PV bằng đồng hồ trước khi cắm MC4; đấu chuỗi PV vào đúng cổng MPPT.",
      0
     ],
     [
      "Thứ tự bật: đóng aptomat AC trước, sau đó bật <b>DC switch</b> trên biến tần. Tắt theo thứ tự ngược lại. Xác nhận trong chương 'Verification before Power-On / System Power-On' của sách.",
      1
     ],
     [
      "Mở app <b>FusionSolar</b> (hoặc SUN2000 App cho kỹ thuật viên) và kết nối biến tần qua Bluetooth/WLAN (tuỳ model, có thể cần Smart Dongle).",
      1
     ],
     [
      "Đăng nhập tài khoản installer: mật khẩu WLAN ban đầu in trên nhãn/mã QR; theo quick guide, mật khẩu installer khởi tạo thường là <b>00000a</b> (tuỳ model/firmware, có thể bị yêu cầu đặt mật khẩu mới). <b>Đổi mật khẩu ngay</b> và ghi lại.",
      1
     ],
     [
      "Trong 'App Commissioning' chọn <b>Grid Code</b> phù hợp quy định điện lực địa phương (Việt Nam: hỏi điện lực mã lưới được chấp nhận; sách có phụ lục Grid Code).",
      1
     ],
     [
      "Cài ngày giờ, tạo nhà máy (PV plant) và tài khoản trên FusionSolar để giám sát từ xa.",
      1
     ],
     [
      "Nếu điện lực yêu cầu chống chảy ngược/giới hạn xuất lưới: lắp <b>Smart Power Sensor</b> (DDSU666-H 1 pha, DTSU666-H 3 pha hoặc SmartPS), rồi cấu hình giới hạn xuất lưới; biến tần tự giảm công suất PV. Tên menu chính xác tuỳ phiên bản app.",
      1
     ],
     [
      "Kiểm tra vận hành: trạng thái 'Grid-connected', điện áp/tần số lưới, sản lượng, không có cảnh báo.",
      0
     ],
     [
      "Cảnh báo hay gặp <b>Low Insulation Resistance</b> (ID 2062): thường do chạm đất/ẩm ở dây DC hoặc tấm pin; kiểm tra PE, ngắt từng chuỗi để tìm chuỗi lỗi. Chỉ hạ ngưỡng bảo vệ khi chắc chắn không phải lỗi thật (thời tiết mưa/mây).",
      1
     ],
     [
      "Nếu cần đọc dữ liệu cục bộ (Home Assistant, evcc, Loxone): bật <b>Modbus TCP</b> trong cài đặt truyền thông bằng tài khoản installer tại chỗ, thường qua Smart Dongle; theo nguồn bên thứ ba mặc định đang tắt.",
      1
     ],
     [
      "Lưu ý: một người dùng báo dùng Modbus qua dongle có thể ảnh hưởng truy cập đám mây FusionSolar của đơn vị lắp đặt (tuỳ firmware, chưa kiểm chứng).",
      1
     ]
    ],
    "tips": [
     "Chỉ làm theo sách hướng dẫn đúng model và quy định điện lực địa phương; chỉ cài Grid Code được điện lực chấp nhận.",
     "Có điện DC ngay khi tấm pin nhận nắng: luôn ngắt AC và DC switch và chờ theo thời gian xả trong sách hướng dẫn trước khi thao tác.",
     "Theo người dùng diễn đàn, ứng dụng đôi khi treo ở bước nhập mật khẩu installer sau khi kết nối WLAN của biến tần; chưa có cách khắc phục được xác nhận."
    ],
    "tables": [
     {
      "t": "CB AC khuyến nghị (theo sách Huawei)",
      "c": [
       "Dòng",
       "Model",
       "CB khuyến nghị"
      ],
      "r": [
       [
        "SUN2000-L1 (1 pha)",
        "4KTL / 4.6KTL / 5KTL / 6KTL",
        "≥ 250 V AC, 32 A"
       ],
       [
        "SUN2000-L1 (1 pha)",
        "2KTL / 3KTL",
        "tuỳ model, xem sách"
       ],
       [
        "SUN2000-M1 (3 pha)",
        "3KTL / 4KTL / 5KTL / 6KTL",
        "≥ 380 V AC, 16 A"
       ],
       [
        "SUN2000-M1 (3 pha)",
        "8KTL / 10KTL",
        "≥ 380 V AC, 25 A"
       ]
      ]
     },
     {
      "t": "CB/cầu dao DC khuyến nghị (nếu dùng ngoài DC switch)",
      "c": [
       "Dòng",
       "Giá trị",
       "Ghi chú"
      ],
      "r": [
       [
        "SUN2000-L1",
        "≥ 600 V DC, 20 A",
        "theo chương chuẩn bị cáp của sách"
       ],
       [
        "SUN2000-M1",
        "tuỳ model",
        "xem sách"
       ]
      ]
     },
     {
      "t": "Thông số chưa xác minh (xem sách đúng model)",
      "c": [
       "Thông số",
       "Giá trị"
      ],
      "r": [
       [
        "Tiết diện cáp AC",
        "tuỳ model, xem sách"
       ],
       [
        "Mô-men siết đầu AC/PE",
        "tuỳ model, xem sách"
       ],
       [
        "Điện áp DC tối đa",
        "tuỳ model, xem datasheet"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "2062 Low Insulation Resistance",
      "m": "Điện trở cách điện của dàn PV xuống đất thấp (mức Major theo tài liệu Huawei).",
      "x": "Kiểm tra PE và trở kháng dàn so với đất, tìm chuỗi chạm đất/ẩm; chỉ chỉnh ngưỡng bảo vệ khi chắc không phải lỗi thật.",
      "v": 1
     },
     {
      "c": "Grid Overvoltage (quá áp lưới)",
      "m": "Điện áp lưới vượt ngưỡng của Grid Code; thường do sụt áp/độ cao áp trên dây AC.",
      "x": "Đo áp tại đầu AC, kiểm tra tiết diện/độ dài dây và Grid Code; xin điện lực xử lý nếu lưới cao. Mã ID tuỳ model/firmware, xem sách.",
      "v": 0
     },
     {
      "c": "Grid Undervoltage / Underfrequency",
      "m": "Điện áp hoặc tần số lưới dưới ngưỡng.",
      "x": "Kiểm tra lưới, aptomat AC, mối đấu; biến tần thường tự hồi phục khi lưới ổn định. Mã ID tuỳ model/firmware.",
      "v": 0
     },
     {
      "c": "Grid Code không đúng",
      "m": "Chọn sai Grid Code làm biến tần cắt hoặc bị điện lực từ chối.",
      "x": "Hỏi điện lực mã lưới được chấp nhận, đặt lại trong App Commissioning.",
      "v": 0
     },
     {
      "c": "Cảnh báo điện áp DC chuỗi cao",
      "m": "Voc chuỗi vượt điện áp DC tối đa của model.",
      "x": "Tính lại Voc ở nhiệt độ thấp, giảm số tấm/chuỗi. Mã ID tuỳ model, xem sách.",
      "v": 0
     },
     {
      "c": "Cắm ngược cực chuỗi PV",
      "m": "Chuỗi PV đấu ngược cực.",
      "x": "Tắt DC switch và AC, chờ xả, đấu lại đúng cực sau khi kiểm bằng đồng hồ. Mã ID tuỳ model.",
      "v": 0
     },
     {
      "c": "Mất liên lạc app/dongle",
      "m": "App không kết nối hoặc treo ở bước nhập mật khẩu installer (báo cáo diễn đàn).",
      "x": "Kết nối lại WLAN biến tần, khởi động lại app; chưa có cách khắc phục được xác nhận.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Đối chiếu nhãn model, Voc chuỗi ở nhiệt độ thấp so với điện áp DC tối đa",
      "Kiểm cực tính và điện áp hở mạch từng chuỗi bằng đồng hồ",
      "Kiểm PE chắc chắn, điện trở tiếp địa đạt",
      "Aptomat AC đúng loại (1 pha ≥ 250 V / 3 pha ≥ 380 V) và đang ngắt",
      "Siết đầu AC, PV, đậy nắp khoang đấu dây theo sách",
      "Có sách hướng dẫn đúng model tại chỗ"
     ],
     "sau_khi_bat": [
      "Bật đúng thứ tự: đóng CB AC rồi DC switch",
      "Kết nối FusionSolar/SUN2000 App, đổi mật khẩu installer",
      "Chọn Grid Code được điện lực chấp nhận",
      "Cài ngày giờ, tạo plant trên FusionSolar",
      "Trạng thái 'Grid-connected', không còn cảnh báo (nhất là 2062)",
      "Nếu có giới hạn xuất lưới: kiểm tra Smart Power Sensor đọc đúng chiều và biến tần giảm công suất đúng"
     ],
     "ban_giao": [
      "Ghi lại tài khoản/mật khẩu mới và địa chỉ plant, giao cho chủ nhà",
      "Hướng dẫn chủ nhà xem sản lượng trên FusionSolar",
      "Giao sách hướng dẫn, ảnh sơ đồ đấu nối, thông tin Grid Code đã chọn",
      "Chụp ảnh nhãn thiết bị và số serial",
      "Hướng dẫn quy trình tắt khẩn cấp (AC rồi DC switch)"
     ]
    }
   },
   "hybrid": {
    "model": "SUN2000-(2-6)KTL-L1 / SUN2000-(3-10)KTL-M1 + pin LUNA2000",
    "steps": [
     [
      "Xác định cấu hình: SUN2000-(2-6)KTL-L1 (1 pha) hoặc SUN2000-(3-10)KTL-M1 (3 pha) kết hợp pin <b>LUNA2000</b>. Theo trang thông số Huawei, M1 3–10 kW được liệt kê tương thích; danh sách khác nhau theo thị trường.",
      1
     ],
     [
      "Kiểm tra dung lượng pin, số module (mỗi module LUNA2000-S0 5 kWh) và công suất biến tần theo bảng tương thích trong sách hướng dẫn.",
      1
     ],
     [
      "Kiểm tra DC: điện áp DC tối đa, Voc ở nhiệt độ thấp, dòng MPPT và tỷ lệ DC/AC theo datasheet đúng model.",
      0
     ],
     [
      "Lắp pin LUNA2000 và biến tần theo hướng dẫn lắp đặt (vị trí, khoảng hở, nền lắp).",
      0
     ],
     [
      "Đấu tiếp địa (PE) trước cho cả biến tần và pin.",
      0
     ],
     [
      "Đấu cáp nguồn pin và cáp giao tiếp pin-biến tần đúng sơ đồ trong sách, không tự ý đổi cáp.",
      0
     ],
     [
      "Lắp <b>smart power sensor / meter</b> tại điểm đấu nối lưới; Huawei nêu meter là thiết bị thiết yếu khi lắp pin.",
      1
     ],
     [
      "Đấu RS485 của meter theo sơ đồ quick guide, kiểm tra đúng chiều (CT/dây pha).",
      1
     ],
     [
      "Nếu cần điện dự phòng khi mất lưới, lắp <b>Backup Box</b>: hộp chuyển biến tần giữa nối lưới và tách lưới (phạm vi tải backup tuỳ model, thị trường).",
      1
     ],
     [
      "Bật nguồn theo trình tự của sách (thường đóng AC, bật DC switch biến tần, rồi bật pin).",
      0
     ],
     [
      "Kết nối app FusionSolar/SUN2000 (Smart Dongle hoặc WLAN trực tiếp) bằng tài khoản installer; đổi mật khẩu mặc định.",
      0
     ],
     [
      "Chạy <b>Quick Settings / App Commissioning</b>: chọn Grid Code, thêm pin LUNA2000 và meter.",
      0
     ],
     [
      "Chọn chế độ làm việc (Working mode): tự dùng tối đa (Maximize self-consumption), bán hết lên lưới, hoặc theo giờ (Time-of-use); tên menu tuỳ phiên bản app.",
      1
     ],
     [
      "Đặt giới hạn SOC: ngưỡng xả tối thiểu, SOC dự trữ backup, công suất sạc/xả tối đa, sạc từ lưới nếu quy định cho phép. Theo khuyến nghị Huawei; ví dụ SOC tối thiểu 5% từ hướng dẫn Huawei Thuỵ Sĩ chỉ là minh hoạ.",
      0
     ],
     [
      "Kiểm tra vận hành: pin hiện đúng trạng thái sạc/xả, meter đọc đúng chiều công suất, giám sát từ xa trên FusionSolar.",
      0
     ],
     [
      "Nếu có backup: thử mất lưới (ngắt CB lưới) để kiểm tra biến tần chuyển sang tách lưới.",
      0
     ],
     [
      "Nếu dùng Modbus TCP (evcc, Home Assistant): bật bằng tài khoản installer tại chỗ. Theo evcc, đọc lưới và điều khiển pin cần Smart Power Sensor.",
      1
     ],
     [
      "Có thể dùng Smart Dongle để Modbus và app FusionSolar chạy đồng thời, nhưng số kết nối cùng lúc bị giới hạn (một người dùng báo thêm thiết bị làm rớt kết nối).",
      1
     ]
    ],
    "tips": [
     "Pin lithium: không tự đấu hoặc thay cáp pin khi chưa tắt đúng trình tự; làm theo quick guide của model và LUNA2000.",
     "Thiếu meter hoặc đấu sai chiều CT/RS485 là lỗi hay gặp, làm sai chế độ tự dùng và chống chảy ngược."
    ],
    "tables": [
     {
      "t": "Pin LUNA2000-S0 (theo trang thông số Huawei)",
      "c": [
       "Thông số",
       "LUNA2000-5-S0",
       "-10-S0",
       "-15-S0"
      ],
      "r": [
       [
        "Số module 5 kWh",
        "1",
        "2",
        "3"
       ],
       [
        "Dung lượng khả dụng",
        "5 kWh",
        "10 kWh",
        "15 kWh"
       ],
       [
        "Công suất ra tối đa",
        "2.5 kW",
        "5 kW",
        "5 kW"
       ]
      ]
     },
     {
      "t": "Dải điện áp làm việc pin (LUNA2000-S0)",
      "c": [
       "Hệ thống",
       "Dải điện áp",
       "Danh định"
      ],
      "r": [
       [
        "1 pha",
        "350 – 560 V",
        "450 V"
       ],
       [
        "3 pha",
        "600 – 980 V",
        "600 V"
       ]
      ]
     },
     {
      "t": "CB AC khuyến nghị cho biến tần",
      "c": [
       "Dòng",
       "CB khuyến nghị"
      ],
      "r": [
       [
        "L1 4–6 kW",
        "≥ 250 V AC, 32 A"
       ],
       [
        "M1 3–6 kW",
        "≥ 380 V AC, 16 A"
       ],
       [
        "M1 8–10 kW",
        "≥ 380 V AC, 25 A"
       ],
       [
        "Cáp/mô-men",
        "tuỳ model, xem sách"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "2062 Low Insulation Resistance",
      "m": "Cách điện dàn PV xuống đất thấp.",
      "x": "Kiểm tra PE và trở kháng dàn, tìm chuỗi chạm đất/ẩm.",
      "v": 1
     },
     {
      "c": "Mất liên lạc meter",
      "m": "Biến tần không đọc được smart power sensor (RS485 hỏng/đấu sai).",
      "x": "Kiểm tra dây RS485, địa chỉ và nguồn meter. Mã ID tuỳ firmware.",
      "v": 0
     },
     {
      "c": "Pin không nhận / lỗi giao tiếp pin",
      "m": "Biến tần không thấy LUNA2000 (cáp giao tiếp hoặc nguồn pin sai).",
      "x": "Kiểm tra cáp pin và cáp giao tiếp theo sơ đồ, trình tự bật pin. Mã ID tuỳ model.",
      "v": 0
     },
     {
      "c": "Grid Code sai",
      "m": "Chọn sai mã lưới gây cắt hoặc từ chối đấu nối.",
      "x": "Hỏi điện lực, đặt lại trong App Commissioning.",
      "v": 0
     },
     {
      "c": "Grid Overvoltage",
      "m": "Điện áp lưới vượt ngưỡng; có báo cáo diễn đàn trên SUN2000-5KTL-L1 khi lưới ~253–259 V.",
      "x": "Đo áp tại biến tần, kiểm tra dây AC và Grid Code, báo điện lực.",
      "v": 0
     },
     {
      "c": "Đấu sai chiều meter/CT",
      "m": "Làm sai chế độ tự dùng và chống chảy ngược.",
      "x": "Kiểm chiều công suất trên app, đảo lại đấu nối theo quick guide.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Đối chiếu tương thích biến tần - LUNA2000 theo sách (số module, dải điện áp pin)",
      "Kiểm PE biến tần và pin",
      "Kiểm cáp nguồn và cáp giao tiếp pin theo sơ đồ",
      "Kiểm đấu meter RS485 và chiều CT",
      "Kiểm cực tính và Voc từng chuỗi PV",
      "CB AC đúng loại và đang ngắt"
     ],
     "sau_khi_bat": [
      "Bật đúng trình tự của sách (AC, DC switch, rồi pin)",
      "Chạy Quick Settings: Grid Code, thêm pin và meter",
      "Đặt Working mode và giới hạn SOC",
      "Xác nhận meter đọc đúng chiều và pin sạc/xả đúng",
      "Thử mất lưới nếu có Backup Box",
      "Đổi mật khẩu installer"
     ],
     "ban_giao": [
      "Giao thông số cài đặt: Grid Code, Working mode, SOC",
      "Hướng dẫn chủ nhà xem pin/sản lượng trên FusionSolar",
      "Giao tài khoản và sơ đồ đấu nối",
      "Hướng dẫn quy trình tắt khẩn cấp biến tần và pin theo sách",
      "Ghi serial biến tần, pin, meter"
     ]
    }
   }
  },
  "missing": "Huawei không có dòng biến tần off-grid thuần (không nối lưới); hệ SUN2000 + LUNA2000 là hybrid hòa lưới, backup khi mất lưới tuỳ model. Hạn chế: các domain solar.huawei.com, support.huawei.com, midsummer.ie, vattenfall.se bị chặn nên không đọc được toàn văn sách hướng dẫn, chỉ có tóm tắt từ kết quả tìm kiếm; vì vậy đa số bước để v=0 (chưa xác minh). Không ghi mật khẩu/SSID mặc định vì chưa xác minh. Vòng 2: mọi tên miền không chính thức đều bị chặn khi WebFetch, chỉ dùng đoạn trích tìm kiếm (da_doc=false); không tìm thấy nguồn tiếng Việt cụ thể hay thông tin Grid Code Việt Nam. Vòng 3: chưa tìm được tiết diện cáp AC, mô-men siết, điện áp DC tối đa và các mã cảnh báo ngoài 2062; để 'tuỳ model, xem sách'."
 },
 {
  "id": "goodwe",
  "name": "GoodWe",
  "color": "#0072BC",
  "badge": "GW",
  "app": "PV Master (cấu hình tại chỗ qua Bluetooth/WiFi), SolarGo (dòng mới), SEMS Portal (app/web giám sát: semsportal.com); cấu hình WiFi/mạng cho module giám sát qua trình duyệt tại http://10.10.100.253",
  "types": {
   "grid": {
    "model": "DNS (G3), MS (G3), SMT hòa lưới; dòng thương mại GW73–136K-HT (HT/LV-HT; chi tiết lấy từ sách V1.7)",
    "steps": [
     [
      "Đọc sách đúng model (DNS G3, MS G3, SMT hoặc dòng thương mại GW73–136K-HT) và chỉ để kỹ thuật viên có chuyên môn thực hiện. Các bước chi tiết bên dưới lấy từ sách <b>GW73–136K-HT V1.7</b>; với DNS/MS/SMT thì số liệu có thể khác, xem sách model.",
      0
     ],
     [
      "<b>Tính chuỗi PV:</b> điện áp hở mạch (Voc ở nhiệt độ thấp nhất) mỗi MPPT không quá <b>1100V</b> (GW73KLV-HT: không quá <b>800V</b>); Vmp nằm trong dải 500~850V để đạt công suất danh định; dòng mỗi MPPT không quá 30A. Hai MPPT chênh áp nhau dưới 150V, các chuỗi cùng một MPPT có cùng số tấm giống nhau.",
      1
     ],
     [
      "<b>Vị trí lắp:</b> nơi thoáng, có mái che tránh nắng/mưa, xa tầm với trẻ em, không gần vật dễ cháy nổ hay ăn mòn. Lắp thẳng đứng hoặc ngả ra sau tối đa 25 độ, không lắp úp, ngả trước hay nằm ngang (cấp bảo vệ IP66).",
      1
     ],
     [
      "<b>Gắn bát và biến tần:</b> đặt bát lên tường/khung, đánh dấu và khoan lỗ mũi Ø13mm sâu 65mm, bắt bát chắc rồi nhấc biến tần (dùng tay xách/móc cẩu, đủ người) lên bát và siết ốc cố định. Cổng đáy biến tần không chịu được lực kéo nặng.",
      1
     ],
     [
      "<b>Nối tiếp địa (PE):</b> bắt cáp PE vào điểm nối đất vỏ bằng cốt OT M8 (tự chuẩn bị), siết <b>7~9 N·m</b>, tiết diện S_PE ≥ S/2 (S là tiết diện dây pha). PE vỏ không thay được PE ở cổng AC, cả hai phải đấu; nhiều biến tần thì các điểm tiếp địa phải đẳng thế.",
      1
     ],
     [
      "<b>Ngắt hết nguồn:</b> tắt <b>CB AC</b> và các <b>công tắc DC</b> của biến tần trước khi đấu bất kỳ dây nào. Không làm việc khi còn điện.",
      1
     ],
     [
      "<b>Chọn dây AC:</b> dây đồng nhiều lõi tiết diện 70~240mm² (đường kính ngoài 22~67mm) hoặc dây nhôm/nhôm bọc đồng 95~240mm²; dây một lõi đường kính ngoài 11~35mm. Nên dùng dây đồng; dùng nhôm thì phải có cốt chuyển đồng-nhôm. Xem bảng tiết diện/mô-men.",
      1
     ],
     [
      "<b>Chọn CB AC và RCD:</b> mỗi biến tần một CB AC riêng, không dùng chung: 75/80/100K → 200A; 110K, 73KLV, 120K → 250A; 136K → 225A (ít nhất 1,25 lần dòng ra tối đa). Không đấu tải vào giữa biến tần và CB của nó. RCD nếu dùng thì loại A, ngưỡng tối thiểu theo model (bảng).",
      1
     ],
     [
      "<b>Đấu cáp AC:</b> tháo nắp hộp AC, cắt gioăng cao su đúng cỡ dây, bấm cốt OT M12, bắt vào L1, L2, L3, N, PE đúng chữ in. Siết cốt AC <b>25~30 N·m</b>, PE <b>7~9 N·m</b>, cắm ngập hết lõi dây, chừa PE dài hơn dây pha để PE chịu lực sau cùng, rồi bịt kín lại.",
      1
     ],
     [
      "<b>Làm đầu DC:</b> dùng cáp PV 4~6mm² đạt chuẩn 1100V và đúng đầu nối MC4 (hoặc Vaconn/QC4.10) kèm theo máy, tuốt 7–8mm rồi bấm cốt. Dùng đầu nối khác có thể mất bảo hành. Chuỗi PV không được nối đất.",
      1
     ],
     [
      "<b>Đo trước khi cắm:</b> dùng đồng hồ đo điện áp DC và <b>cực tính</b> từng chuỗi; cực + của chuỗi vào PV+, cực - vào PV-. Điện áp chuỗi phải nhỏ hơn giới hạn của model, đo cách điện chuỗi với đất đạt yêu cầu.",
      1
     ],
     [
      "<b>Cắm đầu PV vào cổng MPPT:</b> mỗi chuỗi một cổng, không nối một chuỗi vào nhiều biến tần; cắm tới khi nghe tiếng tách (click). Bịt nắp chống nước các cổng PV không dùng để giữ cấp IP.",
      1
     ],
     [
      "<b>Đấu truyền thông (tuỳ chọn):</b> RS485 cổng <b>COM2</b> nối biến tần khác/EzLogger Pro/SEC1000, cổng <b>COM4</b> (nếu có) nối đồng hồ thông minh cho chức năng giới hạn công suất. Dùng cáp xoắn đôi có bọc chống nhiễu, đầu 6 chân siết 0.3~0.4 N·m, đi tách khỏi cáp lực. Cắm module WiFi/4G vào cổng Communication Port.",
      1
     ],
     [
      "<b>Cổng COM3 (tuỳ chọn):</b> dùng cho Remote Shutdown (DI+/DI-) hoặc DRED (DRM, chuẩn Úc). Cổng có dây nối tắt sẵn: tháo dây nối tắt khi bật Remote Shutdown, lắp lại vào chân 2 và 5 khi tắt chức năng này.",
      1
     ],
     [
      "<b>Kiểm tra trước khi bật:</b> máy lắp chắc nơi thoáng; PE, DC, AC, truyền thông đấu đúng và chắc; dây gọn không gờ; cổng không dùng đã bịt; điện áp, tần số điểm đấu nối đạt yêu cầu hòa lưới.",
      1
     ],
     [
      "<b>Bật nguồn theo thứ tự (sách GoodWe):</b> bước 1 đóng <b>CB AC</b> giữa biến tần và lưới; bước 2 bật <b>công tắc DC</b> của biến tần. Tắt máy thì ngược lại: lệnh dừng hòa lưới từ SolarGo → tắt CB AC → tắt công tắc DC, chờ 5 phút cho xả tụ.",
      1
     ],
     [
      "<b>Đèn LED:</b> đèn không dây sáng liên tục là đã kết nối; nháy 1 lần là module đang khởi động lại; <b>nháy 2 lần là chưa kết nối được router</b>; <b>nháy 4 lần là lỗi máy chủ</b>; nháy là RS485 đang kết nối. Đèn \"đang hòa lưới\" nháy chậm một nhịp là tự kiểm tra trước khi hòa lưới, nháy một nhịp là đang hòa lưới.",
      1
     ],
     [
      "<b>Kết nối SolarGo tại chỗ:</b> bật định vị, WiFi, Bluetooth trên điện thoại, mở SolarGo và chọn \"WiFi&Bluetooth\". Bluetooth tên <b>SOL-BLE********</b>, WiFi tên <b>SOL-WiFi********</b> (* là 8 số cuối serial). Mật khẩu đăng nhập app lần đầu theo tài liệu GoodWe là <b>1234</b>, mật khẩu WiFi AP ban đầu <b>12345678</b>; đổi ngay sau khi cài.",
      1
     ],
     [
      "<b>Chọn Grid Code:</b> SolarGo → Local Configuration → chọn Grid Code <b>Vietnam</b> hoặc <b>Other 50Hz</b> (tuỳ phiên bản app). Trên máy có LCD cũng chọn được ở mục \"50Hz Grid Default\" (nhấn giữ 2 giây). Chọn sai tiêu chuẩn lưới có thể khiến cắt lưới hoặc không đạt yêu cầu đấu nối; không chắc thì hỏi nhà phân phối.",
      1
     ],
     [
      "<b>Cấu hình WiFi bằng SEMS Portal:</b> cắm cục Wi-Fi Kit, đèn Power sáng, vào app SEMS Portal → <b>Configuration → Wi-Fi Configuration</b>; quét mã QR trên cục WiFi hoặc nối vào WiFi <b>Solar-WiFi</b>, chọn WiFi nhà, nhập mật khẩu rồi bấm Apply/Connect.",
      1
     ],
     [
      "<b>Cấu hình WiFi bằng trình duyệt:</b> nối điện thoại/laptop vào WiFi AP của module, tắt dữ liệu di động, mở trình duyệt vào <b>http://10.10.100.253</b>, chọn Start Setup, chọn router, nhập mật khẩu rồi Complete (module khởi động lại). Theo tài liệu bên thứ ba, đăng nhập mặc định là admin/admin (tuỳ firmware), nên đổi sau khi cài. Rồi thêm trạm trên SEMS Portal bằng số serial, đặt tên trạm.",
      1
     ],
     [
      "<b>Đặt thông số qua LCD (nếu có):</b> nhấn ngắn để chuyển mục, nhấn giữ 2 giây để vào/lưu, nhấn ngắn để đổi số. Màn hình tối và quay về trang đầu là thông số đã lưu. Các mục có trong sơ đồ menu sách gồm Set Language, Set time, W/L restart, W/L reload, Power factor adjustment, Power limit ON/OFF, Shadow mode, Set Modbus address, LVRT ON/OFF, Grid type, Arc discharge set. Mật khẩu ban đầu vào mục cài đặt theo sách là <b>1111</b>, nhấn giữ 6 giây để đổi mật khẩu.",
      1
     ],
     [
      "<b>Giới hạn công suất xuất lưới (nếu cần), đấu thiết bị đo:</b> 1 pha (DNS/XS/MS/NS) dùng <b>CT90</b> (tải dưới 90A); 3 pha (SDT G2, SMT, MT) dùng <b>GM3000</b>/<b>HK3000</b> (tải mỗi pha dưới 120A), chỉ cho <b>một</b> biến tần. Nhiều biến tần hoặc tải lớn: <b>GM3000C + EzLogger Pro</b> hoặc <b>SEC1000</b> với CT ngoài nA/5A (n 200–5000, sai số ≤1%, dây thứ cấp 1.5mm²). Dòng HT dùng GM3000C hoặc SEC1000, đồng hồ cắm cổng COM4.",
      1
     ],
     [
      "<b>Đặt giới hạn công suất:</b> SolarGo → <b>Home → More → Advanced Setting → Power Limit Settings</b>, bật Export/Power Limit, chọn Mode, nhập Export Power (công suất thực tế được phép đẩy lên lưới), nhập External CT Ratio nếu dùng CT ngoài, rồi bấm dấu √. Bật \"Export Power Limit Protection\" nếu muốn biến tần ngừng hòa lưới khi giới hạn thất bại. Hệ SEC1000/EzLogger đặt qua phần mềm ProMate (Total Capacity, Power Limit, Ratio of CT, rồi Export Enab).",
      1
     ],
     [
      "<b>Kiểm tra vận hành:</b> biến tần hòa lưới, công suất và điện áp lưới ổn định, không có mã lỗi, dữ liệu lên SEMS Portal. Báo mất lưới thì kiểm tra có điện AC, CB và L/N/PE; báo ISO thì nối lại từng chuỗi để tìm chuỗi gây rò, kiểm tra tiếp địa. Nếu SEMS offline: đèn nháy 2 lần là chưa vào router, nháy 4 lần là lỗi máy chủ; cấu hình lại qua 10.10.100.253 hoặc khởi động lại biến tần.",
      1
     ]
    ],
    "tips": [
     "Làm theo đúng sách hướng dẫn của model và quy định điện lực địa phương; ngắt AC/DC và chờ xả tụ trước khi mở nắp.",
     "Chọn sai Safety Country là lỗi hay gặp, dẫn đến cắt lưới hoặc không đạt yêu cầu đấu nối.",
     "Theo diễn đàn người dùng, lỗi mất lưới có lúc do dây trung tính tại tủ điện bị lỏng; siết lại đầu nối trước khi nghi ngờ biến tần.",
     "<b>CT giới hạn công suất:</b> kẹp CT trên dây pha (L, hoặc L1/L2/L3), <b>không kẹp vào dây N</b>, gần điểm đấu nối lưới, đúng chiều mũi tên (\"-->\" hướng từ biến tần ra lưới). Lắp ngược thì biến tần báo lỗi và không giới hạn được. Lỗ CT phải lớn hơn đường kính ngoài dây AC.",
     "Quy trình trong tài liệu GoodWe mà bạn gửi: vào app SEMS Portal → <b>Configuration → Wi-Fi Configuration</b>, quét mã QR trên cục WiFi hoặc nối vào WiFi <b>Solar-WiFi</b>, chọn WiFi nhà rồi Apply; chọn <b>Grid Code</b> qua SolarGo (Vietnam hoặc Other 50Hz tuỳ phiên bản app, xem sách model).",
     "Sách HT nhấn mạnh: không đấu tải vào giữa biến tần và CB AC; mỗi biến tần một CB AC riêng.",
     "Muốn giữ cấp IP66 phải bịt kín mọi cổng PV, cổng AC và cổng truyền thông không dùng.",
     "Chờ ít nhất 5 phút sau khi ngắt nguồn mới mở nắp (tụ xả chậm, nhãn cảnh báo trên máy).",
     "Mật khẩu/địa chỉ mặc định lấy từ tài liệu GoodWe hoặc bên thứ ba có thể khác theo firmware; luôn đổi sau khi cài."
    ],
    "tables": [
     {
      "t": "Giới hạn DC theo model (sách HT V1.7)",
      "c": [
       "Model",
       "Điện áp DC tối đa (V)",
       "Dải MPPT (V)",
       "Số MPPT / dòng tối đa mỗi MPPT"
      ],
      "r": [
       [
        "GW73KLV-HT",
        "800",
        "180~650",
        "12 / 30A"
       ],
       [
        "GW75K-HT",
        "1100",
        "180~1000",
        "10 / 30A"
       ],
       [
        "GW80K-HT",
        "1100",
        "180~1000",
        "10 / 30A"
       ],
       [
        "GW100K-HT",
        "1100",
        "180~1000",
        "10 / 30A"
       ],
       [
        "GW110K-HT",
        "1100",
        "180~1000",
        "12 / 30A"
       ],
       [
        "GW120K-HT",
        "1100",
        "180~1000",
        "12 / 30A"
       ],
       [
        "GW136K-HTH",
        "1100",
        "180~1000",
        "12 / 30A"
       ]
      ]
     },
     {
      "t": "CB AC, RCD và dòng ra tối đa theo model",
      "c": [
       "Model",
       "CB AC khuyến nghị",
       "RCD loại A tối thiểu",
       "Dòng ra tối đa (A)"
      ],
      "r": [
       [
        "GW73KLV-HT",
        "250A",
        "730mA",
        "192.0"
       ],
       [
        "GW75K-HT",
        "200A",
        "750mA",
        "125.3"
       ],
       [
        "GW80K-HT",
        "200A",
        "800mA",
        "134.0"
       ],
       [
        "GW100K-HT",
        "200A",
        "1000mA",
        "167.0"
       ],
       [
        "GW110K-HT",
        "250A",
        "1100mA",
        "175.5"
       ],
       [
        "GW120K-HT",
        "250A",
        "1200mA",
        "191.3"
       ],
       [
        "GW136K-HTH",
        "225A",
        "1360mA",
        "173.2"
       ]
      ]
     },
     {
      "t": "Dây và mô-men siết (dòng HT)",
      "c": [
       "Hạng mục",
       "Thông số",
       "Mô-men siết"
      ],
      "r": [
       [
        "Cáp DC (PV)",
        "4~6mm², MC4",
        "-"
       ],
       [
        "AC đồng",
        "70~240mm²",
        "-"
       ],
       [
        "AC nhôm/nhôm bọc đồng",
        "95~240mm²",
        "-"
       ],
       [
        "PE",
        "S_PE ≥ S/2, cốt M8",
        "7~9 N·m"
       ],
       [
        "Cốt AC L1/L2/L3/N",
        "cốt OT M12",
        "25~30 N·m"
       ],
       [
        "Đầu 6 chân RS485/COM3",
        "cáp xoắn đôi có bọc",
        "0.3~0.4 N·m"
       ],
       [
        "Nắp bảo vệ PV (tuỳ chọn)",
        "bắt tường M12",
        "30 N·m"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "ISO Fail",
      "m": "Điện trở cách điện chuỗi PV với đất thấp (chạm đất, ẩm ướt, cách điện kém).",
      "x": "Kiểm tra dây PV có đứt/hở vỏ không; khung tấm và giá đỡ có tiếp địa tốt không; phía AC có tiếp địa đúng không. Tách từng chuỗi để tìm chuỗi gây rò; trời ẩm có thể tự hết.",
      "v": 1
     },
     {
      "c": "Vac Failure",
      "m": "Điện áp lưới ngoài dải cho phép.",
      "x": "Kiểm tra điện áp lưới trong dải; kiểm tra thứ tự pha và dây trung tính, PE đấu đúng, chắc.",
      "v": 1
     },
     {
      "c": "Fac Fail",
      "m": "Tần số/độ biến thiên tần số lưới không đạt chuẩn.",
      "x": "Thỉnh thoảng thì chờ tự phục hồi; thường xuyên thì kiểm tra tần số lưới, ngoài dải thì báo điện lực, trong dải thì báo đại lý/hãng.",
      "v": 1
     },
     {
      "c": "Utility Loss",
      "m": "Mất lưới, dây AC bị ngắt hoặc CB AC đang tắt.",
      "x": "Tự hết khi có điện lại; kiểm tra dây AC đã nối và CB AC đã bật.",
      "v": 1
     },
     {
      "c": "PV Over Voltage",
      "m": "Quá nhiều tấm nối tiếp, Voc vượt giới hạn điện áp vào.",
      "x": "So điện áp chuỗi với giá trị hiển thị trên LCD và với điện áp DC tối đa của model; giảm số tấm trong chuỗi nếu vượt.",
      "v": 1
     },
     {
      "c": "Pv Reverse Fault",
      "m": "Chuỗi PV đấu ngược cực.",
      "x": "Kiểm tra lại cực + và - của từng chuỗi, đấu lại đúng.",
      "v": 1
     },
     {
      "c": "PV Voltage Low",
      "m": "Nắng yếu hoặc điện áp PV thay đổi bất thường.",
      "x": "Thỉnh thoảng thì máy tự phục hồi; thường xuyên thì liên hệ đại lý/hãng.",
      "v": 1
     },
     {
      "c": "Over Temperature",
      "m": "Thông gió kém, nhiệt độ môi trường vượt 60 độ C hoặc quạt trong lỗi.",
      "x": "Kiểm tra thông gió và nhiệt độ nơi lắp, cải thiện tản nhiệt; vẫn lỗi thì liên hệ đại lý/hãng.",
      "v": 1
     },
     {
      "c": "AFCI Fault",
      "m": "Đầu nối chuỗi DC lỏng hoặc dây DC đứt (hồ quang), áp dụng máy có AFCI.",
      "x": "Kiểm tra lại đấu nối các chuỗi PV, siết/thay đầu nối; trong menu LCD có mục Arc discharge set (xoá lỗi, tự kiểm tra, bật/tắt).",
      "v": 1
     },
     {
      "c": "GFCI Chk Fail / SPD Failure",
      "m": "Lấy mẫu GFCI HCT bất thường; SPD Failure/DC-SPD thường do sét đánh.",
      "x": "Ngắt CB AC và công tắc DC, bật lại sau 5 phút; cải thiện chống sét quanh biến tần; vẫn lỗi thì liên hệ đại lý/hãng.",
      "v": 1
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Biến tần lắp chắc, đúng tư thế (thẳng đứng hoặc ngả sau tối đa 25 độ), nơi thoáng, sạch.",
      "PE vỏ và PE cổng AC đấu đủ, siết đúng mô-men (PE 7~9 N·m, AC M12 25~30 N·m).",
      "Đo mỗi chuỗi PV: đúng cực tính, Voc không vượt 1100V (73KLV: 800V), điện áp 2 MPPT chênh dưới 150V, chuỗi không chạm đất.",
      "Mỗi biến tần một CB AC riêng đúng cỡ theo bảng, không đấu tải giữa biến tần và CB AC.",
      "Cổng PV/COM không dùng đã bịt; dây gọn, không gờ sắc; CT/đồng hồ (nếu có) đúng chiều trên dây pha, không kẹp dây N.",
      "Điện áp và tần số tại điểm đấu nối đạt yêu cầu hòa lưới; CB AC và công tắc DC đang tắt."
     ],
     "sau_khi_bat": [
      "Bật theo thứ tự: CB AC trước, công tắc DC sau; quan sát đèn tự kiểm tra rồi chuyển sang hòa lưới.",
      "Đèn lỗi tắt, không có mã lỗi; đèn \"đang hòa lưới\" sáng.",
      "Chọn đúng Grid Code (Vietnam hoặc Other 50Hz) trong SolarGo hoặc LCD.",
      "Đèn WiFi sáng liên tục; dữ liệu và trạm hiện trên SEMS Portal.",
      "Đo/đối chiếu điện áp, tần số lưới và công suất ra ổn định; điện áp từng MPPT đúng với tính toán.",
      "Nếu có giới hạn xuất lưới: bật Power Limit, thử tải thấp và xác nhận công suất xuất lưới không vượt giá trị đặt (CT không báo lỗi chiều)."
     ],
     "ban_giao": [
      "Đổi mật khẩu SolarGo/WiFi AP/SEMS và mật khẩu LCD (mặc định 1111), ghi lại cho chủ đầu tư.",
      "Lưu serial, phiên bản phần mềm, Grid Code đã chọn, giá trị Power Limit và tỉ số CT.",
      "Hướng dẫn chủ nhà quy trình tắt máy: lệnh dừng hòa lưới → CB AC → công tắc DC → chờ 5 phút.",
      "Giao lịch bảo trì theo sách: vệ sinh 6–12 tháng, kiểm tra quạt và bật/tắt công tắc DC 10 lần mỗi năm, kiểm tra đấu nối 6–12 tháng, kiểm tra gioăng bịt kín mỗi năm.",
      "Khi báo hỏng, thu thập serial, phiên bản phần mềm, ngày lắp, thời điểm lỗi, ảnh hiện trường trước khi gọi bảo hành."
     ]
    }
   },
   "hybrid": {
    "model": "ET (G2, Plus+), EH, EM; đo bằng đồng hồ thông minh/CT",
    "steps": [
     [
      "Xác nhận model (ví dụ ET G2 GW6000-GW15K-ET-20) và pin tương thích trong danh sách của GoodWe. Kiểm tra điện áp DC tối đa, <b>Voc ở nhiệt độ thấp</b>, dòng MPPT và dải điện áp pin theo sách đúng model; chưa có sách ET/EH/EM trong tài liệu đã đọc nên số liệu cụ thể xem sách.",
      0
     ],
     [
      "Lắp biến tần nơi thoáng, chắc, theo khoảng cách và tư thế trong sách model, rồi đấu <b>tiếp địa</b> vỏ. Nguyên tắc chung giống dòng HT: PE vỏ không thay PE của cổng AC.",
      0
     ],
     [
      "Cổng BACK-UP (EPS) chỉ cấp cho tải thiết yếu, tách riêng khỏi tải thường; không nối trung tính/tải sai giữa cổng lưới và cổng backup. Theo chính sách GoodWe, không dùng backup khi hệ thống không có pin.",
      1
     ],
     [
      "Đấu cáp pin đúng cực tính, có CB/cầu chì DC cho pin theo sách pin. Pin có điện áp cao và luôn có điện kể cả khi biến tần tắt.",
      1
     ],
     [
      "Đấu cáp giao tiếp BMS (thường <b>CAN</b> hoặc RS485) theo tài liệu pin. Sách GoodWe tham chiếu sổ tay của pin cho các thao tác pin.",
      1
     ],
     [
      "Đấu đồng hồ thông minh/CT đo công suất lưới đúng chiều và đúng vị trí gần điểm đấu lưới, kẹp trên dây pha, không kẹp dây N (nguyên tắc từ tài liệu giới hạn công suất GoodWe, chân đấu cụ thể xem sách model).",
      1
     ],
     [
      "Đấu AC lưới và đầu ra backup. Quy ước cổng, dây N/PE và CB AC tuỳ model, xem sách.",
      0
     ],
     [
      "Thứ tự đóng nguồn: thường đóng AC, pin rồi DC; thứ tự đúng xem sách model (với dòng HT hòa lưới thì CB AC trước rồi công tắc DC).",
      0
     ],
     [
      "Bật nguồn, kết nối PV Master/SolarGo, chọn <b>Safety Country</b> (Grid Code, Vietnam hoặc Other 50Hz tuỳ app) trong cài đặt cơ bản.",
      1
     ],
     [
      "Chọn <b>loại pin</b> (Battery Type) trong cài đặt cơ bản; PV Master có mục chọn Work Mode và Battery Type.",
      1
     ],
     [
      "Cài giới hạn sạc/xả, <b>DoD / SOC tối thiểu</b> theo khuyến cáo nhà sản xuất pin. Trong PV Master có các chế độ làm việc như General và Off-grid (theo người dùng diễn đàn, dòng ES; tên mục tuỳ model/firmware); có DoD riêng cho chế độ off-grid, nên kiểm tra lại giá trị đã lưu.",
      1
     ],
     [
      "Cấu hình WiFi: nối vào WiFi AP của module (<b>Solar-WiFi</b> / SOL-WiFi********), mở <b>http://10.10.100.253</b> trên trình duyệt để chọn router và nhập mật khẩu; hoặc dùng SEMS Portal → Configuration → Wi-Fi Configuration. Sau đó thêm trạm trên SEMS Portal; module mới cần firmware phù hợp.",
      1
     ],
     [
      "Cấu hình giới hạn xuất lưới (zero export) nếu điện lực yêu cầu: dùng đồng hồ thông minh GoodWe (ví dụ GM3000C, HomeKit) qua RS485/CT, vào SolarGo → Home → More → Advanced Setting → Power Limit Settings (tên mục tuỳ model/phiên bản app), nhập Export Power và tỉ số CT. Theo mô tả nhà phân phối và tài liệu GoodWe, tuỳ model.",
      1
     ],
     [
      "Thử vận hành: kiểm tra sạc/xả pin, thử mất lưới để xác nhận chuyển sang backup (GoodWe quảng cáo dưới 10 ms), dữ liệu lên SEMS Portal. Lỗi thường gặp: mất giao tiếp BMS, sai cực CT/đồng hồ, sai Battery Type; nhiều trường hợp mất lưới thực chất do đấu nối trung tính lỏng.",
      0
     ],
     [
      "Tính công suất tải backup không vượt khả năng backup tối đa của model; theo chính sách GoodWe nên tránh tải có dòng khởi động rất lớn như điều hòa không inverter hoặc bơm công suất cao.",
      1
     ],
     [
      "Về trung tính/tiếp địa phía backup: theo một bài diễn đàn (Nam Phi, dòng ES cũ), đại diện GoodWe cho biết ES không có rơ-le nối trung tính-đất ở đầu ra backup nên trung tính có thể nổi khi mất lưới. Cách xử lý phụ thuộc quy chuẩn địa phương và model; xem sách và hỏi đơn vị có thẩm quyền.",
      1
     ]
    ],
    "tips": [
     "Pin có điện áp cao và luôn có điện kể cả khi biến tần tắt; chỉ làm theo sách pin và biến tần đúng model.",
     "Sai cực tính hoặc chiều CT/đồng hồ làm công suất lưới đo sai, gây sạc xả và zero export sai.",
     "Tải backup: tránh tải khởi động lớn và không vượt công suất backup (theo chính sách GoodWe)."
    ],
    "tables": [
     {
      "t": "Cổng kết nối giám sát và đặt cấu hình (GoodWe chung)",
      "c": [
       "Hạng mục",
       "Giá trị",
       "Ghi chú"
      ],
      "r": [
       [
        "Địa chỉ cấu hình WiFi",
        "http://10.10.100.253",
        "Trình duyệt, khi nối AP của module"
       ],
       [
        "Tên WiFi AP",
        "Solar-WiFi / SOL-WiFi********",
        "* là 8 số cuối serial"
       ],
       [
        "Tên Bluetooth",
        "SOL-BLE********",
        "SolarGo"
       ],
       [
        "Mật khẩu AP ban đầu",
        "12345678",
        "Tài liệu GoodWe, đổi sau khi cài"
       ],
       [
        "Mật khẩu đăng nhập app ban đầu",
        "1234",
        "BT/WiFi, tài liệu GoodWe"
       ],
       [
        "Đường dẫn Power Limit",
        "Home > More > Advanced Setting > Power Limit Settings",
        "SolarGo, tuỳ phiên bản"
       ]
      ]
     },
     {
      "t": "Thiết bị đo giới hạn công suất",
      "c": [
       "Thiết bị",
       "Dòng áp dụng",
       "Số biến tần"
      ],
      "r": [
       [
        "CT90",
        "DNS, XS, MS, NS (1 pha, tải dưới 90A)",
        "1"
       ],
       [
        "GM3000",
        "SDT G2, SMT, MT (3 pha, dưới 120A/pha)",
        "1"
       ],
       [
        "HK3000",
        "SDT G2, SMT (3 pha, dưới 120A/pha)",
        "1"
       ],
       [
        "GM3000C + EzLogger Pro",
        "SDT G2, SMT, MT, HT 1100V",
        "Nhiều"
       ],
       [
        "SEC1000",
        "SDT G2, SMT, MT, HT 1100V",
        "Nhiều"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "Mất giao tiếp BMS / pin",
      "m": "Biến tần không nhận được dữ liệu từ BMS của pin (cáp CAN/RS485 hỏng, sai pin hoặc sai Battery Type).",
      "x": "Kiểm tra cáp BMS và đầu nối, chọn đúng Battery Type, dùng pin trong danh sách GoodWe; mã hiển thị tuỳ model/firmware, xem sách.",
      "v": 0
     },
     {
      "c": "Sai cực/chiều CT hoặc đồng hồ",
      "m": "Công suất lưới đo sai, gây sạc xả và zero export sai, biến tần báo lỗi CT.",
      "x": "Kẹp lại CT đúng chiều (mũi tên hướng ra lưới) trên dây pha, không kẹp dây N; kiểm tra tỉ số CT trong SolarGo.",
      "v": 1
     },
     {
      "c": "Mất lưới / chuyển backup",
      "m": "Báo mất lưới, nhiều trường hợp do trung tính lỏng hoặc CB lưới tắt.",
      "x": "Kiểm tra có điện AC, CB và đấu L/N/PE, siết lại trung tính tại tủ điện; mã lỗi cụ thể tuỳ model.",
      "v": 1
     },
     {
      "c": "Lỗi cách điện (ISO)",
      "m": "Rò điện chuỗi PV xuống đất.",
      "x": "Nối lại từng chuỗi PV để tìm chuỗi gây rò, kiểm tra tiếp địa và dây (theo FAQ GoodWe); mã hiển thị tuỳ model.",
      "v": 1
     },
     {
      "c": "Offline SEMS (đèn WiFi nháy 2 hoặc 4 lần)",
      "m": "Nháy 2 lần là chưa vào được router, nháy 4 lần là lỗi máy chủ.",
      "x": "Cấu hình lại WiFi qua 10.10.100.253 hoặc SEMS Portal, hoặc khởi động lại; lặp lại nhiều lần thì liên hệ hỗ trợ GoodWe.",
      "v": 1
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Đúng model và pin nằm trong danh sách tương thích GoodWe; có sách của cả biến tần và pin.",
      "PE vỏ đấu chắc; cực tính pin và chuỗi PV đúng (đo trước khi cắm).",
      "Cáp BMS (CAN/RS485) đấu đúng cổng, đồng hồ/CT đúng chiều và đúng vị trí trên dây pha.",
      "Cổng BACK-UP chỉ cấp tải thiết yếu, không nối chung với tải thường; dây trung tính/PE đấu đúng quy chuẩn.",
      "CB AC lưới, CB backup và cầu dao pin đúng cỡ theo sách model; tất cả đang tắt khi đấu dây."
     ],
     "sau_khi_bat": [
      "Bật theo thứ tự trong sách model (lưu ý: sách HT hòa lưới là CB AC trước, DC sau).",
      "Vào SolarGo/PV Master chọn Safety Country, Battery Type, Work Mode và DoD.",
      "Kiểm tra pin sạc/xả đúng chiều, SOC và điện áp pin hiển thị đúng.",
      "Công suất lưới trên đồng hồ khớp thực tế; zero export (nếu bật) hoạt động đúng.",
      "Thử mất lưới: tải backup tiếp tục có điện, rồi trở lại lưới bình thường.",
      "Dữ liệu và trạm hiện trên SEMS Portal."
     ],
     "ban_giao": [
      "Đổi mật khẩu SolarGo/WiFi AP/SEMS, ghi lại cho chủ đầu tư.",
      "Ghi lại model, serial, loại pin, DoD, Work Mode, Grid Code, tỉ số CT và giá trị Power Limit.",
      "Giải thích danh sách tải backup và giới hạn công suất backup tối đa; tránh tải khởi động lớn.",
      "Hướng dẫn cách tắt hệ thống an toàn (pin vẫn có điện khi biến tần tắt).",
      "Giao sách biến tần và sách pin, thông tin hỗ trợ GoodWe."
     ]
    }
   },
   "offgrid": {
    "model": "Dùng hybrid GoodWe (ES, EM, ET/EH) ở chế độ Off-grid/backup; không có dòng off-grid thuần trong tài liệu đã đọc",
    "steps": [
     [
      "Xác định model: sách ES nêu có chế độ <b>Off-grid</b> (PV và pin tạo hệ thống độc lập, phù hợp nơi không có lưới); ET 25-50 kW quảng cáo dùng được cả on-grid và off-grid, kèm STS Box khi cần UPS/máy phát. Kiểm tra sách đúng model xem có hỗ trợ không.",
      1
     ],
     [
      "Tính tải: tổng công suất tải và dòng khởi động không vượt công suất backup của model; tránh tải khởi động lớn như điều hòa không inverter, bơm lớn (theo chính sách GoodWe).",
      1
     ],
     [
      "Tính dung lượng pin đủ cho thời gian cần cấp điện ban đêm, có dự phòng theo DoD khuyến cáo của nhà sản xuất pin.",
      1
     ],
     [
      "Chọn pin trong danh sách tương thích GoodWe (có BMS giao tiếp được với biến tần). Pin không tương thích có thể không chạy được chế độ off-grid.",
      1
     ],
     [
      "Lắp biến tần, đấu <b>tiếp địa</b> vỏ theo sách model; đấu PV đúng cực tính, Voc trong giới hạn model.",
      0
     ],
     [
      "Đấu pin (cực tính đúng) và cáp BMS CAN/RS485 theo sách pin và sách biến tần.",
      1
     ],
     [
      "Đấu tải vào cổng BACK-UP. Nếu không có lưới, chưa thấy tài liệu xác nhận cách đấu cổng lưới; xem sách model.",
      0
     ],
     [
      "Phần trung tính/tiếp địa của nguồn độc lập: đầu ra backup ES cũ không có rơ-le nối N-PE theo một bài diễn đàn. Làm theo sách model và quy chuẩn địa phương; chưa có hướng dẫn cụ thể cho Việt Nam.",
      0
     ],
     [
      "Bật nguồn theo thứ tự trong sách model, kết nối PV Master/SolarGo. Menu và tên mục tuỳ model/firmware.",
      0
     ],
     [
      "Trong PV Master chọn <b>Battery Type</b> và đặt <b>Work Mode</b> sang Off-grid (theo người dùng diễn đàn, dòng ES: đổi từ General sang Off-grid trong Basic Settings đã khắc phục lỗi trip khi mất điện). Đặt DoD cho chế độ off-grid và kiểm tra giá trị có được lưu.",
      1
     ],
     [
      "Cấu hình giám sát qua <b>10.10.100.253</b> hoặc SEMS Portal → Configuration → Wi-Fi Configuration; đổi mật khẩu mặc định sau khi cài.",
      1
     ],
     [
      "Thử vận hành: kiểm tra pin sạc từ PV, tải chạy ổn định, theo dõi SOC cuối đêm; dùng liên tục ở off-grid có thể giảm tuổi thọ pin (cảnh báo trong sách ES). Cần máy phát thì xem STS Box/cổng máy phát theo sách model.",
      0
     ]
    ],
    "tips": [
     "Dòng ES Uniq và một dòng off-grid một pha mới của GoodWe được tin tức nhắc đến; chưa đọc tài liệu kỹ thuật nên chưa đưa thành bước.",
     "Hệ off-grid cần pin có BMS tương thích; chỉ dùng pin trong danh sách GoodWe."
    ],
    "tables": [
     {
      "t": "Điểm cần xác nhận cho hệ độc lập GoodWe",
      "c": [
       "Hạng mục",
       "Thông tin có nguồn",
       "Ghi chú"
      ],
      "r": [
       [
        "Chế độ",
        "Off-grid trong PV Master (dòng ES)",
        "Tên mục tuỳ model/firmware"
       ],
       [
        "DoD off-grid",
        "Có DoD riêng cho off-grid",
        "Theo khuyến cáo nhà sản xuất pin"
       ],
       [
        "Tải backup",
        "Không vượt công suất backup của model",
        "Tránh điều hòa không inverter, bơm lớn"
       ],
       [
        "Máy phát/UPS",
        "STS Box (ET 25-50kW)",
        "Xem sách model"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "Trip khi mất điện / không giữ tải",
      "m": "Một người dùng ES báo backup bị trip, khắc phục bằng đổi Work Mode từ General sang Off-grid.",
      "x": "Kiểm tra Work Mode và DoD off-grid đã lưu; mã cụ thể tuỳ model/firmware.",
      "v": 0
     },
     {
      "c": "Mất giao tiếp BMS / pin",
      "m": "Biến tần không nhận BMS, pin không được xả cho tải.",
      "x": "Kiểm tra cáp CAN/RS485, Battery Type, dùng pin trong danh sách; xem sách.",
      "v": 0
     },
     {
      "c": "Quá tải backup",
      "m": "Tải hoặc dòng khởi động vượt khả năng backup.",
      "x": "Giảm tải, tránh tải khởi động lớn; xem công suất backup của model.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Đúng model hỗ trợ Off-grid; có sách model và sách pin.",
      "Tổng tải và dòng khởi động đã tính, không vượt công suất backup; dung lượng pin đủ cho ban đêm.",
      "Pin tương thích GoodWe, cực tính và cáp BMS đúng; PV đo cực tính và Voc.",
      "PE đấu đủ; trung tính/tiếp địa phía backup làm theo sách và quy chuẩn địa phương."
     ],
     "sau_khi_bat": [
      "Chọn Battery Type, Work Mode Off-grid và DoD; kiểm tra giá trị đã lưu.",
      "Pin sạc từ PV, tải chạy ổn định, không báo lỗi.",
      "Theo dõi SOC đến cuối đêm để xác nhận đủ dung lượng.",
      "Nếu có máy phát/STS Box: thử chuyển nguồn theo sách model."
     ],
     "ban_giao": [
      "Đổi mật khẩu app/WiFi, ghi lại cho chủ đầu tư.",
      "Ghi model, serial, loại pin, DoD, Work Mode.",
      "Hướng dẫn giới hạn tải và cảnh báo dùng off-grid liên tục có thể giảm tuổi thọ pin.",
      "Giao sách biến tần và pin."
     ]
    }
   }
  },
  "missing": "Chưa tìm được dòng off-grid thuần của GoodWe trong tài liệu truy cập được; dòng ES/EM thường được dùng hybrid có lưới. Trang chính en.goodwe.com bị chặn nên chưa đọc trực tiếp sách ET G2 và PV Master; phần lớn bước ghi v=0. Địa chỉ 10.10.100.253 chỉ xác nhận qua trang hỗ trợ bên thứ ba (V2C, Columbus Energy), không phải tài liệu GoodWe. Bổ sung: không tìm được nguồn tiếng Việt nào về GoodWe; chỉ github.com đọc được, còn lại là đoạn trích tìm kiếm."
 },
 {
  "id": "sungrow",
  "name": "Sungrow",
  "color": "#E60012",
  "badge": "SG",
  "app": "iSolarCloud App (cấu hình qua WiNet-S / WiNet-S2, đăng nhập tài khoản Installer) và cổng iSolarCloud trên web",
  "types": {
   "grid": {
    "model": "Sungrow SG RT (SG3.0RT đến SG20RT, ba pha, hòa lưới) / dòng SG CX cùng loại; SG110CX (110 kVA, 9 MPPT)",
    "steps": [
     [
      "Trước khi lắp, lấy datasheet đúng model (điện áp DC tối đa, dải MPPT, dòng vào mỗi MPPT, công suất DC/AC). Tính <b>Voc ở nhiệt độ thấp nhất</b> của chuỗi tấm pin, không để vượt điện áp DC tối đa của biến tần.",
      0
     ],
     [
      "Ví dụ SG110CX (datasheet V1.21): điện áp PV tối đa <b>1100V</b>, khởi động 250V, dải MPPT 200–1000V (đủ công suất 550–850V), <b>9 MPPT</b> × tối đa 2 chuỗi/MPPT. Thiết kế chuỗi sao cho Voc lạnh &lt; 1100V.",
      1
     ],
     [
      "Dòng SG110CX: vào tối đa 26A mỗi MPPT, ngắn mạch tối đa 40A mỗi MPPT, cổng nối DC chịu tối đa 30A. Kiểm tra dòng chuỗi (Isc) của tấm pin không vượt các giá trị này.",
      1
     ],
     [
      "Lắp biến tần nơi thông thoáng, tránh nắng trực tiếp và mưa hắt, chừa khoảng hở tản nhiệt theo sách hướng dẫn. SG110CX nặng 85 kg, cần đủ người hoặc dụng cụ nâng.",
      1
     ],
     [
      "Nối <b>tiếp địa (PE)</b> trước khi đấu các dây khác.",
      0
     ],
     [
      "Đấu cáp AC qua aptomat/cầu dao riêng đúng dòng định mức. SG110CX có dòng ra tối đa 158.8A và datasheet ghi <b>không có công tắc AC</b> trong máy, nên bắt buộc có aptomat AC bên ngoài. Cỡ aptomat chọn theo sách hướng dẫn model.",
      1
     ],
     [
      "Đấu dây AC đúng thứ tự pha L1/L2/L3, N, PE vào đầu cốt. SG110CX dùng đầu cốt OT, dây tối đa 240 mm²; dây nhôm hoặc đồng đều dùng được theo hãng.",
      1
     ],
     [
      "Giữ aptomat AC ở trạng thái ngắt cho tới khi đấu xong toàn bộ.",
      0
     ],
     [
      "Đấu chuỗi DC bằng đầu MC4 đúng <b>cực tính +/-</b> (SG110CX: MC4, dây tối đa 6 mm²). Biến tần có bảo vệ ngược cực DC nhưng vẫn phải đấu đúng.",
      1
     ],
     [
      "Đo điện áp hở mạch từng chuỗi bằng đồng hồ trước khi cắm vào biến tần; so với Voc tính toán. Chuỗi quá áp có thể làm hỏng biến tần.",
      0
     ],
     [
      "Thứ tự bật nguồn thường là đóng aptomat AC trước, sau đó đóng cầu dao DC (DC switch). Thứ tự ngắt ngược lại. Xem lại thứ tự này trong sách hướng dẫn của model đang lắp.",
      0
     ],
     [
      "Gắn module truyền thông WiNet-S hoặc WiNet-S2 vào biến tần (theo nhà phân phối, biến tần string thường <b>không</b> kèm sẵn WiNet-S, còn hybrid thì có kèm; chuẩn bị module trước khi ra công trình). Nếu có mạng dây, nên dùng LAN (RJ-45, DHCP) thay vì Wi-Fi.",
      1
     ],
     [
      "Trên điện thoại bật Wi-Fi, định vị (GPS) và Bluetooth. Cài <b>iSolarCloud</b> (App Store hoặc CH Play), cập nhật lên bản mới nhất; nâng firmware biến tần/WiNet nếu có bản mới.",
      1
     ],
     [
      "Đăng ký tài khoản: Register → chọn loại <b>End User</b> → chọn server <b>International</b> → nhập email nhận mã xác thực 6 chữ số → đặt mật khẩu. Khi cài hộ khách chuyên nghiệp, dùng tài khoản Installer (theo tài liệu hãng, mã tổ chức nằm ở More → Profile → Organization Information).",
      1
     ],
     [
      "Thêm trạm: bấm dấu <b>+</b> (góc trên bên phải) → Residential/Distributed → PV → WLAN. Chọn đúng dòng hòa lưới (string) hay Hybrid để app hiện đúng tuỳ chọn.",
      1
     ],
     [
      "Quét mã QR trên logger/thân biến tần, vào cài đặt Wi-Fi điện thoại nối với Wi-Fi do biến tần phát. Quay lại iSolarCloud → chọn Wi-Fi nhà → nhập mật khẩu → Xác nhận.",
      1
     ],
     [
      "Đặt tên trạm. Ở mục quốc gia/vùng lưới chọn <b>Other 50Hz</b> (hoặc tiêu chuẩn tương đương như tài liệu hướng dẫn tiếng Việt nêu) và xác nhận với điện lực mã lưới/thông số bảo vệ cần dùng; tên menu tuỳ phiên bản firmware và app.",
      1
     ],
     [
      "Tuỳ chọn: nhập giá điện (Tariff) tham khảo để app tính tiền tiết kiệm (hướng dẫn tiếng Việt dùng khoảng 1.943 VND/kWh làm ví dụ). Cài ngày giờ, múi giờ, vị trí nhà máy.",
      1
     ],
     [
      "Nếu điện lực yêu cầu hạn chế công suất hoặc chống chảy ngược, cấu hình qua mục giới hạn công suất (Power Limitation) kèm đồng hồ đo (smart meter) hoặc CT. Menu cụ thể tuỳ model, xem sách hướng dẫn.",
      0
     ],
     [
      "Đóng aptomat AC, rồi đóng DC switch (theo thứ tự trong sách). Chờ biến tần kiểm tra lưới và chuyển sang chạy, công suất AC tăng theo bức xạ.",
      0
     ],
     [
      "Kiểm tra vận hành: không cảnh báo, các MPPT đều có điện áp và dòng hợp lý, đèn trạng thái đúng ý nghĩa trong sách.",
      0
     ],
     [
      "Kiểm tra trạm đã hiện trên iSolarCloud, tín hiệu Wi-Fi/LAN ổn định. Có thể xuất báo cáo commissioning (PDF) từ app để bàn giao cho khách hoặc điện lực.",
      1
     ]
    ],
    "tips": [
     "Luôn làm theo sách hướng dẫn của đúng model và phiên bản firmware, và theo quy định của điện lực địa phương. Tài liệu hãng nêu thông số lưới phải được xác nhận theo yêu cầu của nhà vận hành lưới tại từng dự án.",
     "Ngắt cả AC và DC, chờ tụ xả điện theo thời gian ghi trong sách hướng dẫn trước khi mở nắp hoặc đấu lại dây. Chuỗi DC vẫn có điện áp cao khi có ánh sáng.",
     "Muốn đọc dữ liệu qua Modbus (Home Assistant, openHAB...) thì theo tài liệu tích hợp bên thứ ba phải bật Modbus trên WiNet-S và tắt danh sách trắng hoặc thêm IP của hệ thống vào đó qua giao diện web của WiNet-S. Khi bật, nhớ đổi mật khẩu mặc định và không mở cổng ra Internet.",
     "Quy trình trong tài liệu Sungrow bạn gửi (iSolarCloud): chọn server <b>International</b>, loại tài khoản <b>End User</b>; thêm trạm bằng dấu <b>+</b> → Residential/Distributed → PV (hoặc Storage nếu có pin) → WLAN → quét QR trên dongle/biến tần, nối WiFi do biến tần phát rồi chọn WiFi nhà. Vùng lưới chọn <b>Other 50Hz</b> hoặc tiêu chuẩn tương đương như tài liệu nêu — xác nhận lại với sách model và điện lực.",
     "Nếu Wi-Fi yếu: đặt modem gần biến tần hoặc dùng bộ kích sóng (theo hướng dẫn tiếng Việt). Bật Wi-Fi, GPS, Bluetooth điện thoại trước khi thêm trạm."
    ],
    "tables": [
     {
      "t": "SG110CX - ngõ vào DC (datasheet V1.21)",
      "c": [
       "Thông số",
       "Giá trị"
      ],
      "r": [
       [
        "Điện áp PV tối đa",
        "1100 V"
       ],
       [
        "Điện áp khởi động / tối thiểu",
        "250 V / 200 V"
       ],
       [
        "Điện áp danh định",
        "585 V"
       ],
       [
        "Dải MPPT",
        "200–1000 V (công suất đầy 550–850 V)"
       ],
       [
        "Số MPPT x chuỗi/MPPT",
        "9 x 2"
       ],
       [
        "Dòng vào tối đa/MPPT",
        "26 A"
       ],
       [
        "Dòng ngắn mạch tối đa/MPPT",
        "40 A"
       ],
       [
        "Dòng tối đa đầu nối DC",
        "30 A"
       ]
      ]
     },
     {
      "t": "SG110CX - ngõ ra AC và đấu nối",
      "c": [
       "Thông số",
       "Giá trị"
      ],
      "r": [
       [
        "Công suất AC",
        "110 kVA @45°C / 100 kVA @50°C"
       ],
       [
        "Điện áp / dải",
        "3/N/PE 400 V, 320–460 V"
       ],
       [
        "Tần số",
        "50 Hz (45–55 Hz)"
       ],
       [
        "Dòng AC tối đa",
        "158.8 A (chọn CB theo sách)"
       ],
       [
        "Hệ số công suất chỉnh",
        "0.8 sớm – 0.8 trễ"
       ],
       [
        "Cáp DC",
        "MC4, tối đa 6 mm²"
       ],
       [
        "Cáp AC",
        "Đầu cốt OT, tối đa 240 mm²"
       ],
       [
        "Công tắc",
        "Có DC switch, không có AC switch"
       ]
      ]
     },
     {
      "t": "SG110CX - môi trường và bảo vệ",
      "c": [
       "Thông số",
       "Giá trị"
      ],
      "r": [
       [
        "Cấp bảo vệ",
        "IP66"
       ],
       [
        "Nhiệt độ làm việc",
        "-30 đến 60°C (giảm công suất >50°C)"
       ],
       [
        "Độ cao",
        "4000 m (giảm công suất >3000 m)"
       ],
       [
        "Trọng lượng",
        "85 kg"
       ],
       [
        "Chống sét",
        "SPD loại II cả DC và AC"
       ],
       [
        "Truyền thông",
        "RS485; tuỳ chọn Wi-Fi, Ethernet"
       ],
       [
        "Hiển thị",
        "LED, Bluetooth + App"
       ],
       [
        "Dòng SG3–20RT",
        "Xem datasheet từng model (tuỳ model)"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "002 / 003 / 014 / 015",
      "m": "Quá áp lưới (nhóm mã quá áp theo Sungrow Academy; 003 thường là xung tức thời, 014 là trung bình 10 phút).",
      "x": "Đo điện áp lưới tại đầu AC; kiểm tra giá trị bảo vệ quá áp/HVRT đã đặt đúng mã lưới chưa. Nếu lưới vượt dải cho phép, báo điện lực.",
      "v": 1
     },
     {
      "c": "004 / 005",
      "m": "Thấp áp lưới (theo tài liệu bên thứ ba).",
      "x": "Kiểm tra điện áp lưới, tiết diện và chiều dài dây AC, mối nối lỏng; báo điện lực nếu lưới yếu kéo dài.",
      "v": 0
     },
     {
      "c": "010",
      "m": "Mất lưới / chống đảo (không thấy điện lưới) theo tài liệu bên thứ ba.",
      "x": "Kiểm tra aptomat AC, đầu nối AC và xem lưới có mất điện không.",
      "v": 0
     },
     {
      "c": "012",
      "m": "Dòng rò quá giới hạn (theo tài liệu bên thứ ba).",
      "x": "Kiểm tra chạm đất ở chuỗi PV, cáp DC ẩm hoặc hỏng vỏ; tiếp địa đúng chưa.",
      "v": 0
     },
     {
      "c": "039",
      "m": "Điện trở cách điện hệ thống thấp (PV so với đất), theo Sungrow Academy.",
      "x": "Đo điện trở cách điện từng chuỗi và cáp DC (thử lại khi trời khô nếu chỉ lỗi lúc mưa); kiểm tra đầu MC4 ngập nước, vỏ cáp trầy, hộp đấu tấm pin. Chỉ để người có chuyên môn làm trên mạch DC.",
      "v": 1
     },
     {
      "c": "036",
      "m": "Nhiệt độ tản nhiệt quá cao (theo tài liệu bên thứ ba).",
      "x": "Kiểm tra thông thoáng, quạt và bụi, tránh nắng trực tiếp.",
      "v": 0
     },
     {
      "c": "037",
      "m": "Nhiệt độ bên trong biến tần quá cao (theo tài liệu bên thứ ba).",
      "x": "Kiểm tra vị trí lắp, nhiệt độ môi trường trong dải cho phép, công suất AC không vượt định mức.",
      "v": 0
     },
     {
      "c": "088",
      "m": "Hồ quang DC (AFCI) theo tài liệu bên thứ ba; chỉ áp dụng model có AFCI.",
      "x": "Kiểm tra đầu nối MC4, cáp DC lỏng hoặc cháy xém.",
      "v": 0
     },
     {
      "c": "106",
      "m": "Lỗi tiếp địa (theo tài liệu bên thứ ba).",
      "x": "Kiểm tra dây PE và tiếp xúc nối đất.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Ghi lại model, serial biến tần; đối chiếu Voc lạnh &lt; điện áp DC tối đa (SG110CX: 1100V).",
      "Kiểm tra cực tính và đo Voc từng chuỗi, so sánh giữa các chuỗi cùng MPPT.",
      "Đo điện trở cách điện chuỗi DC so với đất (mã lỗi 039 là lỗi thường gặp khi cách điện kém).",
      "Kiểm tra PE, đầu cốt AC siết chặt, thứ tự pha và N đúng; aptomat AC đúng cỡ.",
      "Gắn WiNet-S/S2 (nếu cần), chuẩn bị app iSolarCloud bản mới và tài khoản.",
      "Aptomat AC và DC switch đang ở vị trí ngắt; nắp đậy kín (IP66)."
     ],
     "sau_khi_bat": [
      "Làm theo thứ tự đóng AC rồi DC (xác nhận trong sách), chờ biến tần kiểm tra lưới và hòa lưới.",
      "Đọc điện áp, dòng từng MPPT/chuỗi trên app; các chuỗi cùng hướng chênh lệch ít.",
      "Đã chọn đúng vùng lưới (Other 50Hz hoặc theo điện lực) và thông số bảo vệ.",
      "Không có cảnh báo hoặc mã lỗi; ghi lại nếu có.",
      "Kiểm tra giới hạn công suất/chống chảy ngược nếu điện lực yêu cầu.",
      "Trạm online trên iSolarCloud, dữ liệu cập nhật."
     ],
     "ban_giao": [
      "Xuất báo cáo commissioning (PDF) từ iSolarCloud.",
      "Bàn giao tài khoản iSolarCloud và nhắc đổi mật khẩu; không dùng mật khẩu mặc định.",
      "Hướng dẫn khách cách ngắt an toàn (AC rồi DC) và chờ xả tụ.",
      "Ghi lại phiên bản firmware và mã lưới đã chọn trong biên bản.",
      "Bàn giao tài liệu: sách model, datasheet, sơ đồ chuỗi.",
      "Nếu bật Modbus trên WiNet-S: đổi mật khẩu mặc định, không mở cổng ra Internet."
     ]
    }
   },
   "hybrid": {
    "model": "Sungrow SH RT (SH5.0RT đến SH10RT, ba pha) và SH RS (một pha), kết hợp pin Sungrow SBR (SBR096 đến SBR256) hoặc SBH",
    "steps": [
     [
      "Trước khi lắp, kiểm tra datasheet model SH...RT/RS: điện áp DC tối đa, dải MPPT, dòng mỗi MPPT, công suất DC/AC, dải điện áp pin và công suất cổng backup.",
      0
     ],
     [
      "Tính <b>Voc ở nhiệt độ thấp</b> của chuỗi PV. Với SH10RT các nguồn thương mại ghi PV tối đa 1000V, MPPT 200–950V (khác nhau theo phiên bản phần cứng, xem datasheet bản đang lắp).",
      0
     ],
     [
      "Công suất backup ngắn hạn cao hơn mức liên tục, đừng nhầm hai giá trị này khi chọn tải dự phòng.",
      0
     ],
     [
      "Chỉ dùng pin đúng dòng tương thích do hãng chỉ định (SBR/SBH cho SH...RT/RS). Các nhà phân phối cho biết pin SBR chỉ hoạt động với biến tần Sungrow. Chọn số module pin theo bảng cấu hình của hãng.",
      1
     ],
     [
      "Pin dùng với SH RT là điện áp cao: SH10RT chỉ được duyệt với pin cao áp SBR/SBH, không dùng pin điện áp thấp (theo nhà phân phối). Lần lắp pin cao áp đầu tiên nên đặt lịch hỗ trợ từ xa với hãng (hướng dẫn nhanh SBR).",
      1
     ],
     [
      "Lắp biến tần và pin đúng khoảng cách, vị trí theo sách hướng dẫn. Nối <b>tiếp địa</b> cho biến tần và tủ pin.",
      0
     ],
     [
      "Đấu cáp nguồn pin đúng cực tính, đúng cổng theo sơ đồ hãng.",
      0
     ],
     [
      "Đấu cáp truyền thông BMS giữa pin và biến tần. Cáp dài hơn 10 m có thể gây mất truyền thông biến tần–pin, nên đi cáp ngắn và đúng loại.",
      1
     ],
     [
      "Đấu nối lưới (GRID) và cổng tải dự phòng (BACKUP/EPS) vào đúng đầu ra. Không đấu lẫn hai cổng và không nối tải lưới vào cổng backup.",
      0
     ],
     [
      "Lắp đồng hồ đo thông minh (smart meter) và CT tại điểm đấu nối lưới đúng chiều để biến tần đo được công suất lưới.",
      0
     ],
     [
      "Đấu chuỗi PV đúng cực tính, đo Voc từng chuỗi trước khi cắm.",
      0
     ],
     [
      "Thứ tự bật nguồn thường là đóng AC và bật pin trước rồi mới đóng DC. Một trang hỗ trợ không ghi model nêu thứ tự: bật pin, DC, rồi AC; vì vậy làm theo sách SH RT và sách pin đúng phiên bản. Nên đảm bảo pin đã khởi động và biến tần nhận được tín hiệu pin.",
      0
     ],
     [
      "Theo dõi đèn LED trên biến tần: xanh dương sáng khi chạy chế độ on/off-grid, nhấp nháy khi chờ hoặc khởi động, đỏ khi lỗi, tắt khi cả AC và DC không có điện (theo sách SH RT).",
      1
     ],
     [
      "Cập nhật iSolarCloud App và firmware (SH RT, SBR, WiNet-S) lên bản mới nhất trước khi commissioning. Đăng nhập tài khoản Installer, kết nối biến tần qua WiNet.",
      1
     ],
     [
      "Chạy trình hướng dẫn cài đặt: chọn đúng <b>mã lưới / grid code</b> theo điện lực (vùng 50Hz, ví dụ Other 50Hz như tài liệu tiếng Việt nêu), đặt ngày giờ.",
      1
     ],
     [
      "Khai báo loại pin và công suất pin trong trình hướng dẫn. Tên mục cụ thể tuỳ phiên bản app.",
      0
     ],
     [
      "Cài chế độ quản lý năng lượng (Energy Management). Mặc định là tự tiêu thụ (Self-consumption): PV ưu tiên cấp tải backup, rồi tải thường và pin, dư thì bán lên lưới. Có Forced Charging (sạc cưỡng bức) đặt theo ngày, giờ bắt đầu, kết thúc và SOC mục tiêu.",
      1
     ],
     [
      "Đặt giới hạn SOC trên và SOC dưới của pin (chỉ người có quyền cài đặt) và mức SOC dự trữ backup. SOC dự trữ của Peak shaving phải lớn hơn SOC dưới của backup ít nhất 2 phần trăm. Chọn giá trị theo khuyến nghị hãng pin.",
      1
     ],
     [
      "Cấu hình chống chảy ngược hoặc giới hạn công suất xuất lưới (nếu điện lực yêu cầu) qua mục giới hạn công suất xuất lưới, cần đồng hồ đo đúng chiều. Menu cụ thể tuỳ model, xem sách.",
      0
     ],
     [
      "Mẹo bên thứ ba: giới hạn xuất qua API HTTP cục bộ của WiNet-S, giá trị 0 nghĩa là <b>tắt giới hạn</b>, muốn gần 0 phải đặt số nhỏ (ví dụ 0,01 kW). Tuỳ firmware; ngoài hiện trường nên cấu hình trong app chính hãng và kiểm tra lại bằng đồng hồ.",
      1
     ],
     [
      "Kiểm tra vận hành: pin sạc khi dư PV và xả khi tải cao, công suất lưới đọc đúng dấu.",
      0
     ],
     [
      "Thử cắt lưới để kiểm tra chuyển sang cấp điện backup (EPS), theo hướng dẫn an toàn, với tải nhỏ trước.",
      0
     ],
     [
      "Thêm nhà máy lên iSolarCloud (+ → Residential/Distributed → Storage → WLAN, quét QR, nối Wi-Fi nhà) để giám sát từ xa.",
      1
     ]
    ],
    "tips": [
     "Pin lithium có năng lượng lớn: đấu nối, bật nguồn pin và cài thông số theo sách hướng dẫn SBR/SBH của đúng model. Không tự thay đổi thông số sạc xả ngoài phạm vi hãng cho phép.",
     "Cổng backup/EPS có công suất giới hạn. Không nối tải động cơ lớn, máy nén dòng khởi động cao nếu sách hướng dẫn không cho phép. Làm theo quy định điện lực địa phương về đấu nối có pin và chống chảy ngược.",
     "Theo hướng dẫn nhanh SBR, lần lắp đặt pin điện áp cao đầu tiên nên đặt lịch hỗ trợ từ xa với hãng. Nhà phân phối cho biết SH10RT chỉ được duyệt dùng với pin cao áp SBR/SBH, không dùng pin điện áp thấp.",
     "Mã lỗi nhóm lưới/cách điện/nhiệt độ của dòng SG cũng xuất hiện trên SH; lỗi liên quan pin và BMS phải tra trong sách SBR/SBH."
    ],
    "tables": [
     {
      "t": "SH10RT - thông số thương mại (tuỳ phiên bản)",
      "c": [
       "Thông số",
       "Giá trị",
       "Ghi chú"
      ],
      "r": [
       [
        "PV tối đa",
        "1000 V",
        "datasheet SH5-10RT"
       ],
       [
        "Dải MPPT",
        "200–950 V",
        "bản cũ 150–950 V"
       ],
       [
        "Dải pin",
        "150–600 V",
        "datasheet"
       ],
       [
        "Công suất AC",
        "10 kVA",
        "backup 100% khi tải lệch pha"
       ],
       [
        "Dòng AC tối đa",
        "~15.2 A",
        "tuỳ phiên bản"
       ],
       [
        "Dòng mỗi cổng DC",
        "tuỳ phiên bản",
        "bản cũ 13.5 A"
       ]
      ]
     },
     {
      "t": "Đèn LED biến tần SH RT",
      "c": [
       "Trạng thái",
       "Ý nghĩa"
      ],
      "r": [
       [
        "Xanh dương sáng",
        "Chạy chế độ on/off-grid"
       ],
       [
        "Nhấp nháy",
        "Chờ hoặc khởi động"
       ],
       [
        "Đỏ",
        "Lỗi hệ thống"
       ],
       [
        "Tắt (xám)",
        "Cả AC và DC không có điện"
       ]
      ]
     },
     {
      "t": "Mặc định và ràng buộc cài đặt",
      "c": [
       "Mục",
       "Giá trị"
      ],
      "r": [
       [
        "Chế độ EMS mặc định",
        "Self-consumption"
       ],
       [
        "Peak shaving: SOC dự trữ",
        "&gt; SOC dưới backup ít nhất 2%"
       ],
       [
        "Cáp BMS",
        "&lt; 10 m"
       ],
       [
        "Dải pin tương thích",
        "Pin cao áp SBR/SBH"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "002 / 003 / 014 / 015",
      "m": "Quá áp lưới (nhóm theo Sungrow Academy).",
      "x": "Đo điện áp lưới, kiểm tra mã lưới và giá trị bảo vệ; báo điện lực nếu lưới vượt dải.",
      "v": 1
     },
     {
      "c": "004 / 005",
      "m": "Thấp áp lưới (tài liệu bên thứ ba).",
      "x": "Kiểm tra điện áp lưới, dây AC và mối nối.",
      "v": 0
     },
     {
      "c": "010",
      "m": "Mất lưới / chống đảo (tài liệu bên thứ ba).",
      "x": "Kiểm tra aptomat AC, cổng GRID và lưới điện.",
      "v": 0
     },
     {
      "c": "039",
      "m": "Điện trở cách điện hệ thống thấp (Sungrow Academy).",
      "x": "Kiểm tra cách điện chuỗi PV và cáp DC, thử lại khi trời khô. Chỉ người có chuyên môn xử lý.",
      "v": 1
     },
     {
      "c": "036 / 037",
      "m": "Nhiệt độ tản nhiệt hoặc bên trong quá cao (tài liệu bên thứ ba).",
      "x": "Kiểm tra thông thoáng, nhiệt độ môi trường và tải.",
      "v": 0
     },
     {
      "c": "088",
      "m": "Hồ quang DC (AFCI), tài liệu bên thứ ba.",
      "x": "Kiểm tra đầu nối MC4 và cáp DC.",
      "v": 0
     },
     {
      "c": "106",
      "m": "Lỗi tiếp địa (tài liệu bên thứ ba).",
      "x": "Kiểm tra dây PE.",
      "v": 0
     },
     {
      "c": "Mất liên lạc pin/BMS",
      "m": "Biến tần không nhận tín hiệu từ pin (cáp BMS dài hơn 10 m có thể gây ra theo hướng dẫn nhanh).",
      "x": "Kiểm tra cáp BMS, nguồn pin và firmware; mã cụ thể tuỳ model/firmware, xem sách SBR/SBH.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Pin đúng dòng SBR/SBH tương thích; số module theo bảng cấu hình hãng.",
      "Cáp BMS &lt; 10 m, đầu nối chắc; PE biến tần và tủ pin.",
      "Cổng GRID và BACKUP không đấu lẫn; tải lưới không nối vào backup.",
      "Smart meter và CT lắp đúng chiều tại điểm đấu nối lưới.",
      "Đo Voc, cực tính từng chuỗi PV; Voc lạnh dưới giới hạn.",
      "Chuẩn bị app/firmware mới nhất (SH RT, SBR, WiNet-S); đặt lịch hỗ trợ từ xa nếu là lần lắp pin HV đầu tiên."
     ],
     "sau_khi_bat": [
      "Bật theo thứ tự trong sách SH RT và sách pin (đặc thù hãng).",
      "Pin khởi động, biến tần nhận tín hiệu pin, LED xanh dương khi chạy.",
      "Mã lưới, loại pin, công suất pin khai báo đúng.",
      "Chế độ EMS, SOC trên/dưới, SOC dự trữ backup đã đặt.",
      "Pin sạc khi dư PV, xả khi tải cao; công suất lưới đúng dấu.",
      "Thử chuyển backup (EPS) với tải nhỏ.",
      "Giới hạn xuất lưới hoạt động nếu điện lực yêu cầu."
     ],
     "ban_giao": [
      "Xuất báo cáo commissioning từ iSolarCloud.",
      "Bàn giao tài khoản và nhắc đổi mật khẩu; không dùng mật khẩu mặc định.",
      "Giải thích chế độ tự tiêu thụ, SOC dự trữ và giới hạn tải backup.",
      "Hướng dẫn quy trình ngắt an toàn: tắt qua app/AC, DC, pin theo sách.",
      "Ghi phiên bản firmware, mã lưới, cấu hình pin vào biên bản.",
      "Bàn giao tài liệu SH RT, SBR/SBH và thông tin liên hệ hỗ trợ."
     ]
    }
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
      "Xác định đúng model (S5-GR3P(3-20)K, S5-GR1P hay S6-GR) và tải <b>sách hướng dẫn đúng model, đúng khu vực</b> của Solis.",
      1
     ],
     [
      "Đọc phần an toàn, lắp đặt và cài đặt trong sách trước khi thi công.",
      1
     ],
     [
      "Kiểm tra chuỗi PV: <b>Voc ở nhiệt độ thấp nhất</b> phải nhỏ hơn điện áp DC tối đa của máy; Vmpp nằm trong dải MPPT.",
      0
     ],
     [
      "Kiểm tra dòng chuỗi không vượt dòng MPPT cho phép; tỉ lệ DC/AC thường chọn khoảng 1.1-1.3 tuỳ giới hạn của model.",
      0
     ],
     [
      "Lắp máy nơi thông thoáng, tránh nắng trực tiếp và nước đọng, chừa khoảng hở tản nhiệt theo sách.",
      0
     ],
     [
      "Đấu <b>tiếp địa (PE)</b> trước khi đấu các dây khác.",
      0
     ],
     [
      "Đấu AC (L1/L2/L3/N/PE theo đúng nhãn cổng) qua aptomat riêng, tiết diện dây theo bảng trong sách.",
      0
     ],
     [
      "Đo điện áp từng chuỗi bằng đồng hồ, kiểm tra đúng <b>cực tính +/-</b>, rồi mới cắm đầu MC4 vào máy.",
      0
     ],
     [
      "Trình tự bật thường: đóng aptomat AC trước, sau đó đóng công tắc DC. Trình tự tắt ngược lại (ngắt DC rồi ngắt AC); làm theo sách của model.",
      0
     ],
     [
      "Trên LCD vào <b>Advanced Settings</b> (theo hỗ trợ Solis, mật khẩu thường là <b>0010</b>, tuỳ firmware; chỉ dành cho kỹ thuật viên, nên đổi/không để lộ).",
      1
     ],
     [
      "Ngắt phát (tắt AC hoặc đặt Grid ON/OFF = OFF) trước khi đổi tiêu chuẩn lưới.",
      1
     ],
     [
      "<b>Advanced Settings &gt; Standard Select</b>: chọn tiêu chuẩn lưới phù hợp quy định điện lực Việt Nam (brochure S6-EH3P liệt kê có tiêu chuẩn \"Vietnam\"; tên mục trên S5/S6-GR xem sách).",
      1
     ],
     [
      "Cài ngày giờ. Nếu điện lực yêu cầu <b>chống chảy ngược</b>: dòng S5-GR1P(2.5-6)K có sẵn Export Power Manager (EPM) dùng CT hoặc công tơ ngoài; chiều CT và cách đấu tuỳ model, xem sách.",
      1
     ],
     [
      "Đối chiếu bảng CT/công tơ tương thích của Solis (ví dụ công tơ Acrel với CT rời) trước khi mua và lắp.",
      1
     ],
     [
      "Đăng ký trạm trên <b>SolisCloud</b>: quét mã trên datalogger để thêm thiết bị, kiểm tra tín hiệu WiFi/4G và dữ liệu đã lên cloud.",
      1
     ],
     [
      "Nếu máy báo <b>OV-G-V / UN-G-V</b>, theo Solis nguyên nhân chính thường là <b>cài sai grid code</b>; kiểm tra lại Standard Select trước. Máy đặt xa điểm đấu nối, hoặc nhiều máy 1 pha dồn chung một pha, cũng làm điện áp AC đầu cực tăng.",
      1
     ],
     [
      "Nếu đã đúng grid code mà vẫn quá áp: <b>Advanced Settings &gt; Compensation Set &gt; Voltage Parameter</b> (các mục Vg-A/B/C-Zero). Chỉ tinh chỉnh sau khi đã kiểm tra dây và lưới.",
      1
     ],
     [
      "Kiểm tra vận hành: máy tự kiểm tra rồi hòa lưới, công suất AC tăng dần theo bức xạ, không có cảnh báo.",
      0
     ],
     [
      "Ghi lại số serial, ảnh đấu nối, điện áp chuỗi để bàn giao.",
      0
     ]
    ],
    "tips": [
     "Chỉ làm theo sách hướng dẫn của đúng model và quy định của điện lực địa phương; ngắt cả AC và DC, chờ tụ xả trước khi mở nắp máy.",
     "Voc chuỗi PV vào mùa lạnh có thể vượt giới hạn DC của máy, gây hỏng; luôn tính theo hệ số nhiệt độ của tấm.",
     "Máy báo Initializing kéo dài hoặc OV-BUS thường là lỗi bên trong (bo mạch/rơ-le) theo trang hỗ trợ Solis, không tự sửa tại chỗ; liên hệ nhà phân phối/bảo hành."
    ],
    "tables": [
     {
      "t": "Đường dẫn menu LCD đã có nguồn (S5-GR / dòng Solis)",
      "c": [
       "Việc cần làm",
       "Đường dẫn / giá trị",
       "Ghi chú"
      ],
      "r": [
       [
        "Vào cài đặt kỹ thuật",
        "Advanced Settings, mật khẩu thường 0010",
        "Tuỳ firmware; nên đổi/không để lộ"
       ],
       [
        "Chọn tiêu chuẩn lưới",
        "Advanced Settings > Standard Select",
        "Tắt phát trước khi đổi"
       ],
       [
        "Bù áp lưới",
        "Advanced Settings > Compensation Set > Voltage Parameter",
        "Chỉ dùng sau khi đã kiểm tra dây/lưới"
       ],
       [
        "Chống chảy ngược 1 pha",
        "S5-GR1P(2.5-6)K: EPM + CT hoặc công tơ ngoài",
        "Chiều CT xem sách"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "OV-G-V",
      "m": "Điện áp lưới quá cao.",
      "x": "Kiểm tra Standard Select (nguyên nhân chính theo Solis là sai grid code), dây AC quá nhỏ/quá dài, nhiều máy 1 pha dồn một pha; sau cùng mới chỉnh Compensation Set.",
      "v": 1
     },
     {
      "c": "UN-G-V",
      "m": "Điện áp lưới quá thấp.",
      "x": "Kiểm tra Standard Select, đo điện áp lưới tại cổng AC, kiểm tra aptomat và đầu cos.",
      "v": 1
     },
     {
      "c": "Initializing kéo dài",
      "m": "Máy không thoát khỏi trạng thái khởi động; theo trang hỗ trợ Solis thường là lỗi bên trong (bo mạch/rơ-le).",
      "x": "Không tự sửa tại chỗ; ngắt AC/DC, liên hệ nhà phân phối/bảo hành.",
      "v": 1
     },
     {
      "c": "OV-BUS",
      "m": "Quá áp bus DC bên trong; theo hỗ trợ Solis thường là lỗi bên trong.",
      "x": "Khởi động lại một lần; nếu lặp lại, liên hệ bảo hành.",
      "v": 1
     },
     {
      "c": "Mất lưới (NO-Grid)",
      "m": "Không có lưới hoặc điện áp/tần số ngoài ngưỡng.",
      "x": "Kiểm tra aptomat AC, điện áp lưới, đấu dây AC; tên mã chính xác xem Alarm Code Overview của Solis.",
      "v": 0
     },
     {
      "c": "Điện trở cách điện thấp",
      "m": "Rò điện từ chuỗi PV xuống đất (cách điện thấp).",
      "x": "Kiểm tra dây DC, MC4, tấm pin bị ẩm/hỏng cách điện; tên mã và ngưỡng tuỳ model/firmware, xem sách.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Đo Voc từng chuỗi, đúng cực tính, nhỏ hơn điện áp DC tối đa của máy (tính theo nhiệt độ thấp).",
      "Tiếp địa PE đã đấu chắc, đo thông mạch.",
      "Aptomat AC riêng, tiết diện dây đúng bảng trong sách model.",
      "Công tắc DC và aptomat AC đang ở vị trí OFF; nắp đậy đã siết.",
      "Đã chuẩn bị tiêu chuẩn lưới sẽ chọn theo yêu cầu điện lực (Standard Select).",
      "Datalogger đã lắp, mã QR chụp lại để đăng ký SolisCloud."
     ],
     "sau_khi_bat": [
      "Bật AC trước rồi DC (theo sách); máy tự kiểm tra rồi hòa lưới.",
      "Standard Select đúng quy định; đã đổi/không để lộ mật khẩu Advanced Settings.",
      "Không có cảnh báo OV-G-V/UN-G-V; điện áp AC trong ngưỡng.",
      "Công suất AC tăng dần theo bức xạ, so với dự kiến.",
      "Nếu cần chống ngược: thử CT/công tơ, chiều CT đúng, công suất xuất lưới bị giới hạn.",
      "Dữ liệu đã lên SolisCloud, tín hiệu WiFi/4G ổn định."
     ],
     "ban_giao": [
      "Số serial, model, ảnh đấu nối AC/DC/tiếp địa.",
      "Bảng điện áp từng chuỗi và công suất đầu ra khi nghiệm thu.",
      "Tài khoản SolisCloud đã bàn giao cho chủ đầu tư.",
      "Tiêu chuẩn lưới đã chọn và thông số đã chỉnh (nếu có).",
      "Hướng dẫn tắt/bật an toàn, số liên hệ bảo hành."
     ]
    }
   },
   "hybrid": {
    "model": "Solis RHI-(3-6)K-48ES-5G (1 pha, pin áp thấp 48V), S6-EH1P(3-10)K-L-PLUS (1 pha, pin áp thấp 40-60V), S6-EH3P (3 pha); Solis S6-EH3P(8–18)K02-NV-YD-L (3 pha, điện áp thấp)",
    "steps": [
     [
      "Xác định model và tải sách hướng dẫn đúng bản. Dòng S6-EH1P(3-10)K-L-PLUS và RHI-48ES dùng pin áp thấp (khoảng 40-60V), hoạt động với pin lithium-ion và pin chì-axit.",
      1
     ],
     [
      "Kiểm tra PV: Voc ở nhiệt độ thấp không vượt điện áp DC tối đa của máy.",
      1
     ],
     [
      "Kiểm tra dòng mỗi MPPT trong giới hạn (S6-EH1P(3-10)K-L-PLUS theo trang sản phẩm khoảng 21 A, 2 MPPT; S6-EH3P8-18K xem bảng thông số).",
      1
     ],
     [
      "Chọn pin trong danh sách Solis công bố cho đúng model; dòng S6 hybrid chạy pin lithium và chì-axit, phổ biến nhất là <b>Pylontech</b>.",
      1
     ],
     [
      "Đối chiếu điện áp danh định, dòng sạc/xả tối đa của pin với giới hạn máy (S6-EH3P8-18K: pin 40-60 V, xem bảng).",
      1
     ],
     [
      "Đấu tiếp địa trước, rồi đấu cổng <b>GRID</b> và cổng <b>BACKUP/EPS</b> (tải ưu tiên) đúng nhãn; không nối cổng GRID với cổng BACKUP.",
      0
     ],
     [
      "Đấu pin đúng <b>cực tính</b> qua cầu dao/cầu chì DC cho pin (S6-EH3P8-18K: cổng pin dạng đầu cốt vặn vít).",
      0
     ],
     [
      "Đấu cáp giao tiếp BMS (<b>CAN hoặc RS485</b> tuỳ pin) theo sơ đồ chân trong sách. Cáp BMS kèm máy dùng chân 2, có thể gây lỗi giao tiếp với pin không phải Pylontech; một người dùng diễn đàn FoxESS phải đảo chân 4/5 cho pin Fox. Luôn đối chiếu sơ đồ chân của đúng pin.",
      0
     ],
     [
      "Trình tự thường gặp: bật pin trước máy; khi tắt thì tắt máy trước rồi mới tắt pin (làm ngược có thể sinh thêm mã lỗi theo một nhà lắp đặt Ireland). Bật AC/DC theo sách model.",
      1
     ],
     [
      "Vào <b>Advanced Settings</b> (mật khẩu thường 0010 theo hỗ trợ Solis, tuỳ firmware), xác nhận <b>Standard Select</b> đúng grid code theo quy định điện lực, rồi cài ngày giờ.",
      1
     ],
     [
      "RHI-48ES-5G / S5-EH1P: <b>Advanced Settings &gt; Storage Energy Set &gt; Battery Select</b>, chọn loại pin (lithium có giao tiếp BMS hoặc chì-axit). Tên menu S6 có thể khác, xem sách hoặc SolisCloud.",
      1
     ],
     [
      "Cài dòng sạc/xả và mức xả thấp nhất theo khuyến cáo nhà sản xuất pin.",
      0
     ],
     [
      "<b>Storage Mode Select</b>: chọn <b>Self Use</b> và tắt các chế độ khác (chỉ một chế độ hoạt động tại một thời điểm).",
      1
     ],
     [
      "Đặt <b>Charge from grid = Allow</b> nếu muốn sạc pin từ lưới. Nếu không dùng backup thì tắt backup.",
      1
     ],
     [
      "Muốn sạc theo giờ thì bật Time Charging (S6 có thể có tới 6 khung giờ, mỗi khung có SOC và dòng sạc riêng).",
      1
     ],
     [
      "Chọn loại công tơ trong menu, lắp công tơ/CT theo sách để chống chảy ngược và để máy điều khiển sạc/xả theo tải.",
      1
     ],
     [
      "Đăng ký thiết bị trên <b>SolisCloud</b> bằng cách quét mã datalogger.",
      1
     ],
     [
      "AC coupling với máy PV có sẵn: dùng <b>công tơ Eastron</b> (chỉ hỗ trợ hãng này), công tơ 1 điều khiển sạc/xả pin đặt <b>địa chỉ slave 01</b>, công tơ 2 đo sản lượng máy PV cũ đặt <b>địa chỉ 02</b>; chọn chế độ <b>PV+Grid</b> trong cài đặt máy. Tham số OFF-SOC xem trên SolisCloud theo tài liệu Solis.",
      1
     ],
     [
      "Chạy song song: tối đa <b>6 máy</b> cùng model và cùng firmware, nối CAN bằng cổng RJ45 Parallel-A/Parallel-B (S6-EH3P8-18K có 2 cổng CAN-Parallel); dip switch 1 và 2 ON ở máy đầu và máy cuối, OFF ở máy giữa.",
      1
     ],
     [
      "Song song: chung điểm tiếp địa; công tơ và datalogger chỉ nối vào máy chủ (master); chế độ làm việc chỉ chỉnh trên master.",
      1
     ],
     [
      "Thử vận hành: kiểm tra pin sạc/xả đúng, thử ngắt lưới xem chuyển sang backup (S6-EH3P8-18K: dưới 10 ms một máy, dưới 20 ms song song tới 6 máy).",
      1
     ],
     [
      "Lỗi <b>Batt_Comm_FAIL / No Battery</b> thường do cáp CAN lỏng hoặc sai chân, pin chưa bật, hoặc chọn sai loại pin; Solis khuyên thay cáp do nhà phân phối cấp. Pin tắt hẳn (không còn đèn LED) có thể cần kỹ thuật viên sạc kích hoạt.",
      1
     ],
     [
      "S6-EH3P8-18K: giao diện tiêu chuẩn WiFi+LAN+Bluetooth, CAN-BMS, RS485-Meter, DRM, DI, DO x4; 2G/3G/4G tuỳ chọn; màn hình LCD 7 inch và ứng dụng qua Bluetooth.",
      1
     ],
     [
      "S6-EH3P8-18K cho phép mảng PV tới <b>160%</b> công suất DC định mức, đầu ra dự phòng chịu quá tải 2 lần trong 10 giây (chế độ ngoài lưới), 3 pha không cân bằng, có cổng đầu vào máy phát và hỗ trợ ghép DC/AC.",
      1
     ]
    ],
    "tips": [
     "Pin có điện áp luôn hiện diện ngay cả khi ngắt AC/DC; chỉ mở máy khi đã cách ly cầu dao pin và theo sách hướng dẫn.",
     "Làm đúng sách model và quy định điện lực; chỉ dùng pin trong danh sách tương thích để tránh lỗi giao tiếp BMS.",
     "Thời gian chuyển sang backup của RAI/RHI-48ES khác nhau giữa các datasheet (dưới 20 ms ở bản này, dưới 50 ms ở bản khác); không coi là cam kết, đối chiếu datasheet đúng bản.",
     "Bản brochure này ghi chuyển backup dưới 10 ms (S6-EH3P); các datasheet khác của Solis có thể ghi dưới 20 hoặc 50 ms — xem đúng sách của model."
    ],
    "tables": [
     {
      "t": "S6-EH3P(8-18)K02-NV-YD-L: công suất, PV và dòng pin (brochure VN)",
      "c": [
       "Model",
       "Mảng PV tối đa đề xuất",
       "Công suất AC định mức",
       "Dòng sạc/xả pin tối đa"
      ],
      "r": [
       [
        "8K",
        "16 kW",
        "8 kW",
        "180 A"
       ],
       [
        "10K",
        "20 kW",
        "10 kW",
        "220 A"
       ],
       [
        "12K",
        "24 kW",
        "12 kW",
        "250 A"
       ],
       [
        "15K",
        "30 kW",
        "15 kW",
        "290 A"
       ],
       [
        "18K",
        "36 kW",
        "18 kW",
        "320 A"
       ]
      ]
     },
     {
      "t": "S6-EH3P8-18K: PV và pin (chung các model)",
      "c": [
       "Thông số",
       "Giá trị"
      ],
      "r": [
       [
        "Điện áp PV tối đa",
        "1000 V"
       ],
       [
        "Dải MPPT / khởi động",
        "200-850 V / 160 V"
       ],
       [
        "Số MPPT / chuỗi tối đa",
        "2/3 (8-12K), 2/4 (15-18K)"
       ],
       [
        "Dòng tối đa mỗi đầu vào DC",
        "20 A hoặc 21 A tuỳ model (brochure ghi \"20 A 21 A\", xem đúng cột của model)"
       ],
       [
        "Loại pin / dải điện áp",
        "Li-ion hoặc chì-axit / 40-60 V"
       ],
       [
        "Cổng pin / BMS / truyền thông",
        "2 / 1 / CAN, RS485"
       ],
       [
        "Dòng mỗi cổng pin",
        "150 A (8-12K) / 175 A (15-18K), theo bố cục bảng"
       ]
      ]
     },
     {
      "t": "S6-EH3P8-18K: dòng AC (380/400 V)",
      "c": [
       "Model",
       "Dòng lưới/backup định mức",
       "Dòng AC vào từ lưới tối đa",
       "Công suất vào máy phát"
      ],
      "r": [
       [
        "8K",
        "12.2 A / 11.5 A",
        "18.3 A / 17.3 A",
        "8 kW"
       ],
       [
        "10K",
        "15.2 A / 14.4 A",
        "22.8 A / 21.7 A",
        "10 kW"
       ],
       [
        "12K",
        "18.2 A / 17.3 A",
        "27.3 A / 26.0 A",
        "12 kW"
       ],
       [
        "15K",
        "22.8 A / 21.7 A",
        "34.2 A / 32.5 A",
        "15 kW"
       ],
       [
        "18K",
        "27.3 A / 26.1 A",
        "41 A / 39.2 A",
        "18 kW"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "Batt_Comm_FAIL / No Battery",
      "m": "Máy không giao tiếp được với BMS của pin.",
      "x": "Kiểm tra cáp CAN/RS485 (lỏng, sai chân), pin đã bật chưa, chọn đúng loại pin; dùng cáp do nhà phân phối cấp.",
      "v": 1
     },
     {
      "c": "OV-G-V",
      "m": "Điện áp lưới quá cao.",
      "x": "Kiểm tra Standard Select (nguyên nhân chính là sai grid code), dây AC, rồi mới chỉnh bù áp.",
      "v": 1
     },
     {
      "c": "UN-G-V",
      "m": "Điện áp lưới quá thấp.",
      "x": "Kiểm tra Standard Select và điện áp lưới tại cổng GRID.",
      "v": 1
     },
     {
      "c": "Initializing kéo dài / OV-BUS",
      "m": "Theo hỗ trợ Solis thường là lỗi bên trong (bo mạch/rơ-le).",
      "x": "Không tự sửa tại chỗ; cách ly pin và lưới, liên hệ bảo hành.",
      "v": 1
     },
     {
      "c": "Mã lỗi phát sinh khi tắt sai thứ tự",
      "m": "Tắt pin trước khi tắt máy có thể sinh thêm mã lỗi (theo một nhà lắp đặt).",
      "x": "Tắt máy trước rồi mới tắt pin; bật pin trước máy.",
      "v": 1
     },
     {
      "c": "Pin tắt hẳn, không còn đèn LED",
      "m": "Pin xả quá sâu, BMS ngắt.",
      "x": "Có thể cần kỹ thuật viên sạc kích hoạt pin trước khi bật lại.",
      "v": 1
     },
     {
      "c": "Quá tải ngõ backup",
      "m": "Tải backup vượt công suất danh định (S6-EH3P8-18K chịu 2 lần trong 10 giây).",
      "x": "Giảm tải, tách tải ưu tiên; tên mã tuỳ model/firmware, xem sách.",
      "v": 0
     },
     {
      "c": "Điện trở cách điện thấp / dòng rò",
      "m": "Rò điện từ chuỗi PV (máy có giám sát cách điện và dòng dư).",
      "x": "Kiểm tra dây DC, MC4; tên mã tuỳ model/firmware, xem sách.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Model pin nằm trong danh sách tương thích của Solis; điện áp pin 40-60 V đúng cực tính.",
      "Cầu dao/cầu chì DC của pin đã lắp, đang OFF.",
      "Cổng GRID và BACKUP đấu đúng nhãn, không nối chéo; tiếp địa PE chắc.",
      "Cáp BMS CAN/RS485 đã đối chiếu sơ đồ chân của đúng pin.",
      "Công tơ/CT lắp đúng chiều; địa chỉ công tơ đúng nếu có AC coupling (01/02).",
      "Song song: cùng model, cùng firmware, dip switch đúng vị trí (ON đầu/cuối, OFF giữa)."
     ],
     "sau_khi_bat": [
      "Thứ tự bật: pin trước, rồi máy; tắt thì tắt máy trước, pin sau.",
      "Standard Select đúng; mật khẩu Advanced Settings đã đổi/không để lộ.",
      "Pin nhận BMS, không có Batt_Comm_FAIL; Battery Select đúng loại pin.",
      "Storage Mode = Self Use, Charge from grid đúng yêu cầu; kiểm tra pin sạc/xả.",
      "Thử ngắt lưới: tải backup chuyển nguồn và chạy ổn định, rồi cấp lại lưới.",
      "Dữ liệu lên SolisCloud, công tơ hiển thị đúng chiều công suất."
     ],
     "ban_giao": [
      "Số serial máy, pin, datalogger; ảnh đấu nối.",
      "Chế độ lưu trữ, khung giờ sạc, mức xả thấp nhất đã cài.",
      "Danh sách tải backup và công suất tối đa cho phép.",
      "Tài khoản SolisCloud đã bàn giao.",
      "Hướng dẫn tắt/bật đúng thứ tự pin-máy và cảnh báo pin luôn có điện áp."
     ]
    }
   },
   "offgrid": {
    "model": "Solis RAI-3K-48ES-5G (off-grid/backup, pin 48V)",
    "steps": [
     [
      "Xác nhận RAI-3K-48ES-5G là dòng của Solis dùng cho độc lập/backup: datasheet ghi có chức năng backup/EPS, dùng pin chì-axit hoặc li-ion.",
      1
     ],
     [
      "Điện áp pin 40-60 V, dòng sạc/xả tối đa 60 A, dung lượng pin 50-2000 Ah (datasheet).",
      1
     ],
     [
      "Tính tải: công suất backup định mức 3 kW (cần điện áp pin trên 55 V), công suất biểu kiến tối đa 4.5 kVA.",
      1
     ],
     [
      "Tính cả dòng khởi động của tải cảm (bơm, máy nén, điều hoà).",
      1
     ],
     [
      "Kiểm tra PV: Voc ở nhiệt độ thấp không vượt giới hạn DC, dòng MPPT trong giới hạn theo datasheet bản đang dùng (các bản datasheet có số liệu khác nhau).",
      1
     ],
     [
      "Chọn dung lượng pin theo số giờ tự chủ và dòng xả; pin 48V kèm cầu dao/cầu chì DC phù hợp.",
      0
     ],
     [
      "Đấu tiếp địa, rồi đấu pin đúng cực tính bằng dây đủ tiết diện (tránh sụt áp).",
      0
     ],
     [
      "Đấu tải vào cổng ngõ ra backup, không vượt công suất.",
      0
     ],
     [
      "Nếu dùng máy phát hoặc lưới làm nguồn phụ, đấu vào cổng ngõ vào AC theo sách; xác nhận trong sách là máy phát được hỗ trợ hay không.",
      0
     ],
     [
      "Thứ tự khởi động thường: đóng cầu dao pin, đóng DC từ PV, rồi bật tải từng nhóm từ nhỏ đến lớn để tránh sốc dòng.",
      0
     ],
     [
      "Cài điện áp/tần số ngõ ra (tại Việt Nam thường 220-230 V, 50 Hz), loại pin, ngưỡng xả tối thiểu và dòng sạc theo khuyến cáo nhà sản xuất pin; tên menu xem sách.",
      0
     ],
     [
      "Kết nối SolisCloud/WiFi nếu có datalogger, kiểm tra dữ liệu.",
      0
     ],
     [
      "Kiểm tra vận hành: điện áp ngõ ra ổn định khi tải tăng, pin sạc từ PV, cảnh báo pin yếu hoạt động.",
      0
     ]
    ],
    "tips": [
     "Nguồn dòng RAI-3K-48ES-5G và cách dùng thuần off-grid cần đối chiếu sách hướng dẫn chính hãng; chưa đọc được manual đầy đủ.",
     "Không đấu quá tải ngõ ra backup; làm theo sách model và quy định an toàn điện địa phương.",
     "Datasheet RAI-3K-48ES-5G: pin 40-60 V, dung lượng 50-2000 Ah, backup 3 kW chỉ khi điện áp pin trên 55 V (bank chì-axit có thể xuống dưới ngưỡng này khi tải nặng); thời gian chuyển backup ghi dưới 20 ms hoặc dưới 50 ms tuỳ bản. Chưa tìm được nguồn không chính thức nào về menu off-grid hoặc máy phát."
    ],
    "tables": [
     {
      "t": "RAI-3K-48ES-5G (datasheet)",
      "c": [
       "Thông số",
       "Giá trị",
       "Ghi chú"
      ],
      "r": [
       [
        "Điện áp pin",
        "40-60 V",
        "Chì-axit hoặc Li-ion"
       ],
       [
        "Dung lượng pin",
        "50-2000 Ah",
        ""
       ],
       [
        "Dòng sạc/xả tối đa",
        "60 A",
        ""
       ],
       [
        "Công suất backup định mức",
        "3 kW",
        "Chỉ khi điện áp pin trên 55 V"
       ],
       [
        "Công suất biểu kiến tối đa",
        "4.5 kVA",
        ""
       ],
       [
        "Thời gian chuyển backup",
        "dưới 20 ms hoặc dưới 50 ms",
        "Tuỳ bản datasheet"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "Quá tải ngõ backup",
      "m": "Tải vượt công suất, đặc biệt khi pin dưới 55 V (chỉ còn dưới 3 kW).",
      "x": "Giảm tải, khởi động tải lớn từng nhóm; tên mã xem sách.",
      "v": 0
     },
     {
      "c": "Sụt áp pin / pin yếu",
      "m": "Dây pin nhỏ hoặc pin xả sâu làm máy cắt.",
      "x": "Kiểm tra tiết diện dây, đầu cos, dung lượng pin; sạc lại pin.",
      "v": 0
     },
     {
      "c": "Batt_Comm_FAIL / No Battery",
      "m": "Lỗi giao tiếp pin lithium (cùng họ máy 48ES, lỗi này có nguồn cho RHI-48ES).",
      "x": "Kiểm tra cáp CAN, pin đã bật, chọn đúng loại pin; chưa có nguồn riêng cho RAI.",
      "v": 0
     },
     {
      "c": "Initializing kéo dài / OV-BUS",
      "m": "Theo hỗ trợ Solis cho dòng Solis nói chung: thường là lỗi bên trong.",
      "x": "Không tự sửa; liên hệ bảo hành.",
      "v": 0
     },
     {
      "c": "Điện trở cách điện thấp",
      "m": "Rò điện từ chuỗi PV.",
      "x": "Kiểm tra dây DC, MC4; tên mã tuỳ firmware, xem sách.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Điện áp pin 40-60 V đúng cực tính; cầu dao/cầu chì DC pin đã lắp.",
      "Dây pin đủ tiết diện, đầu cos siết chặt.",
      "Tổng công suất và dòng khởi động tải không vượt 3 kW (4.5 kVA tối đa).",
      "Tiếp địa PE chắc; Voc chuỗi PV nhỏ hơn giới hạn DC.",
      "Đã đối chiếu datasheet đúng bản của RAI-3K-48ES-5G."
     ],
     "sau_khi_bat": [
      "Thứ tự: cầu dao pin, DC từ PV, rồi bật tải từng nhóm.",
      "Điện áp/tần số ngõ ra đúng (220-230 V, 50 Hz) và ổn định khi tăng tải.",
      "Pin sạc từ PV, điện áp pin giữ trên 55 V khi tải nặng.",
      "Ngưỡng xả tối thiểu và cảnh báo pin yếu đã cài.",
      "Dữ liệu SolisCloud (nếu có datalogger)."
     ],
     "ban_giao": [
      "Danh sách tải và công suất tối đa cho phép.",
      "Dung lượng pin, thời gian tự chủ ước tính.",
      "Ảnh đấu nối, số serial.",
      "Hướng dẫn tắt/bật và lưu ý tụ xả trước khi mở nắp."
     ]
    }
   }
  },
  "missing": "Các miền solisinverters.com, ginlong.com và baywa bị chặn nên không đọc được manual đầy đủ; chỉ xác minh thông tin từ kết quả tìm kiếm và datasheet (điện áp pin 40-60 V, backup/EPS, 3 kW, SolisCloud quét mã). Tên menu, mật khẩu, trình tự bật nguồn đều để v=0. Solis không có dòng off-grid thuần riêng nổi bật; RAI-48ES là dòng backup/off-grid cần đối chiếu. S6-GR chưa tìm được tài liệu riêng. Vòng bổ sung: mọi tên miền (solisinverters.com, ginlong.com, solar-assistant.io, powerforum.co.za, akkudoktor.net, energetica-india.net) đều bị chặn khi WebFetch, nên các điểm mới chỉ dựa trên đoạn trích tìm kiếm. Chưa tìm được hướng dẫn tiếng Việt từ nhà thầu/diễn đàn Việt Nam; không có nguồn nào về menu off-grid RAI hay S6-GR cụ thể."
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
      "Tải <b>sách hướng dẫn chính hãng đúng model</b> từ deyeinverter.com.",
      1
     ],
     [
      "Đối chiếu nhãn máy với sách: SUN-xK-G có nhiều biến thể (G03, G05, G-LV...), menu và thông số khác nhau.",
      1
     ],
     [
      "Kiểm tra thiết kế string: <b>Voc ở nhiệt độ thấp nhất</b> của chuỗi phải nhỏ hơn điện áp DC tối đa của model.",
      0
     ],
     [
      "Kiểm tra dòng Isc mỗi string không vượt dòng vào tối đa mỗi MPPT và tỉ lệ DC/AC nằm trong giới hạn model (lấy số từ datasheet).",
      0
     ],
     [
      "Chọn vị trí lắp thông thoáng, tránh nắng trực tiếp và mưa hắt, chừa khoảng hở tản nhiệt theo sách.",
      0
     ],
     [
      "Bắt máy vào tường chắc chắn bằng đúng bộ treo kèm máy.",
      0
     ],
     [
      "Giữ CB AC và công tắc DC ở trạng thái <b>OFF</b> trong suốt lúc đấu dây.",
      0
     ],
     [
      "Nối <b>tiếp địa (PE)</b> trước tiên. Tiếp địa kém có thể gây lỗi nhóm F23 (theo thảo luận người dùng).",
      0
     ],
     [
      "Đấu cáp AC đúng pha/trung tính vào CB/aptomat AC riêng đúng cỡ.",
      0
     ],
     [
      "Đo Voc từng string bằng đồng hồ và kiểm tra <b>đúng cực +/-</b> trước khi cắm.",
      0
     ],
     [
      "Cắm các đầu MC4 vào đầu vào MPPT tương ứng.",
      0
     ],
     [
      "Bật nguồn: thường đóng <b>CB AC trước</b>, sau đó đóng <b>công tắc DC</b> (thứ tự đúng theo sách model).",
      0
     ],
     [
      "Chờ máy tự kiểm tra và đếm giờ trước khi hòa lưới.",
      0
     ],
     [
      "Cắm Stick Logger Wi-Fi, cấu hình mạng qua app SOLARMAN và thêm trạm (plant) bằng số serial của logger.",
      1
     ],
     [
      "Chọn <b>tiêu chuẩn lưới (Grid Standard / Grid Code)</b> phù hợp quy định điện lực Việt Nam; tên menu cụ thể tuỳ model/firmware, xem sách.",
      0
     ],
     [
      "Đặt thông số điện áp/tần số/thời gian bảo vệ theo yêu cầu đơn vị điện lực.",
      0
     ],
     [
      "Nếu điện lực yêu cầu <b>chống phát ngược</b>, dùng thiết bị chống ngược (CT hoặc đồng hồ qua RS485, ví dụ hộp anti-reflux của Solarman) và cài giới hạn theo hướng dẫn thiết bị.",
      0
     ],
     [
      "Lưu ý: đồng hồ CHINT DDSU666 nhà bán nêu tương thích Deye được ghi cho dòng hybrid một pha, chưa thấy nguồn xác nhận cho dòng G; hỏi nhà phân phối.",
      0
     ],
     [
      "Kiểm tra vận hành: trạng thái hòa lưới, điện áp/dòng từng MPPT, công suất AC.",
      0
     ],
     [
      "Đối chiếu app với đồng hồ điện; ghi lại mã lỗi nếu có và tra bảng lỗi trong sách.",
      0
     ]
    ],
    "tips": [
     "Điện áp DC của dàn pin có thể rất cao và vẫn còn khi trời sáng: chỉ thao tác khi đã ngắt DC/AC, dùng đồ bảo hộ, và chờ tụ xả theo sách hướng dẫn trước khi mở máy.",
     "Chỉ cài grid code và giới hạn phát theo yêu cầu của điện lực địa phương; không tự ý sửa thông số bảo vệ lưới.",
     "Lỗi hay gặp: Voc vượt giới hạn do lạnh, đảo cực string, lưới ngoài dải điện áp/tần số, tiếp địa không tốt.",
     "Nguồn không chính thức cho dòng G (string) rất ít: các thảo luận tìm thấy chủ yếu về dòng hybrid, nên phần hòa lưới vẫn chủ yếu dựa vào sách hướng dẫn model."
    ],
    "tables": [
     {
      "t": "SUN-18~25K-G05: thông số DC/AC (datasheet Deye bản Pháp + nhà bán, nguồn lệch nhau)",
      "c": [
       "Thông số",
       "Giá trị",
       "Ghi chú"
      ],
      "r": [
       [
        "Dải MPPT",
        "200-1000 V",
        "datasheet Deye"
       ],
       [
        "Điện áp khởi động",
        "250 V",
        "datasheet"
       ],
       [
        "Điện áp PV định mức",
        "600 V",
        "datasheet"
       ],
       [
        "Điện áp DC tối đa",
        "1000 V hoặc 1100 V",
        "nguồn lệch: nhà bán 1000, datasheet 1100; xem sách"
       ],
       [
        "Dòng DC mỗi MPPT",
        "26 A (có nguồn ghi 30 A)",
        "nguồn lệch; xem sách"
       ],
       [
        "Dòng AC tối đa",
        "33,3 / 31,9 A",
        "theo nhà bán, 220/380 V và 230/400 V"
       ],
       [
        "CB AC và tiết diện dây",
        "tuỳ model",
        "tính từ dòng AC tối đa và quy chuẩn địa phương"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "F23",
      "m": "Dòng rò / lỗi tiếp địa (bảng mã chung, không rõ model)",
      "x": "Kiểm tra tiếp địa PE, cách điện cáp PV, string bị ẩm; tuỳ model/firmware, xem sách.",
      "v": 0
     },
     {
      "c": "F18",
      "m": "Quá dòng AC (bảng mã chung, không rõ model)",
      "x": "Kiểm tra tải/lưới phía AC, đối chiếu sách model.",
      "v": 0
     },
     {
      "c": "Lỗi điện áp/tần số lưới",
      "m": "Lưới ngoài dải bảo vệ đã cài",
      "x": "Đo lưới, kiểm tra grid code đã chọn; không tự nới dải bảo vệ.",
      "v": 0
     },
     {
      "c": "Voc vượt giới hạn",
      "m": "Điện áp string cao (nhất là khi lạnh)",
      "x": "Giảm số tấm trong string theo Voc ở nhiệt độ thấp.",
      "v": 0
     },
     {
      "c": "Đảo cực string",
      "m": "Đấu ngược +/- ở đầu vào PV",
      "x": "Ngắt DC, đo lại và đấu đúng cực.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Đối chiếu nhãn máy với sách hướng dẫn đúng model (G03/G05/G-LV...)",
      "Đo Voc từng string, đúng cực, nhỏ hơn giới hạn DC tối đa của model",
      "Tiếp địa PE nối chắc, đo thông mạch",
      "Cáp AC đúng pha/trung tính, CB AC đúng cỡ đang OFF",
      "Công tắc DC đang OFF, đầu MC4 siết chặt"
     ],
     "sau_khi_bat": [
      "Đóng CB AC trước rồi công tắc DC (theo sách model), chờ máy đếm giờ hòa lưới",
      "Kiểm tra trạng thái hòa lưới, không có mã lỗi",
      "Đọc điện áp/dòng từng MPPT trên LCD hoặc app",
      "Đối chiếu công suất AC với đồng hồ điện",
      "Kiểm tra chống phát ngược nếu điện lực yêu cầu"
     ],
     "ban_giao": [
      "Grid Standard/Grid Code đúng yêu cầu điện lực, ghi lại",
      "Stick Logger lên app SOLARMAN, đã thêm trạm bằng số serial",
      "Ghi số serial máy, logger, thông số chuỗi PV",
      "Hướng dẫn khách đọc app và quy trình tắt/mở máy an toàn",
      "Đổi mật khẩu app/thiết bị (nếu có), không để mặc định"
     ]
    }
   },
   "hybrid": {
    "model": "Deye SUN-xK-SG0x (ví dụ SUN-5/8/10/12K-SG04LP3 ba pha pin thấp áp 48V; SUN-7/8/10/12K-SG06LP1 một pha; các dòng SG05LP3 / SG01HP3 pin cao áp tuỳ model)",
    "steps": [
     [
      "Tải <b>sách hướng dẫn đúng model</b> và xác nhận biến thể (pin thấp áp 48V hay cao áp, một pha hay ba pha, hậu tố -EU/-LV...): menu và dải điện áp pin khác nhau.",
      1
     ],
     [
      "Kiểm tra Voc string ở nhiệt độ thấp không vượt điện áp DC tối đa và dòng Isc mỗi MPPT trong giới hạn.",
      0
     ],
     [
      "Kiểm tra công suất pin, dòng sạc/xả tối đa khớp với dải của biến tần.",
      0
     ],
     [
      "Tắt hết mọi CB trước khi đấu nối; nối <b>tiếp địa</b> trước.",
      0
     ],
     [
      "Đấu cổng <b>GRID</b> (lưới) và cổng <b>LOAD</b> (tải backup).",
      0
     ],
     [
      "Cổng <b>GEN</b> (máy phát hoặc Smart Load, nếu có): theo diễn đàn người dùng, không đấu tải thường vào GEN trừ khi đã cấu hình đúng chức năng cổng này.",
      1
     ],
     [
      "Đấu pin đúng cực, qua cầu chì/CB DC; đấu PV.",
      0
     ],
     [
      "Lắp <b>CT hoặc đồng hồ đo</b> tại điểm đấu lưới theo chiều mũi tên (hướng về phía lưới) nếu dùng Zero Export To CT.",
      1
     ],
     [
      "Nếu CT sai chiều/sai pha, số liệu lưới dao động hoặc âm: đổi chiều CT, kiểm tra kiểu pha trong cài đặt lưới, hoặc nối đất CT (theo người dùng; tuỳ model/firmware, xem sách).",
      1
     ],
     [
      "Pin lithium có BMS: nối cáp <b>CAN</b> (hoặc RS485 tuỳ pin) giữa pin và biến tần. Chỉ dùng pin trong danh sách tương thích của Deye.",
      1
     ],
     [
      "Vào <b>Battery Setup</b>, chọn loại <b>Lithium</b> và Mode (người dùng SG04LP3 báo <b>Mode 00</b> cho giao thức CAN).",
      1
     ],
     [
      "Sai cáp/sai chân gây F58 (BMS comm), cảnh báo W31 hoặc nhiệt độ pin bất thường; có ca khỏi sau khi thay cáp đúng chuẩn CAN.",
      1
     ],
     [
      "Bật nguồn theo thứ tự trong sách (thường pin trước, rồi PV, rồi lưới).",
      0
     ],
     [
      "Trong <b>Battery Setup</b> đặt dung lượng, dòng sạc/xả tối đa (<b>Max A Charge/Discharge</b>). Ở chế độ lithium máy lấy giá trị nhỏ hơn giữa cài đặt và BMS (theo người dùng).",
      1
     ],
     [
      "Đặt 3 ngưỡng pin <b>Shutdown / Low Batt / Restart</b>; Shutdown phải nhỏ hơn Low Batt.",
      1
     ],
     [
      "Ví dụ ngưỡng: 20% / 35% / 50% (diễn đàn, nói sách Deye gợi ý cho pin Hubble); nhà lắp đặt Pháp: Low 20-25%, Shutdown 15-20%, Restart 30-40%. Đối chiếu khuyến cáo nhà sản xuất pin.",
      1
     ],
     [
      "Chọn <b>System Work Mode</b>: <b>Selling First</b> (ưu tiên bán điện), <b>Zero Export To Load</b> (chỉ cấp tải backup) hoặc <b>Zero Export To CT</b> (cấp cả tải nhà, không phát lên lưới).",
      1
     ],
     [
      "Nếu không được phép phát lưới: đừng chọn Selling First và đừng tích Solar Sell; với Zero Export, một người dùng đặt Zero Export Power ~5W thay vì 0W để hết dao động 0-300W.",
      1
     ],
     [
      "Cài <b>Time of Use</b> (thường 6 khung giờ): giờ, công suất, SOC mục tiêu từng khung; bật/tắt Grid Charge. Cần bật Time of Use thì pin mới dùng theo khung giờ ở một số chế độ; muốn xả/bán đỉnh phải tắt Peak Shaving (Flow Power, Úc).",
      1
     ],
     [
      "Không muốn sạc từ lưới thì bỏ tích Grid Charge. Chọn <b>Grid Standard / Grid Code</b> theo điện lực địa phương.",
      1
     ],
     [
      "Thử chuyển dự phòng: ngắt lưới và xem tải backup có tiếp tục cấp điện; kiểm tra pin sạc/xả, giờ máy và thông tin CT.",
      0
     ],
     [
      "Cắm Stick Logger, cấu hình Wi-Fi qua SOLARMAN (trong app có thể chỉnh System Work Mode/Time of Use).",
      1
     ]
    ],
    "tips": [
     "Pin có dòng ngắn mạch rất lớn: dùng cáp, cầu chì/CB DC đúng cỡ, đúng cực tính; không đấu hoặc ngắt pin khi máy đang tải nặng.",
     "Giao thức BMS (CAN/RS485) sai thường khiến máy bị giới hạn dòng sạc/xả hoặc báo lỗi pin: đối chiếu bảng tương thích pin và phiên bản firmware.",
     "Chiều CT, tải backup quá công suất ngõ ra, và cài sai chế độ làm việc là các lỗi hay gặp. Luôn theo sách hướng dẫn model và quy định điện lực địa phương.",
     "Theo kinh nghiệm người dùng SG04LP3: ở chế độ lithium CAN, máy có thể tự sạc từ lưới khi SOC thấp (khoảng 10% trở xuống) bất kể tuỳ chọn Grid Charge; và Zero Export chỉ điều tiết xả pin tự động chứ không chặn sạc pin từ lưới. Chỉ từ diễn đàn, tuỳ firmware, hãy tự thử.",
     "Chữ 'Zero Export To CT' trong sách có thể gây hiểu nhầm: CT đặt phía lưới (điểm đấu lưới), không phải phía pin (theo một người dùng).",
     "Mật khẩu menu và địa chỉ mặc định: không tìm thấy nguồn xác nhận trong lần tra cứu này, hãy xem sách hướng dẫn model và đổi mật khẩu sau khi cài."
    ],
    "tables": [
     {
      "t": "SUN-12K-SG04LP3-EU (số từ nhà bán, chưa đối chiếu datasheet hãng)",
      "c": [
       "Thông số",
       "Giá trị",
       "Ghi chú"
      ],
      "r": [
       [
        "Số MPPT",
        "2, mỗi MPPT 2 string",
        "nhà bán"
       ],
       [
        "Điện áp DC tối đa",
        "800 V",
        "nhà bán; một nguồn khác ghi dải 160-800 V"
       ],
       [
        "Dòng DC tối đa",
        "39 A hoặc 51 A",
        "nguồn lệch nhau; xem sách"
       ],
       [
        "Dải điện áp pin",
        "40-60 V",
        "pin thấp áp 48V"
       ],
       [
        "Dòng sạc/xả tối đa",
        "240 A",
        "nhà bán"
       ],
       [
        "CB AC và tiết diện dây",
        "tuỳ model",
        "xem sách"
       ]
      ]
     },
     {
      "t": "Ngưỡng pin tham khảo (Shutdown / Low Batt / Restart)",
      "c": [
       "Nguồn",
       "Shutdown",
       "Low Batt",
       "Restart"
      ],
      "r": [
       [
        "Diễn đàn (pin Hubble)",
        "20%",
        "35%",
        "50%"
       ],
       [
        "Nhà lắp đặt Pháp",
        "15-20%",
        "20-25%",
        "30-40%"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "F13",
      "m": "Xuất hiện khi đổi loại lưới/tần số hoặc đặt pin 'No battery'; có người gặp sau khi đổi master/slave",
      "x": "Thường tự hết; nếu không, tắt DC+AC 1 phút rồi bật lại.",
      "v": 1
     },
     {
      "c": "F18",
      "m": "Quá dòng AC, hay gặp khi nhiều tải cảm kháng khởi động cùng lúc",
      "x": "Khởi động tải lần lượt, giảm tải; tuỳ model/firmware, xem sách.",
      "v": 1
     },
     {
      "c": "F23",
      "m": "Liên quan tiếp địa / dòng rò",
      "x": "Kiểm tra tiếp địa và cách điện; tuỳ model/firmware, xem sách.",
      "v": 1
     },
     {
      "c": "F58",
      "m": "Mất giao tiếp BMS (lithium)",
      "x": "Kiểm tra cáp CAN/RS485 đúng chân, Mode pin, pin trong danh sách tương thích.",
      "v": 1
     },
     {
      "c": "W31",
      "m": "Cảnh báo lỗi giao tiếp pin (Battery comm warn)",
      "x": "Thay/kiểm tra cáp CAN đúng chuẩn, kiểm tra cài đặt BMS.",
      "v": 1
     },
     {
      "c": "F31",
      "m": "Gặp khi chạy song song; người dùng nói thường tự hết sau vài phút",
      "x": "Kiểm tra pha/song song; có ca khỏi sau cập nhật firmware. Tuỳ firmware.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Xác nhận đúng biến thể model và sách hướng dẫn",
      "Mọi CB (AC, DC, pin) đang OFF; tiếp địa nối chắc",
      "Cực tính pin đúng, có cầu chì/CB DC đúng cỡ",
      "Cổng GRID, LOAD, GEN đấu đúng chức năng; không đấu tải thường vào GEN",
      "CT/đồng hồ đúng chiều mũi tên về phía lưới",
      "Cáp CAN/RS485 giữa pin và biến tần đúng chân (nếu pin lithium)",
      "Voc string nhỏ hơn giới hạn DC tối đa"
     ],
     "sau_khi_bat": [
      "Bật nguồn theo thứ tự sách (thường pin, PV, lưới)",
      "Battery Setup: loại pin, Mode, Max A Charge/Discharge, Shutdown/Low Batt/Restart",
      "Chọn System Work Mode và Time of Use đúng mục đích",
      "Kiểm tra không có F58/W31/F13/F23",
      "Thử ngắt lưới: tải backup vẫn cấp điện",
      "Kiểm tra số liệu CT hợp lý (không âm, không dao động)"
     ],
     "ban_giao": [
      "Grid Standard/Grid Code theo điện lực, ghi lại",
      "Nếu cấm phát lưới: xác nhận không bán điện (Selling First/Solar Sell tắt)",
      "Stick Logger lên SOLARMAN, khách có tài khoản",
      "Ghi cấu hình ngưỡng pin, Work Mode, ToU",
      "Mật khẩu menu/app đã đổi khỏi mặc định",
      "Hướng dẫn khách quy trình tắt máy an toàn"
     ]
    }
   },
   "offgrid": {
    "model": "Deye không có dòng off-grid thuần trong tài liệu tôi đã tìm thấy; dùng hybrid SUN-xK-SG0x ở chế độ không nối lưới (cổng GRID để trống hoặc dùng máy phát qua cổng GEN)",
    "steps": [
     [
      "Xác nhận trong sách đúng model rằng hybrid được vận hành <b>không có lưới</b>, và thông số ngõ ra (điện áp, tần số, công suất) ở chế độ backup.",
      1
     ],
     [
      "Tài liệu lắp đặt Deye (đoạn trích tìm kiếm) nêu hệ thống hoàn toàn off-grid không bắt buộc CT/đồng hồ cho điều khiển zero export.",
      1
     ],
     [
      "Tính công suất tải và dòng khởi động tải cảm kháng (động cơ, máy lạnh, bơm) để chọn công suất biến tần và dung lượng pin có dự phòng.",
      1
     ],
     [
      "Kiểm tra Voc string và dòng MPPT như hybrid. Nhiều tải cảm kháng khởi động cùng lúc có thể gây F18 (theo người dùng).",
      1
     ],
     [
      "Tắt mọi CB; đấu tiếp địa, pin (đúng cực, có cầu chì/CB DC) và PV.",
      0
     ],
     [
      "Đấu tải vào cổng <b>LOAD</b> (ngõ ra backup). Cổng GRID để hở, không cấp điện lưới.",
      0
     ],
     [
      "Chỉ nối máy phát vào cổng <b>GEN</b> nếu model có.",
      0
     ],
     [
      "Pin lithium có BMS: nối CAN/RS485 và chọn Lithium với Mode tương ứng (SG04LP3: người dùng báo Mode 00 cho CAN).",
      1
     ],
     [
      "Pin chì-axit: đặt loại pin, dung lượng, dòng sạc theo nhà sản xuất pin.",
      1
     ],
     [
      "Bật nguồn: cấp pin trước, sau đó PV (thứ tự chính xác tuỳ model/firmware, xem sách).",
      0
     ],
     [
      "Đóng tải từng nhóm một để tránh sụt áp ngõ ra do khởi động đồng thời.",
      0
     ],
     [
      "Trong <b>Battery Setup</b> đặt <b>Shutdown / Low Batt / Restart</b> (Shutdown nhỏ hơn Low Batt) để tránh xả sâu khi không có lưới.",
      1
     ],
     [
      "Restart cách Shutdown ít nhất khoảng 15-20% (nhà lắp đặt Pháp). Ví dụ diễn đàn: 20/35/50%.",
      1
     ],
     [
      "Cách người dùng mô phỏng ưu tiên PV-pin-tải khi không có lưới: System Work Mode <b>Zero Export To Load</b> và trong Time of Use đặt SOC tối thiểu mỗi khung theo giới hạn nhà sản xuất pin. Ý kiến cá nhân, tuỳ firmware.",
      1
     ],
     [
      "Nếu có máy phát: cấu hình cổng GEN (công suất máy phát tối đa, ngưỡng tự khởi động theo điện áp/SOC nếu model hỗ trợ); máy phát phải đủ công suất cho tải cộng sạc pin.",
      1
     ],
     [
      "Smart Load: người dùng dùng cổng GEN cho tải không thiết yếu (đặt Power trong menu Gen Port, cần Zero Export To CT). Hiểu biết cá nhân, xác nhận với sách.",
      1
     ],
     [
      "Kiểm tra vận hành: tải ổn định, điện áp và tần số ngõ ra đúng, pin sạc từ PV.",
      1
     ],
     [
      "Giám sát từ xa qua Stick Logger và SOLARMAN.",
      1
     ]
    ],
    "tips": [
     "Không có lưới nên tải phải nằm trong công suất ngõ ra của biến tần; quá tải hoặc khởi động động cơ lớn có thể làm máy ngắt.",
     "Cách dùng hybrid ở chế độ không nối lưới và các giới hạn bảo hành cần được xác nhận với Deye hoặc nhà phân phối và sách hướng dẫn model.",
     "Dải điện áp lưới trong Grid Setup quyết định khi nào máy tách lưới và chạy bằng PV/pin (theo người dùng); đừng nới dải này để 'cố bám lưới yếu' khi chưa có hướng dẫn của điện lực."
    ],
    "tables": [
     {
      "t": "Ngưỡng pin tham khảo khi không có lưới",
      "c": [
       "Nguồn",
       "Shutdown",
       "Low Batt",
       "Restart"
      ],
      "r": [
       [
        "Diễn đàn (pin Hubble)",
        "20%",
        "35%",
        "50%"
       ],
       [
        "Nhà lắp đặt Pháp",
        "15-20%",
        "20-25%",
        "30-40%"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "F18",
      "m": "Quá dòng AC khi nhiều tải cảm kháng khởi động cùng lúc",
      "x": "Khởi động tải lần lượt, giảm tải.",
      "v": 1
     },
     {
      "c": "F58",
      "m": "Mất giao tiếp BMS",
      "x": "Kiểm tra cáp CAN/RS485, Mode pin.",
      "v": 1
     },
     {
      "c": "W31",
      "m": "Cảnh báo lỗi giao tiếp pin",
      "x": "Kiểm tra cáp CAN đúng chuẩn.",
      "v": 1
     },
     {
      "c": "F13",
      "m": "Khi đổi loại lưới/tần số hoặc đặt pin 'No battery'",
      "x": "Thường tự hết; nếu không, tắt DC+AC 1 phút rồi bật lại.",
      "v": 1
     },
     {
      "c": "F23",
      "m": "Liên quan tiếp địa / dòng rò",
      "x": "Kiểm tra tiếp địa; tuỳ model/firmware, xem sách.",
      "v": 1
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Sách model xác nhận được chạy không lưới",
      "Tổng công suất tải và dòng khởi động nằm trong khả năng máy",
      "Pin đúng cực, cầu chì/CB DC đúng cỡ",
      "Tải đấu vào LOAD; GRID để hở",
      "Cáp CAN/RS485 pin đúng (nếu lithium)",
      "Máy phát đấu cổng GEN đúng (nếu có)"
     ],
     "sau_khi_bat": [
      "Bật pin rồi PV, đóng tải từng nhóm",
      "Battery Setup: loại pin, Mode, Shutdown/Low Batt/Restart",
      "Kiểm tra điện áp, tần số ngõ ra",
      "Kiểm tra pin sạc từ PV ban ngày",
      "Thử khởi động tải cảm kháng lớn, không báo F18",
      "Thử máy phát/Smart Load nếu có"
     ],
     "ban_giao": [
      "Ghi công suất tải tối đa cho phép",
      "Ghi ngưỡng pin đã đặt",
      "Hướng dẫn khách đóng tải từng nhóm khi khởi động lại",
      "Stick Logger lên SOLARMAN",
      "Xác nhận điều kiện bảo hành khi dùng hybrid không lưới với nhà phân phối"
     ]
    }
   }
  },
  "missing": "Các trang chính hãng (deyeinverter.com) và các mirror sách hướng dẫn bị chặn truy cập, nên chưa đọc được nội dung sách hướng dẫn. Lần bổ sung này cũng không đọc được trang diễn đàn nào (powerforum.co.za, akkudoktor.net, solar-assistant.io, wattuneed.com, flowpower.com.au đều bị chặn khi WebFetch); mọi thông tin bổ sung chỉ từ đoạn trích kết quả tìm kiếm, nên v=1 mới mang nghĩa 'có người dùng/nhà bán xác nhận', không phải đối chiếu tài liệu gốc. Không tìm thấy nguồn tiếng Việt, không thấy mật khẩu mặc định, không xác nhận được F64. Dòng string SUN-xK-G gần như chưa có nguồn không chính thức. Deye không có dòng off-grid thuần trong nguồn đã tìm thấy: phần off-grid dùng hybrid ở chế độ không nối lưới."
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
      "Xác định đúng model (LXP-LB-EU 8-10K, 12K, GEN-LB-EU 3-6K hoặc 7-10K) và mở sách hướng dẫn của model đó, vì giá trị khác nhau theo model.",
      1
     ],
     [
      "Đọc trong datasheet: <b>điện áp DC tối đa</b>, dải MPPT, dòng tối đa mỗi MPPT và công suất DC tối đa. LXP-LB-EU 10K có 2 MPPT, công suất DC tối đa 15 kW theo trang bán hàng.",
      1
     ],
     [
      "Tính <b>Voc chuỗi ở nhiệt độ thấp nhất</b> và đảm bảo không vượt điện áp DC tối đa của biến tần.",
      0
     ],
     [
      "Kiểm tra dòng Isc từng chuỗi không vượt dòng cho phép của cổng MPPT, và tỷ lệ DC/AC theo khuyến nghị hãng (tuỳ model, xem sách).",
      0
     ],
     [
      "Chọn pin điện áp danh định <b>48V (51.2V)</b>; chọn cầu dao DC và cáp pin theo dòng sạc/xả tối đa của model (tuỳ model, xem sách).",
      0
     ],
     [
      "Tiếp địa vỏ biến tần trước khi đấu các cổng khác.",
      0
     ],
     [
      "Đấu nguồn lưới vào cổng GRID và tải dự phòng vào cổng EPS/Backup (nếu dùng), đúng nhãn cổng trong sách. Kiểm tra cực tính bằng đồng hồ trước khi đóng.",
      0
     ],
     [
      "Đấu cáp pin rồi cáp PV. Thứ tự đóng thường là pin, rồi PV, rồi AC; ngắt thì ngược lại. Làm đúng thứ tự trong sách của model.",
      0
     ],
     [
      "Với pin lithium có giao tiếp, đấu cáp truyền thông vào cổng pin dạng <b>RJ45 hỗ trợ CAN và RS485</b> (ví dụ 8-10K EU: CAN H chân 4, CAN L chân 5; tuỳ model, kiểm tra sơ đồ chân trong sách). Cáp bán kèm pin của hãng khác đôi khi sai sơ đồ chân so với firmware mới (theo diễn đàn), hãy đối chiếu.",
      1
     ],
     [
      "Cấp nguồn LCD, rồi vào <b>Settings → Advanced</b> (menu Advanced settings) → mục <b>Battery</b>. Nếu máy hỏi mật khẩu khi chọn hãng pin, một hướng dẫn của nhà phân phối ghi <b>00000</b> (nguồn không chính hãng, tuỳ firmware; nên đổi nếu có thể).",
      1
     ],
     [
      "Tại mục Battery, chọn <b>Battery Type → Lithium</b>. Pin Luxpower: brand số 6 (Luxpower); pin Hina: brand số 1. Pin Pytes E-Box theo hướng dẫn nhà phân phối: Lithium brand <b>Lithium_0 (Standard)</b>.",
      1
     ],
     [
      "Nếu pin lithium không nằm trong danh sách tương thích hoặc không giao tiếp được, sách cho phép chọn <b>Lead-acid</b> và nhập dung lượng Ah, rồi tự đặt giới hạn sạc/xả theo pin.",
      1
     ],
     [
      "Nếu chạy song song nhiều biến tần, gạt công tắc DIP điện trở cân bằng CAN (2 bit) sang ON chỉ ở biến tần đầu và cuối của chuỗi nối. Các biến tần ở giữa để OFF.",
      1
     ],
     [
      "Cài datalogger WiFi/LAN và tạo tài khoản trên cổng giám sát LuxPower (monitor.luxpowertek.com) để cấu hình từ xa.",
      0
     ],
     [
      "Trên cổng giám sát, đặt <b>chuẩn lưới/Grid Regulation</b>, giới hạn sạc/xả, SOC/điện áp ngắt xả và chế độ làm việc (ưu tiên tải, ưu tiên sạc pin, theo giờ). Tên mục chính xác có thể đổi theo phiên bản giao diện.",
      0
     ],
     [
      "Với giới hạn xuất lưới, sách hướng dẫn giám sát của hãng (bản US 12K) có tuỳ chọn <b>Charge Last</b>: PV cấp tải trước, rồi bán lưới, chỉ sạc pin khi công suất xuất lưới đạt giới hạn. Kiểm tra bản EU có tuỳ chọn tương ứng không và quy định điện lực địa phương về chống chảy ngược.",
      1
     ],
     [
      "Chạy thử: biến tần lên lưới, pin sạc/xả đúng, chuyển sang EPS khi cắt lưới, dữ liệu hiện trên web giám sát. Ghi lại mã lỗi (nếu có) và đối chiếu bảng xử lý sự cố trong sách.",
      0
     ]
    ],
    "tips": [
     "Luôn làm theo sách hướng dẫn đúng model, đúng phiên bản firmware và quy định của điện lực địa phương. Giao diện giám sát và tên mục có thể thay đổi giữa các bản.",
     "Pin lithium không giao tiếp được (sai cáp CAN/RS485 hoặc sai brand) là lỗi hay gặp. Kiểm tra cáp và lựa chọn brand trước khi chuyển sang chế độ Lead-acid.",
     "Cắt cả AC, PV và pin và chờ tụ xả điện trước khi mở nắp biến tần.",
     "Mật khẩu 00000 chỉ là thông tin từ hướng dẫn nhà phân phối, không phải sách hãng; luôn đổi mật khẩu."
    ],
    "tables": [
     {
      "t": "Chọn pin trên LCD (Advanced → Battery)",
      "c": [
       "Pin",
       "Battery Type",
       "Brand",
       "Nguồn"
      ],
      "r": [
       [
        "Luxpower",
        "Lithium",
        "6",
        "Sách hãng"
       ],
       [
        "Hina",
        "Lithium",
        "1",
        "Sách hãng"
       ],
       [
        "Pytes E-Box",
        "Lithium",
        "Lithium_0 (Standard)",
        "Nhà phân phối"
       ],
       [
        "Không tương thích/không giao tiếp",
        "Lead-acid",
        "Nhập Ah",
        "Sách hãng"
       ]
      ]
     },
     {
      "t": "Thông số tham khảo",
      "c": [
       "Hạng mục",
       "Giá trị",
       "Ghi chú"
      ],
      "r": [
       [
        "LXP-LB-EU 10K: số MPPT",
        "2",
        "Trang bán hàng"
       ],
       [
        "LXP-LB-EU 10K: DC tối đa",
        "15 kW",
        "Trang bán hàng"
       ],
       [
        "Điện áp pin danh định",
        "48V (51.2V)",
        "Mọi model"
       ],
       [
        "Điện áp DC tối đa, dòng MPPT",
        "Tuỳ model",
        "Xem sách"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "W000",
      "m": "Mất giao tiếp với pin (battery communication fault); sách SNA/LXP ghi là cảnh báo",
      "x": "Kiểm tra cáp CAN/RS485 và sơ đồ chân, chọn đúng brand pin, kiểm tra DIP của pin/BMS; nếu pin không tương thích thì dùng Lead-acid.",
      "v": 1
     },
     {
      "c": "E001",
      "m": "Model fault 1; nguồn bên thứ ba liên hệ với cáp CAN song song sai hoặc công tắc điện trở cân bằng sai vị trí",
      "x": "Khi chạy song song kiểm tra cáp CAN và DIP (chỉ đầu và cuối chuỗi để ON); khởi động lại, liên hệ hãng nếu còn.",
      "v": 1
     },
     {
      "c": "E016",
      "m": "Lỗi relay (theo hướng dẫn không chính hãng)",
      "x": "Tắt hoàn toàn, khởi động lại; nếu còn lỗi liên hệ kỹ thuật, không tự mở máy. Tuỳ model/firmware, xem sách.",
      "v": 0
     },
     {
      "c": "E031",
      "m": "Lỗi giao tiếp nội bộ 4 (theo hướng dẫn không chính hãng)",
      "x": "Khởi động lại; nếu còn lỗi liên hệ nhà phân phối. Tuỳ model/firmware, xem sách.",
      "v": 0
     },
     {
      "c": "28",
      "m": "EPS Load High (tải EPS quá cao), báo cáo trên diễn đàn khi mất lưới ban ngày lúc tải vượt công suất PV",
      "x": "Giảm tải EPS, chia nhóm tải; tuỳ model/firmware, xem sách.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Đúng model, sách hướng dẫn và firmware; datasheet DC đã đối chiếu",
      "Voc chuỗi ở nhiệt độ thấp nhất nhỏ hơn điện áp DC tối đa; cực tính PV và pin đã đo",
      "Tiếp địa vỏ biến tần chắc chắn",
      "Cầu dao DC pin, PV và AC đúng dòng, đang ở vị trí OFF",
      "Cáp CAN/RS485 pin đúng sơ đồ chân; DIP CAN đặt đúng (song song)",
      "Đã xác nhận chuẩn lưới/giới hạn xuất lưới theo điện lực địa phương"
     ],
     "sau_khi_bat": [
      "Thứ tự bật: pin, rồi PV, rồi AC (hoặc theo sách model)",
      "LCD không hiện lỗi; không có cảnh báo W000 (giao tiếp pin)",
      "Đã chọn đúng loại pin và brand trong Advanced → Battery; đã đổi mật khẩu nếu có",
      "Điện áp PV, dòng sạc/xả và SOC hiển thị hợp lý",
      "Thử mất lưới: chuyển EPS/backup đúng, tải ổn định",
      "Datalogger lên cổng giám sát LuxPower, dữ liệu cập nhật"
     ],
     "ban_giao": [
      "Ghi model, số serial, firmware và loại/brand pin đã chọn",
      "Chụp màn hình các thông số Advanced đã cài",
      "Bàn giao tài khoản giám sát LuxPower, hướng dẫn đổi mật khẩu",
      "Hướng dẫn khách quy trình tắt/bật an toàn và nhận biết cảnh báo",
      "Lưu bảng mã lỗi và liên hệ nhà phân phối/bảo hành"
     ]
    }
   },
   "offgrid": {
    "model": "LuxPower SNA 3000-6000 (SNA3000/5000/6000), SNA 12K (off-grid 1 pha, có thể chạy backup/tự dùng)",
    "steps": [
     [
      "Xác định đúng model SNA (3000/5000/6000 hoặc SNA 12K) và mở sách tương ứng. Tên menu LCD và thông số khác nhau giữa SNA 3-6K và SNA 12K.",
      1
     ],
     [
      "Theo sách SNA 3-6K, máy có <b>2 bộ MPPT, dải MPPT 120V~385V</b>. Đối chiếu thêm điện áp DC tối đa và dòng tối đa mỗi MPPT trong datasheet.",
      1
     ],
     [
      "Tính Voc chuỗi ở nhiệt độ thấp nhất để không vượt điện áp DC tối đa, và chọn số tấm sao cho điện áp làm việc nằm trong dải MPPT.",
      0
     ],
     [
      "Chọn công suất PV và tải phù hợp công suất biến tần; chọn cầu dao và cáp pin theo dòng tối đa của model (tuỳ model, xem sách).",
      0
     ],
     [
      "Tiếp địa vỏ máy trước khi đấu các cổng khác.",
      0
     ],
     [
      "Đấu cáp pin trước (kiểm tra cực tính bằng đồng hồ), sau đó PV, rồi các ngõ AC. Làm đúng thứ tự trong sách.",
      0
     ],
     [
      "Máy có <b>cổng riêng cho máy phát</b> (điều khiển máy phát từ xa được) và hỗ trợ <b>CAN/RS485</b> để giao tiếp BMS pin lithium. Đấu cáp BMS và máy phát theo sơ đồ chân trong sách.",
      1
     ],
     [
      "Trên LCD vào <b>Settings → Advanced → Battery</b> (theo hướng dẫn nhà phân phối cho dòng LuxPower; xác nhận lại menu trên SNA). Mật khẩu nếu được hỏi: <b>00000</b> theo nguồn không chính hãng, tuỳ firmware.",
      0
     ],
     [
      "Chọn loại pin: lithium có BMS (Lithium) hoặc <b>Lead-acid</b> kèm dung lượng Ah. Với lithium, chọn đúng <b>brand/protocol</b> của pin (diễn đàn ghi mỗi hãng pin một số khác nhau, ví dụ 21, 4; tra danh sách tương thích của hãng).",
      0
     ],
     [
      "Nếu pin lithium không tương thích, nhà phân phối khuyến nghị lập trình như pin lead-acid và tự đặt giới hạn sạc/xả theo nhà sản xuất pin.",
      1
     ],
     [
      "Cài điện áp và tần số ngõ ra (thường 230V/50Hz tại Việt Nam) và nguồn ưu tiên (PV, pin, lưới/máy phát). Tên mục thay đổi theo model, xem sách.",
      0
     ],
     [
      "Cài ngưỡng điện áp/SOC ngắt xả và ngưỡng khởi động máy phát.",
      0
     ],
     [
      "Thứ tự khởi động thường là: đóng pin, bật biến tần, đóng PV, rồi đóng tải từng nhóm. Không khởi động mọi tải cùng lúc để tránh sụt áp pin và quá tải.",
      0
     ],
     [
      "Máy hỗ trợ <b>chạy song song</b> (sách ghi tối đa 16 máy). Nếu song song, thực hiện đúng quy trình đấu cáp và cài đặt trong sách.",
      1
     ],
     [
      "Chạy thử: kiểm tra điện áp ngõ ra, sạc PV, chuyển nguồn sang máy phát và tải có ổn định. Kết nối datalogger lên cổng giám sát LuxPower nếu model hỗ trợ.",
      0
     ]
    ],
    "tips": [
     "Làm theo sách hướng dẫn đúng model SNA và các quy định an toàn điện của địa phương. Tên menu LCD và thông số khác nhau giữa SNA 3-6K và SNA 12K.",
     "Không đấu ngược cực pin, không để tải khởi động lớn (động cơ, máy nén) vượt khả năng quá tải của máy."
    ],
    "tables": [
     {
      "t": "Thông số SNA (theo sách)",
      "c": [
       "Hạng mục",
       "Giá trị",
       "Ghi chú"
      ],
      "r": [
       [
        "SNA 3-6K: số MPPT",
        "2",
        "Sách SNA 3-6K"
       ],
       [
        "SNA 3-6K: dải MPPT",
        "120V~385V",
        "Sách SNA 3-6K"
       ],
       [
        "Chạy song song tối đa",
        "16 máy",
        "Sách"
       ],
       [
        "DC tối đa, dòng MPPT, cầu dao",
        "Tuỳ model",
        "Xem sách"
       ]
      ]
     }
    ],
    "errors": [
     {
      "c": "W000",
      "m": "Mất giao tiếp với pin (battery communication fault); sách SNA/LXP ghi là cảnh báo",
      "x": "Kiểm tra cáp CAN/RS485 và sơ đồ chân, chọn đúng brand pin, kiểm tra DIP của pin/BMS; nếu pin không tương thích thì dùng Lead-acid.",
      "v": 1
     },
     {
      "c": "E001",
      "m": "Model fault 1; nguồn bên thứ ba liên hệ với cáp CAN song song sai hoặc công tắc điện trở cân bằng sai vị trí",
      "x": "Khi chạy song song kiểm tra cáp CAN và DIP (chỉ đầu và cuối chuỗi để ON); khởi động lại, liên hệ hãng nếu còn.",
      "v": 1
     },
     {
      "c": "E016",
      "m": "Lỗi relay (theo hướng dẫn không chính hãng)",
      "x": "Tắt hoàn toàn, khởi động lại; nếu còn lỗi liên hệ kỹ thuật, không tự mở máy. Tuỳ model/firmware, xem sách.",
      "v": 0
     },
     {
      "c": "E031",
      "m": "Lỗi giao tiếp nội bộ 4 (theo hướng dẫn không chính hãng)",
      "x": "Khởi động lại; nếu còn lỗi liên hệ nhà phân phối. Tuỳ model/firmware, xem sách.",
      "v": 0
     },
     {
      "c": "28",
      "m": "EPS Load High (tải EPS quá cao), báo cáo trên diễn đàn khi mất lưới ban ngày lúc tải vượt công suất PV",
      "x": "Giảm tải EPS, chia nhóm tải; tuỳ model/firmware, xem sách.",
      "v": 0
     }
    ],
    "check": {
     "truoc_khi_bat": [
      "Đúng model, sách hướng dẫn và firmware; datasheet DC đã đối chiếu",
      "Voc chuỗi ở nhiệt độ thấp nhất nhỏ hơn điện áp DC tối đa; cực tính PV và pin đã đo",
      "Tiếp địa vỏ biến tần chắc chắn",
      "Cầu dao DC pin, PV và AC đúng dòng, đang ở vị trí OFF",
      "Cáp CAN/RS485 pin đúng sơ đồ chân; DIP CAN đặt đúng (song song)",
      "Đã kiểm tra cổng và điều khiển máy phát (nếu dùng)"
     ],
     "sau_khi_bat": [
      "Thứ tự bật: pin, rồi PV, rồi AC (hoặc theo sách model)",
      "LCD không hiện lỗi; không có cảnh báo W000 (giao tiếp pin)",
      "Đã chọn đúng loại pin và brand trong Advanced → Battery; đã đổi mật khẩu nếu có",
      "Điện áp PV, dòng sạc/xả và SOC hiển thị hợp lý",
      "Thử mất lưới: chuyển EPS/backup đúng, tải ổn định",
      "Datalogger lên cổng giám sát LuxPower, dữ liệu cập nhật"
     ],
     "ban_giao": [
      "Ghi model, số serial, firmware và loại/brand pin đã chọn",
      "Chụp màn hình các thông số Advanced đã cài",
      "Bàn giao tài khoản giám sát LuxPower, hướng dẫn đổi mật khẩu",
      "Hướng dẫn khách quy trình tắt/bật an toàn và nhận biết cảnh báo",
      "Lưu bảng mã lỗi và liên hệ nhà phân phối/bảo hành"
     ]
    }
   }
  },
  "missing": "Không truy cập được trực tiếp các file PDF hướng dẫn (luxpowertek.com và các trang lưu trữ bị chặn); nội dung v=1 chỉ lấy từ đoạn trích kết quả tìm kiếm của sách hướng dẫn chính hãng/nhà phân phối. Chưa tìm thấy dòng biến tần hòa lưới thuần (on-grid không pin) của LuxPower nên grid=null; LuxPower tập trung hybrid (LXP/GEN-LB) và off-grid (SNA). Chưa xác minh tên mục chính xác trên web giám sát, mật khẩu mặc định hay địa chỉ IP nên không ghi. Bổ sung: mật khẩu 00000, đường dẫn Settings → Advanced → Battery và Lithium_0 từ hướng dẫn nhà phân phối (solarpowerstore.ca); W000 từ kết quả tìm kiếm sách/FAQ hãng; E016, E031, 28 từ nguồn không chính hãng/diễn đàn nên v=0. Bảng mã lỗi đầy đủ chưa truy cập được, xem sách."
 },
 {
  "id": "sernergy",
  "name": "Senergy",
  "color": "#2E7D32",
  "badge": "SE",
  "app": "Hãng: Shenzhen Senergy Technology (APD Senergy, Thâm Quyến) · Cấu hình bằng app Senergy chính hãng (theo gợi ý của SolarAssistant)",
  "types": {},
  "missing": "Chưa có sách hướng dẫn công khai truy cập được (senergytec.com bị chặn), nên chưa soạn các bước để tránh sai. Dòng máy đã thấy: hòa lưới SE-xKTL; hybrid SE 5-10KHB-D3P, SE 8/10KHB-T/EU, SE-15KTL-G2P (split-phase); off-grid 6 kW (tối đa 12 máy song song). Xem tem máy và sách hướng dẫn kèm theo, hoặc hỏi nhà phân phối (ví dụ Gigawatt Energy, Đan Khuê Solar); gửi sách/model để bổ sung."
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
