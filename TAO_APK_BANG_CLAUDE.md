# Nhờ Claude trên máy tính tạo file APK

Cách làm: (1) tự làm phần Firebase ở dưới (5 phút, Claude không làm thay được vì cần đăng nhập tài khoản của bạn), (2) mở Claude Code trên máy tính, (3) dán nguyên khối "Lời nhắc" ở cuối.

## (1) Việc bạn tự làm trước
1. Vào https://console.firebase.google.com, mở dự án `hmt-trac-nghiem`, bấm bánh răng → **Project settings** → kéo xuống **Your apps**.
2. Nếu chưa có app Android: **Add app** → Android → ô **Android package name** nhập `com.hiepminhthinh.tracnghiem` → **Register app** → **Next** đến hết.
3. Trong thẻ app Android: **Add fingerprint** → dán `48:0E:61:34:59:F5:E1:A4:54:79:19:62:B1:DD:52:B9:57:99:B7:C4` → **Save**.
4. Bấm **Download google-services.json** và nhớ nơi lưu (thường là thư mục Downloads).
5. Gỡ app Trắc Nghiệm cũ trên điện thoại (khoá ký mới nên không cài đè được).

## (2) Lời nhắc dán cho Claude (nhớ sửa dòng đường dẫn google-services.json)

```
Hãy tạo giúp tôi file APK Android cho ứng dụng "Trắc Nghiệm ĐMT". Làm tuần tự, tự xử lý lỗi, và chỉ hỏi tôi khi thật sự bị kẹt.

Thông tin:
- Repo: https://github.com/kirateppei/tracnghiem_hmt , nhánh trang-web. Dự án Android nằm trong thư mục android-app của nhánh này (Capacitor 6, tải trang web trực tiếp, đăng nhập Google bằng @capacitor-firebase/authentication). Không sửa mã web trong docs/, không đổi appId com.hiepminhthinh.tracnghiem, không tạo khoá ký mới.
- File google-services.json tôi đã tải từ Firebase, đang ở: C:\Users\TÊN_BẠN\Downloads\google-services.json   (<-- sửa đường dẫn này cho đúng)
- Máy này đã có Android Studio. Cần Node.js (LTS) và JDK 17.

Các bước:
1. Kiểm tra node, npm, java: chạy node -v, npm -v, java -version. Nếu thiếu Node.js thì hướng dẫn tôi cài (hoặc cài giúp nếu có thể). Dự án cần JDK 17 để chạy Gradle 8.2.1: nếu java mặc định không phải 17 thì dùng JDK 17 đi kèm Android Studio (thư mục jbr, nếu là bản 17) hoặc tải Temurin 17, và đặt JAVA_HOME trỏ tới nó chỉ cho phiên làm việc này.
2. Tải mã: git clone -b trang-web https://github.com/kirateppei/tracnghiem_hmt vào một thư mục mới (ví dụ ~/tracnghiem_hmt). Nếu không có git thì tải ZIP nhánh trang-web và giải nén.
3. Chép google-services.json vào android-app/android/app/google-services.json (đúng tên file, đúng thư mục). Mở file kiểm tra có "package_name": "com.hiepminhthinh.tracnghiem". Nếu sai thì dừng lại và báo tôi.
4. Trong thư mục android-app chạy: npm ci   rồi   npx cap sync android
5. Tìm Android SDK (thường %LOCALAPPDATA%\Android\Sdk trên Windows, ~/Library/Android/sdk trên Mac, ~/Android/Sdk trên Linux). Tạo android-app/android/local.properties với dòng sdk.dir=<đường dẫn SDK> (trên Windows dùng dấu \\ hoặc /). Không đưa file này lên git.
6. Trong android-app/android chạy: gradlew assembleRelease   (Mac/Linux: ./gradlew assembleRelease). Lần đầu tải thư viện mất 5-15 phút. Nếu báo thiếu SDK platform/build-tools thì dùng sdkmanager của Android Studio để cài đúng phiên bản được yêu cầu (accept licenses).
7. Khi xong, file nằm ở android-app/android/app/build/outputs/apk/release/app-release.apk. Đổi tên bản sao thành trac-nghiem-dmt.apk và chép ra thư mục Desktop của tôi. Cho tôi biết đường dẫn đầy đủ và kích thước file.
8. Xác nhận bằng cách chạy: keytool -printcert -jarfile trac-nghiem-dmt.apk  và đọc cho tôi dòng SHA1. SHA1 phải là 48:0E:61:34:59:F5:E1:A4:54:79:19:62:B1:DD:52:B9:57:99:B7:C4. Nếu khác thì báo tôi, đừng bỏ qua.
9. Hướng dẫn tôi cài lên điện thoại ngắn gọn (chép file qua cáp/Zalo/Drive, cho phép cài từ nguồn ngoài, nhớ đã gỡ app cũ).

Nếu gặp lỗi: đọc kỹ thông báo, thử sửa (ví dụ đổi JDK, chạy lại npm ci, gradlew clean), rồi chạy lại. Báo tôi bằng tiếng Việt, ngắn gọn, mỗi bước xong thì nói đã xong.
```

## (3) Sau khi có APK
- Cài lên điện thoại, mở app, bấm **Đăng nhập Google**.
- Nếu báo "developer error" hoặc không đăng nhập được: gần như luôn là do chưa thêm đúng vân tay SHA-1 ở bước (1.3), hoặc tải `google-services.json` trước khi thêm vân tay. Thêm lại, tải lại file, dựng lại APK.
