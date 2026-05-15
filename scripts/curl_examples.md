# Curl Examples

## Health

```bash
curl http://localhost:8001/health
```

## Analyze single

```bash
curl -X POST http://localhost:8001/analyze-single \
  -H "Content-Type: application/json" \
  -d '{
    "review_id": "1",
    "product_id": "P001",
    "product_type": "phone",
    "rating": 1,
    "review_text": "Poor packaging and broken item",
    "date": "2024-01-03"
  }'
```

## Analyze batch

```bash
curl -X POST http://localhost:8001/analyze-batch \
  -H "Content-Type: application/json" \
  -d @scripts/example_request.json
```
