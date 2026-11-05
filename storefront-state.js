// Stable storefront settings for static GitHub/Netlify deployments.
// Product data deliberately stays in the API state so a visual update can
// never replace the current product catalogue or product images.
const canonicalStorefrontState = {
  "aeon-ui": {
    "storefrontRevision": "blackfriday-20261104-v7",
    "eyebrow": "BLACK FRIDAY 2026",
    "title": "BlackFriday",
    "intro": "BlackFriday 2026, Top sản phẩm có giá ưu đãi đặc biệt.",
    "heroDisplayMode": "image-only",
    "promotionTitle": "Thông Tin Chiết Khấu",
    "promotionText": "Ngày 03/08 – 19/08:  từ 1 triệu trở lên: 8%<br>Ngày 20/08 – 25/09:<br>• Từ 3triệu – 10triệu: Chiết khấu 5%|• Trên 10triệu – 15triệu: Chiết khấu 10%<br>• Trên 15triệu – 30triệu: Chiết khấu 12%|• Trên 30triệu: Chiết khấu 15%<br>*Hình thức chiết khấu: Phiếu ưu đãi. Áp dụng cho hộp bánh không rượu.<br>*Không Áp dụng giảm giá ngày Member(5&amp;20).",
    "collectionTitle": "Danh mục\nđang cập nhật.",
    "collectionNote": "Sản phẩm, giá bán và hình ảnh sẽ được công bố chính thức trong thời gian tới.",
    "heroImage": "https://res.cloudinary.com/rnrbw9za/image/upload/v1793679407/bf_yggx12.png",
    "heroPreviewVersion": "blackfriday-20261103",
    "logoText": "AEON",
    "logoSubtitle": "",
    "logoImage": "",
    "logoMode": "text",
    "campaignSchedule": "25/11 – 01/12/2026",
    "quoteExcelUrl": "/assets/uploads/quotes/1785604164925-72j2j0-FO-14-01-Preliminary-Questionnaire-v6.xlsx",
    "quotePdfUrl": "/assets/uploads/quotes/1785604173555-99ij31-AEON-CALATOG-TRUNG-THU-2026.pdf"
  },
  "aeon-layout": {
    "storefrontRevision": "blackfriday-20261104-v7",
    "heroTitleSize": 35,
    "heroIntroSize": 13,
    "bannerAspectRatio": 1.5,
    "heroButtonAlign": "left",
    "productTitleSize": 12,
    "productButtonAlign": "left",
    "checkoutButtonAlign": "stretch",
    "accentColor": "#e21d3f",
    "accentDarkColor": "#9e102a",
    "pageBackgroundColor": "#080808",
    "sectionBackgroundColor": "#15100f",
    "textColor": "#fffaf4",
    "headerHeight": 60,
    "heroHeight": 0,
    "sectionSpacing": 0,
    "productImageHeight": 0,
    "productColumns": 5,
    "productColumnsMobile": 2,
    "fontFamily": "aeon-default",
    "logoSize": 18
  }
};
if (typeof window !== 'undefined') window.AEON_DEPLOYED_STOREFRONT_STATE = canonicalStorefrontState;
if (typeof module !== 'undefined' && module.exports) module.exports = canonicalStorefrontState;
