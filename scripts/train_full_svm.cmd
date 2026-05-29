@echo off
setlocal

set "ROOT=%~dp0.."
set "PY=%ROOT%\ai-service\.venv\Scripts\python.exe"
if not exist "%PY%" set "PY=%ROOT%\.venv\Scripts\python.exe"

set "SCRIPT=%ROOT%\ai-service\src\train_sentiment.py"
set "DATA=%ROOT%\data\domains\electronics\raw_reviews_amazon_us.csv"
set "REPORT=%ROOT%\ai-service\reports\classification_report_svm_full.json"

"%PY%" "%SCRIPT%" --data "%DATA%" --model svm --report "%REPORT%"

endlocal
