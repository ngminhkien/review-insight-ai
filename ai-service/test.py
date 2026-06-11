import traceback
from src.pipeline import analyze_batch_reviews

try:
    print(analyze_batch_reviews([{'review_text':'this is bad'}]))
except Exception as e:
    traceback.print_exc()
