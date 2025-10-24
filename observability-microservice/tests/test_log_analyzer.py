import tempfile
from src.log_analyzer import analyze_log_file

SAMPLE = """2025-10-01 12:00:00 INFO Started service
2025-10-01 12:01:00 ERROR Connection refused: db.example.com
2025-10-01 12:02:00 ERROR Connection refused: db.example.com
2025-10-01 12:03:00 WARN High memory usage
2025-10-01 12:04:00 ERROR Timeout while calling external API
"""

def test_analyze_log_file():
    with tempfile.NamedTemporaryFile('w+', delete=True) as tf:
        tf.write(SAMPLE)
        tf.flush()
        levels, top = analyze_log_file(tf.name, top_n=2)
        assert levels['INFO'] == 1
        assert levels['WARN'] == 1
        assert levels['ERROR'] == 3
        assert top[0][1] == 2
