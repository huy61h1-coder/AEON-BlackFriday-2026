# Profit Auto Login

Ứng dụng Windows cục bộ để mở `https://profit.aeon.com.vn/VNM/servlet/SvltLogin` bằng Microsoft Edge hoặc Google Chrome và đăng nhập vào Profit.

## Cách dùng

1. Nháy đúp `Start-Profit-AutoLogin.cmd`.
2. Nhập User ID và mật khẩu trong hộp thoại Windows.
3. Chờ cửa sổ Profit mở ra. Giữ cửa sổ PowerShell chạy trong khi dùng Profit.

Không có mật khẩu nào được lưu trong mã, trong file, hay gửi lên dịch vụ khác. Thư mục `profile` chỉ để trình duyệt giữ cookie/phiên Profit sau khi đã đăng nhập.

## Giao diện web cục bộ

Nháy đúp `Start-Local-Web.cmd`, rồi mở [http://127.0.0.1:47831](http://127.0.0.1:47831). Link này chỉ hoạt động trên máy đang chạy ứng dụng và không được công khai trên Internet.

## Giao diện Profit trực tiếp

Nháy đúp `Start-Profit-Web.cmd`, rồi mở [http://127.0.0.1:47832/VNM/servlet/SvltLogin](http://127.0.0.1:47832/VNM/servlet/SvltLogin). Đây là giao diện gốc của Profit qua cổng cục bộ. Sau khi bạn điền đủ User ID và mật khẩu, web sẽ tự bấm **Log In** sau 0,85 giây. Nếu Profit báo hết chỗ/capacity, web tự thử lại mỗi 15 giây đến khi vào được; nút **Dừng** sẽ hủy vòng thử. Không tự gửi form trống và không ghi mật khẩu vào file hay máy chủ.

Khối **TÙY CHỈNH AUTO LOGIN** ở góc phải có ô **Tài khoản**, **Mật khẩu** và nút **Đăng nhập với thông tin trên**. Nó cũng cho phép bật/tắt tự động, chọn thời gian chờ trước khi bấm Log In (0,1–10 giây), chu kỳ thử lại (0,5–120 giây) và lựa chọn **Tự thử lại nếu quay về màn hình Login**. Khi được bật, công cụ tự điền lại tài khoản/mật khẩu của phiên hiện tại và thử lại; lỗi sai tài khoản/mật khẩu được nhận diện sẽ không bị lặp. Mật khẩu chỉ được giữ trong phiên trình duyệt rồi được xoá khi vào được hoặc khi bấm Dừng; không ghi vào file hay máy chủ cục bộ.

## Dùng từ máy khác trong mạng nội bộ

Sau khi chạy `Start-Profit-Web.cmd`, máy trong mạng Wi-Fi hiện tại `10.5.36.x` có thể truy cập trực tiếp `http://10.5.36.72:47832/VNM/servlet/SvltLogin` mà không cần khoá. Máy ngoài dải mạng này vẫn cần khoá truy cập tạm thời. Không dùng link trên mạng công khai: cổng cục bộ dùng HTTP, nên thông tin đăng nhập không được mã hoá trên đường mạng.

Mặc định công cụ thử tối đa 3 lần nếu lỗi kết nối/điều hướng. Nếu máy chủ trả lại màn hình đăng nhập (có thể do sai tài khoản, mật khẩu hoặc chưa được cấp quyền), công cụ dừng ngay để tránh khóa tài khoản.

### Tuỳ chọn

Để đổi số lần thử kết nối (từ 1 đến 5), mở PowerShell tại thư mục này và chạy:

```powershell
.\Start-Profit-AutoLogin.ps1 -SoLanThu 5
```

Yêu cầu: Windows, Node.js 20+ và Microsoft Edge hoặc Google Chrome.
