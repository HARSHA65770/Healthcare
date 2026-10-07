@echo off
echo ======================================================================
echo Running Autonomous Rural Health Platform Verification Test Suite
echo ======================================================================
python -m pytest backend/tests/test_triage.py -v
pause
