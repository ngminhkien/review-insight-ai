# Frontend React - GoI Y Lam Sau

Folder nay chua can code frontend ngay. Day la huong dan de nhom lam sau khi AI service on dinh.

## Muc tieu frontend

Frontend React se la giao dien nguoi dung:

- Upload CSV.
- Preview 20 dong dau.
- Bam analyze.
- Xem dashboard.
- Loc review theo sentiment, aspect, priority.
- Xem chi tiet review.
- Download report neu co.

## Man hinh de xuat

```text
/pages
├── DashboardPage
├── UploadPage
├── SingleAnalyzePage
├── ReviewDetailPage
└── ProductComparisonPage
```

## Component de xuat

```text
/components
├── FileUploadBox
├── ReviewPreviewTable
├── SentimentChart
├── AspectBarChart
├── InsightCard
├── RecommendationCard
├── ReviewTable
└── LoadingOverlay
```

## Cong nghe de xuat

- React + TypeScript.
- Tailwind CSS.
- Axios.
- Recharts.
- React Router.

## Luong goi API

```text
React
  -> Backend C#
      -> AI Service Python
```

Frontend khong nen goi truc tiep AI Service trong ban production. Tuy nhien trong demo noi bo co the goi truc tiep de test nhanh.

## Dashboard nen hien thi

- Total reviews.
- % positive.
- % negative.
- Top negative aspect.
- Top positive aspect.
- Pie/bar chart sentiment.
- Bar chart top aspects.
- Table review high priority.
- Insight cards.
- Recommendation cards.
