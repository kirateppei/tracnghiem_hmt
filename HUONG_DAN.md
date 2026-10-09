# Trắc nghiệm ĐMT — hướng dẫn đưa lên mạng

- Thư mục `docs/` là trang web. File `firestore.rules` là luật bảo vệ dữ liệu.
- Đăng nhập bằng **Google**. Mặc định **mọi tài khoản Google đều vào được**; quản trị viên có thể chuyển sang "chỉ email trong danh sách" bất cứ lúc nào (tab **👥 Tài khoản**).
- Kết quả làm bài lưu trực tuyến nên bảng xếp hạng dùng chung (Ngày / Tuần / Tháng / Năm).
- Địa chỉ trang sau khi bật GitHub Pages: `https://kirateppei.github.io/tracnghiem_hmt/`

Làm một lần, khoảng 30 phút, theo thứ tự 0 → 7.

## 0. Chuyển repo sang công khai và bật GitHub Pages
1. GitHub → repo `tracnghiem_hmt` → **Settings → General** → kéo xuống **Danger Zone → Change repository visibility → Make public** → gõ tên repo để xác nhận.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch** → Branch: `trang-web`, thư mục `/docs` → **Save**.
3. Sau 1–2 phút trang chạy tại địa chỉ ở trên. Sửa file trên GitHub xong thì chờ 1–10 phút mới thấy bản mới.

Repo công khai nghĩa là **mọi file ai cũng xem được**, kể cả bộ câu hỏi và đáp án (`docs/questions.js`). Repo không chứa mật khẩu hay email cá nhân.

## 1. Tạo dự án Firebase
Vào <https://console.firebase.google.com>, đăng nhập bằng tài khoản Google quản trị → **Add project** → đặt tên (ví dụ `hmt-trac-nghiem`) → tắt Google Analytics → **Create project**.

## 2. Bật đăng nhập Google
**Build → Authentication → Get started → Sign-in method → Google → Enable** → chọn email hỗ trợ (email của bạn) → **Save**.

## 3. Tạo Firestore và dán luật
1. **Build → Firestore Database → Create database** → vị trí `asia-southeast1 (Singapore)` → **Production mode** → **Create**.
2. Tab **Rules** → xoá nội dung cũ → dán toàn bộ file `firestore.rules` → **Publish**.

## 4. Tạo hồ sơ quản trị viên đầu tiên (làm tay một lần)
Quyền quản trị lưu trong dữ liệu, nên hồ sơ đầu tiên phải tạo trong Firebase Console:

**Firestore Database → Data → Start collection** → Collection ID: `allowed` → Document ID: **email quản trị của bạn, viết thường** (ví dụ `ten@gmail.com`) → thêm 3 trường:

| Field | Type | Value |
|---|---|---|
| `role` | string | `admin` |
| `active` | boolean | `true` |
| `name` | string | tên hiển thị (để trống cũng được) |

→ **Save**. Các quản trị viên khác sau này đặt trong tab Tài khoản của phần mềm.

## 5. Đăng ký ứng dụng web và điền cấu hình
**Project settings (⚙) → Your apps → biểu tượng `</>` (Web)** → đặt tên → **Register app** (không cần bật Hosting) → sao chép khối `firebaseConfig`.

Trên GitHub mở `docs/firebase-config.js` → biểu tượng bút chì → thay 6 giá trị `DIEN_...` → **Commit changes** (commit thẳng vào nhánh `trang-web`). Đây không phải mật khẩu nên để công khai là bình thường; an toàn nằm ở luật Firestore.

## 6. Cho phép tên miền đăng nhập
**Firebase → Authentication → Settings → Authorized domains → Add domain** → `kirateppei.github.io` (chỉ tên miền, không kèm đường dẫn).

## 7. Dùng thử rồi mời mọi người
1. Mở trang bằng **Chrome hoặc Safari** (đừng mở trong Zalo hoặc Messenger, Google chặn đăng nhập ở đó) → **Đăng nhập bằng Google** bằng email quản trị. Bạn sẽ thấy tab **👥 Tài khoản** và **Thêm câu**.
2. Thử bằng một tài khoản Google khác để chắc nhân viên vào được.
3. Gửi link cho nhân viên. Ai có tài khoản Google đều vào được; tên trên bảng xếp hạng là tên Google (hoặc tên bạn đặt trong tab Tài khoản).

## Quản lý quyền truy cập
Tab **👥 Tài khoản → Ai được vào làm bài?**
- **Mọi tài khoản Google** (mặc định): ai cũng vào được, trừ email bị **Khoá**.
- **Chỉ email trong danh sách**: dán email nhân viên (mỗi dòng một email) rồi **Thêm vào danh sách**; người ngoài đăng nhập Google được nhưng không vào được phần mềm.
- Mỗi dòng có: sửa tên hiển thị, đổi vai trò (Nhân viên / Quản trị viên), **Khoá**, **Xoá**.

Nếu thấy người lạ làm bài: chuyển sang "Chỉ email trong danh sách", hoặc khoá email đó, hoặc vào Firebase → Authentication → Users → **Disable account**. Lượt làm bài lạ xoá được trong bảng xếp hạng (bấm tên → 🗑).

