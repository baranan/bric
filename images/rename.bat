cd C:\Users\Yoav\Documents\work\research\att\measure\pretest.photos\materials\use
setlocal enabledelayedexpansion
for %%a in (*.*) do (
set f=%%a
set f=!f:^(=!
set f=!f:^)=!
ren "%%a" "!f!"
)