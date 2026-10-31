# Bộ câu hỏi hq1–hq150 (không có câu tính toán)

- `text_q.py`: 109 câu hỏi chữ; `img_q.py`: 38 câu có hình + 3 câu có video (mỗi dòng ghi tên cảnh vẽ).
- `scenes.html`: các cảnh mô phỏng vẽ bằng SVG (màn hình biến tần, ảnh nhiệt, ảnh EL, đồng hồ đo, lắp đặt sai…) và 3 video (`SV`).
- `shot.js` chụp cảnh ra PNG, `vid.js` xuất khung hình rồi ghép video bằng ffmpeg (6 khung/giây, h264).
- `build.py` đổi hình sang webp, chép vào `docs/media/`, xáo đáp án và nối vào `docs/questions.js` (đã chạy một lần, chạy lại sẽ thêm trùng).
Hình là mô phỏng, không phải ảnh chụp thật. Có ảnh/video thật từ công trình thì thêm câu hỏi qua tab Quản trị.
