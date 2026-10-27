#!/usr/bin/env python3
"""Normalize favicon references in tracked HTML pages."""
import pathlib,re,subprocess
root=pathlib.Path(__file__).resolve().parents[1]
paths=subprocess.check_output(['git','ls-files','-z','*.html'],cwd=root).decode().split('\0')
favicon='<link rel="icon" type="image/png" href="https://static.wixstatic.com/media/251da0_a2056558d8284210b4ed7477cb36a49f~mv2.png?v=20261027-supgo-s"><link rel="apple-touch-icon" href="https://static.wixstatic.com/media/251da0_a2056558d8284210b4ed7477cb36a49f~mv2.png?v=20261027-supgo-s">'
count=0
for rel in filter(None,paths):
    p=root/rel
    s=p.read_text(encoding='utf-8')
    if not re.search(r'<head\b',s,re.I):continue
    out=re.sub(r'<link\s+[^>]*rel\s*=\s*["\'](?:shortcut icon|alternate icon|icon|apple-touch-icon)["\'][^>]*>', '',s,flags=re.I)
    out=re.sub(r'<head(\s[^>]*)?>',lambda m:m.group(0)+favicon,out,count=1,flags=re.I)
    if out!=s:
        p.write_text(out,encoding='utf-8');count+=1
print('Updated',count,'HTML pages')

