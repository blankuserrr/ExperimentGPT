@echo off
set /p message="Enter your commit message: "
git add .
git commit -m "%message%"