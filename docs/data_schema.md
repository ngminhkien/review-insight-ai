# Data Schema

## CSV dau vao de xuat

```csv
review_id,product_id,product_type,rating,review_text,date
1,P001,phone,5,"Good quality and fast delivery",2024-01-02
```

## Cot bat buoc

- `review_id`: ma review.
- `product_id`: ma san pham.
- `rating`: diem danh gia 1-5.
- `review_text`: noi dung review.
- `date`: ngay review.

## Cot nen co

- `product_type`: loai san pham, vi du phone, food, fashion, cosmetics, general.
- `source`: nguon review, vi du Shopee, Tiki, Amazon, Google.
- `user_id`: neu can phan tich theo khach hang.

## Label sentiment tu rating

- 1-2 sao: negative.
- 3 sao: neutral.
- 4-5 sao: positive.

## Output sau AI

```json
{
  "review_id": "1",
  "clean_text": "poor packaging broken item",
  "sentiment": "negative",
  "confidence": 0.91,
  "aspects": ["packaging", "quality"],
  "priority": "high"
}
```
