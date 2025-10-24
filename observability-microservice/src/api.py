from flask import Blueprint, request, jsonify, current_app, send_from_directory
from src import auth, db, log_analyzer
import os, statistics

bp = Blueprint('api', __name__)

def require_token(req):
    tok = req.headers.get('x-session-token') or req.args.get('token')
    current_app.logger.debug('require_token called, token=%s', tok)
    if not tok or not auth.validate_token(tok):
        return None
    return tok

# Thresholds management (GET current, POST update)
@bp.route('/thresholds', methods=['GET'])
def get_thresholds():
    if require_token(request) is None:
        return jsonify({'error': 'unauthorized', 'reason': 'missing_or_invalid_token'}), 401
    coll = current_app.collector if hasattr(current_app, 'collector') else None
    if coll is None:
        return jsonify({'error': 'collector_not_running'}), 500
    return jsonify({'cpu_threshold': float(coll.cpu_threshold), 'mem_threshold': float(coll.mem_threshold)})

@bp.route('/thresholds', methods=['POST'])
def set_thresholds():
    if require_token(request) is None:
        return jsonify({'error': 'unauthorized', 'reason': 'missing_or_invalid_token'}), 401
    coll = current_app.collector if hasattr(current_app, 'collector') else None
    if coll is None:
        return jsonify({'error': 'collector_not_running'}), 500
    data = request.json or {}
    cpu = data.get('cpu_threshold')
    mem = data.get('mem_threshold')
    changed = {}
    try:
        if cpu is not None:
            cpu_val = float(cpu)
            coll.cpu_threshold = cpu_val
            changed['cpu_threshold'] = cpu_val
        if mem is not None:
            mem_val = float(mem)
            coll.mem_threshold = mem_val
            changed['mem_threshold'] = mem_val
    except Exception as e:
        return jsonify({'error': 'invalid_value', 'message': str(e)}), 400
    return jsonify({'ok': True, 'updated': changed})



@bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error':'email and password required'}), 400
    ok = auth.register_user(email, password)
    if not ok:
        return jsonify({'error':'user exists or unable to create'}), 400
    return jsonify({'ok':True}), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    tok = auth.login_user(email, password)
    if not tok:
        return jsonify({'error':'invalid credentials'}), 401
    return jsonify({'token':tok})

@bp.route('/validate', methods=['GET'])
def validate():
    if require_token(request) is None:
        return jsonify({'valid':False}), 401
    return jsonify({'valid':True})

@bp.route('/summary', methods=['GET'])
def summary():
    if require_token(request) is None:
        return jsonify({'error':'unauthorized', 'reason':'missing_or_invalid_token'}), 401
    
    total_alerts = db.fetchone('SELECT COUNT(*) AS c FROM alerts')['c']
    alerts_by_type = {}
    rows = db.fetchall('SELECT alert_type, COUNT(*) AS c FROM alerts GROUP BY alert_type')
    for r in rows:
        alerts_by_type[r['alert_type']] = r['c']
    # averages over last 50 metrics
    rows_cpu = db.fetchall("""SELECT value FROM metrics WHERE metric_type='cpu' ORDER BY id DESC LIMIT 50""")
    rows_mem = db.fetchall("""SELECT value FROM metrics WHERE metric_type='memory' ORDER BY id DESC LIMIT 50""")
    def avg(rows):
        vals = [r['value'] for r in rows]
        return float(sum(vals)/len(vals)) if vals else 0.0
    response = {
        'total_alerts': total_alerts,
        'alerts_by_type': alerts_by_type,
        'avg_cpu': avg(rows_cpu),
        'avg_memory': avg(rows_mem)
    }
    return jsonify(response)

@bp.route('/alerts', methods=['GET'])
def alerts():
    if require_token(request) is None:
        return jsonify({'error':'unauthorized', 'reason':'missing_or_invalid_token'}), 401
    rows = db.fetchall('SELECT id, alert_type, value, ts FROM alerts ORDER BY id DESC LIMIT 100')
    return jsonify([dict(r) for r in rows])

@bp.route('/metrics', methods=['GET'])
def metrics():
    if require_token(request) is None:
        return jsonify({'error':'unauthorized', 'reason':'missing_or_invalid_token'}), 401
    rows = db.fetchall('SELECT id, metric_type, value, ts FROM metrics ORDER BY id DESC LIMIT 200')
    return jsonify([dict(r) for r in rows])

@bp.route('/analyze-log', methods=['POST'])
def analyze_log():
    if require_token(request) is None:
        return jsonify({'error':'unauthorized', 'reason':'missing_or_invalid_token'}), 401
    # expects JSON: { "path": "/full/path/to/log" }
    data = request.json or {}
    path = data.get('path')
    if not path or not os.path.exists(path):
        return jsonify({'error':'missing or invalid path'}), 400
    levels, top = log_analyzer.analyze_log_file(path, top_n=5)
    return jsonify({'levels':levels, 'top_errors': top})
