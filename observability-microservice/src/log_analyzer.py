import re
from collections import Counter
from typing import List, Tuple

LEVEL_REGEX = re.compile(r'\b(INFO|WARN|ERROR|WARNING)\b', re.IGNORECASE)

def analyze_log_file(path: str, top_n: int = 5) -> Tuple[dict, List[tuple]]:
    info = 0
    warn = 0
    errors = Counter()
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            m = LEVEL_REGEX.search(line)
            if not m:
                continue
            lvl = m.group(1).upper()
            _, _, after = line.partition(m.group(0))
            message = after.strip()
            if lvl == 'INFO':
                info += 1
            elif lvl in ('WARN', 'WARNING'):
                warn += 1
            elif lvl == 'ERROR':
                errors[message or '<NO MESSAGE>'] += 1
    levels = {'INFO': info, 'WARN': warn, 'ERROR': sum(errors.values())}
    top_errors = errors.most_common(top_n)
    return levels, top_errors

if __name__ == '__main__':
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument('path')
    p.add_argument('--top', type=int, default=5)
    args = p.parse_args()
    levels, top = analyze_log_file(args.path, args.top)
    print('Levels:', levels)
    print('Top errors:')
    for msg,c in top:
        print(c, msg)
