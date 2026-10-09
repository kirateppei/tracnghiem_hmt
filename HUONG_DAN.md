# Trắc nghiệm ĐMT — hướng dẫn đưa lên mạng

- Thư mục `docs/` là trang web. File `firestore.rules` là luật bảo vệ dữ liệu.
- Đăng nhập bằng **Google**. Mặc định **mọi tài khoản Google đều vào được**; quản trị viên có thể chuyển sang "chỉ email trong danh sách" bất cứ lúc nào (**Quản trị → 👥 Tài khoản**).
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

→ **Save**. Các quản trị viên khác sau này đặt trong phần mềm ở **Quản trị → Tài khoản**.

## 5. Đăng ký ứng dụng web và điền cấu hình
**Project settings (⚙) → Your apps → biểu tượng `</>` (Web)** → đặt tên → **Register app** (không cần bật Hosting) → sao chép khối `firebaseConfig`.

Trên GitHub mở `docs/firebase-config.js` → biểu tượng bút chì → thay 6 giá trị `DIEN_...` → **Commit changes** (commit thẳng vào nhánh `trang-web`). Đây không phải mật khẩu nên để công khai là bình thường; an toàn nằm ở luật Firestore.

## 6. Cho phép tên miền đăng nhập
**Firebase → Authentication → Settings → Authorized domains → Add domain** → `kirateppei.github.io` (chỉ tên miền, không kèm đường dẫn).

## 7. Dùng thử rồi mời mọi người
1. Mở trang bằng **Chrome hoặc Safari** (đừng mở trong Zalo hoặc Messenger, Google chặn đăng nhập ở đó) → **Đăng nhập bằng Google** bằng email quản trị. Bạn sẽ thấy **Quản trị → 👥 Tài khoản** và **Thêm câu**.
2. Thử bằng một tài khoản Google khác để chắc nhân viên vào được.
3. Gửi link cho nhân viên. Ai có tài khoản Google đều vào được; tên trên bảng xếp hạng là tên Google (hoặc tên bạn đặt trong tab Tài khoản).

## Làm bài và giao diện
- Màn hình làm bài chọn bằng **nút bấm**: độ khó (Hỗn hợp, Dễ, Trung bình, Khó, Cực khó, Xuất sắc), số câu (10 đến 100), công tắc **Làm bài ẩn danh**. Phần mềm **nhớ lựa chọn lần trước** trên từng máy.
- **Làm bài ẩn danh:** tên không hiện trên bảng xếp hạng, kết quả vẫn được tính và hiện là "Ẩn danh" (riêng bạn vẫn thấy dòng của mình có chữ "bạn"). Các lượt ẩn danh của một người không bị gộp với các lượt có tên. Về kỹ thuật, quản trị viên có quyền vào Firebase vẫn tra được mã tài khoản phía sau.
- **Tab 🎮 Chơi:** 4 mini game giải trí, chơi trên máy từng người, không lưu kết quả và không ảnh hưởng bảng xếp hạng: *Khám răng cá sấu* (chọn nhân vật cá sấu, hà mã hoặc cá mập, 4 đến 10 răng, số răng phạt từ 1 đến toàn bộ răng; bấm ⚙ để đổi khi đang chơi) và *Thùng gỗ cướp biển* (thùng gỗ xoay được bằng cách vuốt ngang, chọn 6 đến 16 khe, hải tặc bật ra khi nhét trúng khe bí mật; 1 đến 6 người thay phiên, ai chạm trúng ô "đau" thì thua), *Lắc xí ngầu* (khối xúc xắc 3D có số, 4 kiểu, 1 đến 6 viên, bấm nút hoặc bật lắc điện thoại), *Vòng quay may mắn* (vành vàng có đèn nhấp nháy, kim gạt kêu tách tách, ô trúng nhấp nháy kèm pháo giấy; tự nhập các ô, nhớ danh sách trên máy). Mã nằm ở `docs/games.js`.
- **Tài liệu → Bản vẽ NLMT:** có ô tìm kiếm, bấm vào hình để xem toàn màn hình và phóng to, hoặc tải PDF. Muốn thêm bản vẽ: gom các file PDF vào một thư mục rồi chạy `python3 tools/add_drawings.py <thư mục>` (tự bỏ file trùng, tạo ảnh xem trước, thêm vào danh sách). Sau đó mở `docs/drawings.js` để sửa tên hiển thị (`title`) cho đẹp, rồi chạy `python3 tools/bump_version.py --notes "..."` và commit/push.
- Thanh tab gồm **Làm bài, Xếp hạng, Tài liệu** và, với quản trị viên, **Quản trị** (Thêm câu, Quản lý, Tài khoản).

## Quản lý quyền truy cập
**Quản trị → 👥 Tài khoản → Ai được vào làm bài?**
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

## App Android (APK) — dựng tự động trên GitHub
APK cũ chứa bản web cũ, kèm mật khẩu admin cũ: **gỡ bản cũ khỏi điện thoại** (khoá ký bản mới khác bản cũ nên không cài đè được). Bản mới mở thẳng trang web (sửa web là mọi người tự có bản mới) và đăng nhập Google bằng plugin gốc của Android. Mã dự án nằm trong thư mục `android-app/`; GitHub tự dựng file APK, không cần Android Studio.

**Làm một lần (khoảng 5 phút):**
1. Vào Firebase → **Project settings (Cài đặt dự án) → Your apps**. Nếu chưa có app Android thì **Add app → Android**, tên gói `com.hiepminhthinh.tracnghiem`. Trong app Android đó bấm **Add fingerprint** và dán SHA-1 của khoá ký mới:
   `48:0E:61:34:59:F5:E1:A4:54:79:19:62:B1:DD:52:B9:57:99:B7:C4`
   (có thể giữ thêm SHA-1 cũ nếu đang có).
