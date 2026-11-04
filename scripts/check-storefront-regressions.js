const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['index.html', 'background: #fff !important;', 'Nền khung ảnh sản phẩm phải luôn màu trắng.'],
  ['server.js', 'background:#fff!important', 'Server phải khóa nền ảnh sản phẩm màu trắng.'],
  ['app.js', 'class="regular-price"', 'Giá thường gạch ngang phải được render.'],
  ['app.js', 'product-discount-badge', 'Phần trăm giảm giá phải được render ở thẻ sản phẩm.'],
  ['storefront-product-ux.css', '.regular-price', 'Thiếu định dạng giá thường.'],
  ['storefront-product-ux.css', '.product-discount-badge', 'Thiếu định dạng phần trăm giảm giá.'],
  ['data.js', 'inferAeonBrandFromProductName', 'Thiếu chức năng tự nhận diện thương hiệu.'],
  ['data.js', 'hydrateProductCommerceFields', 'Thiếu lớp khôi phục giá và thương hiệu từ danh mục cũ.'],
  ['data.js', "'giaKhuyenMai', 'giaKM'", 'Thiếu nhận diện các cột giá khuyến mãi khi nhập dữ liệu.'],
  ['product-import.js', 'nhan hieu', 'File nhập sản phẩm phải nhận diện cột Nhãn hiệu.'],
  ['server.js', 'aeon-product-tombstones', 'Thiếu khóa chống khôi phục sản phẩm đã xóa.']
  ,['admin.js', "assetPanel(panel, {logo: true, hero: false});", 'Logo phải được quản lý riêng cùng danh mục sản phẩm.']
  ,['admin.js', "await saveShared('aeon-layout', {...layout, ...values});", 'Lưu giao diện phải chỉ ghi khóa bố cục, không ghi danh mục sản phẩm.']
];

const failures = checks.filter(([file, marker]) => !read(file).includes(marker));
if (failures.length) {
  failures.forEach(([, , message]) => console.error(`- ${message}`));
  process.exit(1);
}

console.log('Storefront regression locks: OK');
