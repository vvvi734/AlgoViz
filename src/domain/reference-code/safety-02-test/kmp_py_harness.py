import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "sources/kmp"))
from kmp import build_lps, kmp_find_all

print("overlap", kmp_find_all("aaaaa", "aa"))
print("no_match", kmp_find_all("abcdef", "xyz"))
print("empty_text", kmp_find_all("", "a"))
print("empty_lps", build_lps(""))
try:
    kmp_find_all("abc", "")
    print("empty_pattern accepted")
except ValueError as error:
    print("empty_pattern ValueError", str(error))