## Bảng xếp hạng
- Chọn **Ngày / Tuần / Tháng / Năm**; nút ‹ › xem kỳ trước hoặc kỳ sau; tuần tính từ thứ Hai đến Chủ nhật.
- Mỗi người hiện **số bài, điểm trung bình (%), điểm cao nhất (%)**. Xếp theo Trung bình, Cao nhất hoặc Số bài.
- **Độ khó:** chọn Tất cả / Dễ / Trung bình / Khó / Cực khó / Xuất sắc / Hỗn hợp để xếp hạng riêng từng mức. "Hỗn hợp" là các lượt làm bài chọn "Tất cả mức độ". Các lượt làm trước đó cũng lọc được.
- Quản trị viên bấm vào tên để xem từng lượt làm bài và xoá lượt thử. Nhân viên chỉ mở được lượt của chính mình.
- Ngày giờ do máy chủ ghi nên không sửa được từ máy nhân viên.
- Ở chế độ mở, **mọi người đăng nhập đều xem được bảng xếp hạng** (tên Google và điểm của người đã làm bài). Muốn kín hơn thì chuyển sang "Chỉ email trong danh sách".

## iPhone
Mở link bằng **Safari → Chia sẻ → Thêm vào Màn hình chính**. Nếu đăng nhập Google trục trặc ở chế độ này thì dùng thẳng trong Safari.

## Làm lại app Android (APK)
APK cũ chứa bản web cũ, kèm mật khẩu admin cũ: **ngừng dùng và gỡ**. Làm lại APK một lần để app mở thẳng trang web (sau này sửa web là mọi người tự có bản mới) và có đăng nhập Google gốc.

Trong Firebase: **Project settings → Your apps → Add app → Android**, tên gói `com.hiepminhthinh.tracnghiem`, SHA-1 của khoá ký APK hiện tại:
`28:75:27:53:DB:04:98:BA:03:2C:81:C8:30:A5:E5:40:36:C9:40:6E` → tải `google-services.json`.

Dán đoạn sau cho phiên Claude chạy trên máy tính của bạn (nơi có dự án Capacitor):

```
Dự án Android Capacitor "Trắc Nghiệm ĐMT" (appId com.hiepminhthinh.tracnghiem). Hãy làm lại APK để:
1. Mở thẳng trang web https://kirateppei.github.io/tracnghiem_hmt/ : thêm "server": {"url": "https://kirateppei.github.io/tracnghiem_hmt/"} vào capacitor.config.json, giữ nguyên appId và appName.
2. Có đăng nhập Google gốc: kiểm tra phiên bản @capacitor/core đang dùng, cài @capacitor-firebase/authentication cùng bản chính (major) với nó (gói "firebase" không bắt buộc). Trong capacitor.config.json thêm "plugins": {"FirebaseAuthentication": {"skipNativeAuth": true, "providers": ["google.com"]}}.
3. Đặt google-services.json (tôi cung cấp, tải từ Firebase cho app Android com.hiepminhthinh.tracnghiem) vào android/app/. Không đưa file này lên GitHub.
4. Dùng ảnh docs/icons/icon-1024.png của repo tracnghiem_hmt làm icon app (dùng @capacitor/assets hoặc cách tương đương).
5. Chạy npx cap sync android rồi build APK bằng ĐÚNG khoá debug đang dùng (SHA-1 28:75:27:53:DB:04:98:BA:03:2C:81:C8:30:A5:E5:40:36:C9:40:6E), không tạo khoá mới. Khác khoá thì Android không cho cài đè và nhân viên phải gỡ bản cũ trước.
Mã web đã sẵn sàng: trang gọi plugin qua Capacitor.nativePromise('FirebaseAuthentication', 'signInWithGoogle', {skipNativeAuth: true}), không cần sửa mã web.
```

## Giới hạn cần biết
- **Gói miễn phí (Spark)** cho 50.000 lượt đọc và 20.000 lượt ghi mỗi ngày, dư cho 20 người. Xem bảng xếp hạng cả **Năm** tải nhiều dữ liệu nhất nên chỉ tải khi mở và nhớ tạm 5 phút (bấm lại nút kỳ để làm mới).
- **Chế độ mở không giới hạn tần suất ghi.** Luật chỉ kiểm tra từng lượt có hợp lệ (đúng người, đúng giờ, điểm không vượt tổng số câu). Nếu có người gửi hàng loạt, hãy chuyển sang "Chỉ email trong danh sách".
- **Điểm do trình duyệt gửi lên**, nên người rành kỹ thuật vẫn gửi được điểm giả hợp lệ. Đây là bảng kiểm tra nội bộ, không dùng làm bằng chứng thi cử nghiêm ngặt.
- **Phần Firebase thật chưa được thử** khi viết (đăng nhập Google, đọc/ghi Firestore, luật); mới kiểm tra giao diện và logic bằng trình duyệt giả lập với bộ câu hỏi demo. Hãy thử với 1–2 tài khoản ở mục 7 trước khi mời cả nhóm.
- Câu hỏi tự thêm có video lớn hơn khoảng 1 MB không lưu được lên máy chủ (giới hạn của Firestore); phần mềm sẽ báo và lưu tạm trên máy đó.