2. Bấm **Download google-services.json**.
3. Vào repo trên GitHub → thư mục `android-app/android/app` → **Add file → Upload files** → kéo file `google-services.json` vào → Commit (nhánh `trang-web`).
4. GitHub tự chạy **Actions → Dựng APK Android** (khoảng 5–10 phút). Xong thì file nằm ở **Releases → "Ứng dụng Android (APK) mới nhất"** (tên `trac-nghiem-dmt.apk`), tải về điện thoại và cài. Android sẽ hỏi cho phép cài từ nguồn ngoài.
Nếu quy trình đỏ chữ "Thiếu google-services.json" nghĩa là chưa làm bước 3.

**Hoặc dựng ngay trên máy tính có Android Studio** (không cần chờ GitHub): tải repo về, đặt `google-services.json` vào `android-app/android/app/`, mở terminal trong `android-app` rồi chạy:
```
npm ci
npx cap sync android
cd android
gradlew assembleRelease      # Mac/Linux: ./gradlew assembleRelease
```
File APK nằm ở `android-app/android/app/build/outputs/apk/release/app-release.apk`. Hoặc mở thư mục `android-app/android` bằng Android Studio → Build → Build APK(s) (chọn biến thể `release`). Cần JDK 17 (Android Studio có sẵn).

**Lưu ý bảo mật:** để đăng nhập Google luôn dùng cùng một SHA-1, khoá ký (`android-app/tracnghiem.keystore`, mật khẩu `tracnghiem-dmt`) được đặt luôn trong repo. Khoá này chỉ dùng cho app nội bộ; nếu lo ngại có người giả mạo bản cập nhật app, hãy đổi sang lưu khoá trong GitHub Secrets (biến `KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` trong `android-app/android/app/build.gradle`) và đăng ký lại SHA-1 mới.

**Khi cập nhật app:** sửa số `versionCode`/`versionName` trong `android-app/android/app/build.gradle`, đẩy lên; sau khi có APK mới, chạy
`python3 tools/bump_version.py --apk-version <số mới> --apk-url https://github.com/kirateppei/tracnghiem_hmt/releases/download/apk-latest/trac-nghiem-dmt.apk --apk-notes "Nội dung"`
để app cũ báo có bản mới.

## Cập nhật phần mềm cho mọi người (kể cả app Android)
- **Cách hoạt động:** sau mỗi lần có bản mới trên GitHub (chờ Pages build xong), người đang mở trang hoặc app sẽ thấy **thanh vàng ở đầu màn hình**: "Có bản cập nhật mới — nội dung". Thanh hiện trong vòng 5 phút hoặc ngay khi mở lại app. Bấm **Cập nhật ngay** để tải bản mới, **Để sau** thì chưa nhắc lại cho tới khi có bản mới hơn.
- Phần mềm **không tự tải lại** để khỏi mất bài đang làm; nếu đang làm bài dở sẽ hỏi xác nhận. Cuối trang có dòng "Phiên bản … · Kiểm tra cập nhật" để kiểm tra bằng tay.
- **Áp dụng cho:** trang web, iPhone (thêm vào Màn hình chính) và app Android **sau khi cài APK mới** theo mục trên (app mở thẳng trang web). APK cũ chứa bản web cũ bên trong nên không có tính năng này.
- **Người cập nhật (chủ phần mềm hoặc Claude):** trước mỗi lần commit có sửa trong `docs/`, chạy
  `python3 tools/bump_version.py --notes "Nội dung bản mới"`
  Script tự đóng dấu phiên bản theo nội dung (không phải tăng số tay) và cập nhật `docs/version.js`, `docs/version.json`, `docs/index.html`. Quên chạy thì điện thoại sẽ không biết có bản mới.
- **Khi nào phải cài lại file APK:** chỉ khi đổi phần vỏ Android (ví dụ thêm plugin hoặc đổi biểu tượng); xem mục "App Android (APK)" ở trên.

## Giới hạn cần biết
- **Gói miễn phí (Spark)** cho 50.000 lượt đọc và 20.000 lượt ghi mỗi ngày, dư cho 20 người. Xem bảng xếp hạng cả **Năm** tải nhiều dữ liệu nhất nên chỉ tải khi mở và nhớ tạm 5 phút (bấm lại nút kỳ để làm mới).
- **Chế độ mở không giới hạn tần suất ghi.** Luật chỉ kiểm tra từng lượt có hợp lệ (đúng người, đúng giờ, điểm không vượt tổng số câu). Nếu có người gửi hàng loạt, hãy chuyển sang "Chỉ email trong danh sách".
- **Điểm do trình duyệt gửi lên**, nên người rành kỹ thuật vẫn gửi được điểm giả hợp lệ. Đây là bảng kiểm tra nội bộ, không dùng làm bằng chứng thi cử nghiêm ngặt.
- **Phần Firebase thật chưa được thử** khi viết (đăng nhập Google, đọc/ghi Firestore, luật); mới kiểm tra giao diện và logic bằng trình duyệt giả lập với bộ câu hỏi demo. Hãy thử với 1–2 tài khoản ở mục 7 trước khi mời cả nhóm.
- Câu hỏi tự thêm có video lớn hơn khoảng 1 MB không lưu được lên máy chủ (giới hạn của Firestore); phần mềm sẽ báo và lưu tạm trên máy đó.
