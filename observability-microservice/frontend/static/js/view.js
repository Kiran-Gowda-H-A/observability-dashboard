// view.js - React components (ES module)
import * as Model from './model.js';
import { showPopup } from './utils.js';

const e = React.createElement;

/* ---------------- AuthView ---------------- */
export function AuthView({ onSuccess }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState('login');

  async function submit() {
    if (!email || !password) {
      showPopup('Enter email and password', 'Missing', { type: 'error' });
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        await Model.apiRegister(email, password);
        showPopup('Registered — please login.', 'Success', { type: 'success', autoClose: 2200 });
        setMode('login');
      } else {
        const res = await Model.apiLogin(email, password);
        const tok = res && res.token;
        if (!tok) throw new Error('Token not returned');
        Model.saveTokenLocal(tok);
        onSuccess(tok);
      }
    } catch (err) {
      console.error(err);
      showPopup('Error: ' + (err.response?.data?.error || err.message || err), 'Error', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return e('div', { className: 'auth-wrap' },
    e('div', { className: 'auth-left' },
      e('div', { className: 'brand-hero' },
        e('div', { className: 'brand-circle' }, 'OD'),
        e('div', null,
          e('div', { className: 'hero-title' }, 'Observability'),
          e('div', { className: 'hero-sub' }, 'Monitor CPU & Memory, trigger alerts, and analyze logs — lightweight & local')
        )
      ),
      e('div', { style: { marginTop: 16, display: 'flex', gap: 10 } },
        e('div', { style: { padding: '8px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 8 } }, 'Lightweight'),
        e('div', { style: { padding: '8px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 8 } }, 'Easy to extend'),
        e('div', { style: { padding: '8px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 8 } }, 'Demo-ready')
      )
    ),

    e('div', { className: 'auth-right panel' },
      e('div', null,
        e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          e('h2', { style: { margin: 0 } }, mode === 'login' ? 'Welcome back' : 'Create account'),
          e('div', null, e('button', { onClick: () => setMode(mode === 'login' ? 'register' : 'login'), className: 'btn' }, mode === 'login' ? 'Sign up' : 'Sign in'))
        ),
        e('div', { className: 'muted', style: { marginTop: 6 } }, mode === 'login' ? 'Sign in to access the dashboard' : 'Create a free local account for demo')
      ),

      e('div', { style: { height: 12 } }),
      e('div', null,
        e('label', { className: 'small' }, 'Email'),
        e('input', { type: 'email', value: email, placeholder: 'you@example.com', onChange: ev => setEmail(ev.target.value) })
      ),
      e('div', null,
        e('label', { className: 'small' }, 'Password'),
        e('input', { type: 'password', value: password, placeholder: 'Enter a secure password', onChange: ev => setPassword(ev.target.value) })
      ),
      e('div', { style: { height: 8 } }),
      e('div', { style: { display: 'flex', gap: 12, alignItems: 'center' } },
        e('button', { onClick: submit, className: 'btn primary' }, loading ? (mode === 'login' ? 'Signing in...' : 'Creating...') : (mode === 'login' ? 'Sign in' : 'Create account')),
        e('button', { onClick: () => { setEmail('demo@local'); setPassword('demo'); }, className: 'btn' }, 'Fill demo')
      ),
      e('div', { className: 'or' }, 'or'),
      e('div', { style: { textAlign: 'center' } }, e('div', { className: 'muted' }, 'This demo stores users locally (no external service).'))
    )
  );
}

/* ---------------- MetricsChart ---------------- */
export function MetricsChart({ data }) {
  const canvasRef = React.useRef(null);
  const chartRef = React.useRef(null);

  const N = 40;
  const recent = (data || []).slice(0, N).reverse();
  const cpuSeries = recent.filter(d => d.metric_type === 'cpu').map(d => ({ ts: d.ts, value: d.value }));
  const memSeries = recent.filter(d => d.metric_type === 'memory').map(d => ({ ts: d.ts, value: d.value }));

  const labels = [];
  for (let i = 0; i < Math.max(cpuSeries.length, memSeries.length); i++) {
    labels.push((cpuSeries[i] && cpuSeries[i].ts) || (memSeries[i] && memSeries[i].ts) || (`#${i + 1}`));
  }
  const cpuData = labels.map((_, i) => (cpuSeries[i] ? cpuSeries[i].value : null));
  const memData = labels.map((_, i) => (memSeries[i] ? memSeries[i].value : null));

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (chartRef.current) {
      try {
        chartRef.current.data.labels = labels;
        const ds = chartRef.current.data.datasets || [];
        if (ds.length >= 1) ds[0].data = cpuData;
        if (ds.length >= 2) ds[1].data = memData;
        chartRef.current.update();
        return;
      } catch (err) {
        try { chartRef.current.destroy(); } catch (e) { /* ignore */ }
        chartRef.current = null;
      }
    }

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'CPU %', data: cpuData, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)', spanGaps: true, tension: 0.2, pointRadius: 0 },
          { label: 'Memory %', data: memData, borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.06)', spanGaps: true, tension: 0.2, pointRadius: 0 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 350 },
        scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } }, x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } } },
        plugins: { legend: { display: true, position: 'top' }, tooltip: { mode: 'index', intersect: false } },
        interaction: { mode: 'index', intersect: false }
      }
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [data]);

  return e('div', { className: 'card', style: { marginTop: 16 } },
    e('h4', { style: { marginTop: 0 } }, 'CPU & Memory Trend'),
    e('div', { className: 'chart-wrapper' }, e('canvas', { ref: canvasRef, style: { width: '100%', height: '100%' } }))
  );
}

/* ---------------- DashboardView ---------------- */
export function DashboardView({ token, onLogout }) {
  const [summary, setSummary] = React.useState(null);
  const [alerts, setAlerts] = React.useState([]);
  const [metrics, setMetrics] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const perPage = 3;

  const [alertsPage, setAlertsPage] = React.useState(1);
  const alertsPerPage = 4;

  const [cpuThreshold, setCpuThreshold] = React.useState(null);
  const [memThreshold, setMemThreshold] = React.useState(null);
  const [thresholdSaving, setThresholdSaving] = React.useState(false);

  async function fetchSummaryAndState() {
    const t = localStorage.getItem('obs_token') || token;
    if (!t) return;
    setLoading(true);
    try {
      const s = await Model.apiGetSummary();
      setSummary(s);
      const a = await Model.apiGetAlerts();
      setAlerts(a);
      setAlertsPage(1);
      const m = await Model.apiGetMetrics();
      setMetrics(m);
      setPage(1);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        showPopup('Session invalid — returning to login', 'Session', { type: 'error' });
        Model.clearTokenLocal();
        onLogout();
      } else {
        showPopup('Failed to fetch data: ' + (err.response?.data?.error || err.message || err), 'Error', { type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchThresholds() {
    try {
      const res = await Model.apiGetThresholds();
      setCpuThreshold(res.cpu_threshold);
      setMemThreshold(res.mem_threshold);
    } catch (err) { console.error(err); }
  }

  React.useEffect(() => {
    (async () => {
      try { await fetchSummaryAndState(); await fetchThresholds(); } catch (e) { /* ignore */ }
    })();
  }, []);

  React.useEffect(() => {
    const id = setInterval(() => (async () => { try { await fetchSummaryAndState(); } catch (e) { /* ignore */ } })(), 30000);
    return () => clearInterval(id);
  }, []);

  async function saveThresholds() {
    setThresholdSaving(true);
    try {
      const body = {};
      if (cpuThreshold != null) body.cpu_threshold = Model.numberOrDefault(cpuThreshold, undefined);
      if (memThreshold != null) body.mem_threshold = Model.numberOrDefault(memThreshold, undefined);
      await Model.apiSaveThresholds(body);
      showPopup('Thresholds updated', 'Success', { type: 'success', autoClose: 2200 });
    } catch (err) {
      console.error(err);
      showPopup('Failed to save thresholds: ' + (err.response?.data?.error || err.message || err), 'Error', { type: 'error' });
    } finally {
      setThresholdSaving(false);
    }
  }

  const metricsPageCount = Math.max(1, Math.ceil((metrics || []).length / perPage));
  const pageMetrics = (metrics || []).slice((page - 1) * perPage, page * perPage);

  const alertsPageCount = Math.max(1, Math.ceil((alerts || []).length / alertsPerPage));
  const pageAlerts = (alerts || []).slice((alertsPage - 1) * alertsPerPage, alertsPage * alertsPerPage);

  return e('div', { className: 'container' },
    e('header', null,
      e('div', { style: { display: 'flex', gap: 12, alignItems: 'center' } },
        e('div', { className: 'logo' }, 'OD'),
        e('div', null, e('h3', { style: { margin: 0 } }, 'Observability Dashboard'), e('div', { className: 'muted' }, 'CPU & Memory • Alerts • Logs'))
      ),
      e('div', null,
        e('button', { onClick: () => {
          const current = document.documentElement.getAttribute('data-theme') || 'light';
          const next = current === 'dark' ? 'light' : 'dark';
          document.documentElement.setAttribute('data-theme', next);
          localStorage.setItem('obs_theme', next);
        }, className: 'theme-toggle' }, 'Toggle theme'),
        e('button', { onClick: () => { Model.clearTokenLocal(); onLogout(); }, className: 'btn', style: { marginLeft: 12 } }, 'Logout')
      )
    ),

    e('div', { className: 'grid' },
      e('div', null,
        e('div', { className: 'card' },
          e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            e('div', null,
              e('div', { className: 'kpi' }, e('div', { className: 'value' }, summary ? summary.total_alerts : e('span', { className: 'skeleton', style: { width: 40, height: 20, display: 'inline-block' } })), e('div', { className: 'muted', style: { marginLeft: 8 } }, 'Total Alerts')),
              e('div', { style: { height: 8 } }),
              e('div', { className: 'kpi' }, e('div', { className: 'value' }, summary ? (summary.avg_cpu.toFixed(2) + '%') : e('span', { className: 'skeleton', style: { width: 60, height: 20, display: 'inline-block' } })), e('div', { className: 'muted', style: { marginLeft: 8 } }, 'Avg CPU'))
            ),
            e('div', null, e('div', { className: 'badge' }, summary ? (Object.values(summary.alerts_by_type || {}).reduce((a, b) => a + b, 0)) : 0))
          )
        ),

        e('div', { className: 'card', style: { marginTop: 16 } },
          e('h4', { style: { marginTop: 0 } }, 'Recent Metrics'),
          loading ? e('div', { className: 'skeleton chart-skel' }) :
            metrics && metrics.length ? e('div', null,
              pageMetrics.map(m => e('div', { key: m.id, style: { padding: '8px 0', borderBottom: '1px dashed rgba(0,0,0,0.03)' } },
                e('div', { style: { fontWeight: 700 } }, `${m.metric_type.toUpperCase()} — ${m.value}`),
                e('div', { className: 'small muted' }, m.ts)
              )),
              e('div', { className: 'pager' },
                e('button', { onClick: () => setPage(Math.max(1, page - 1)), disabled: page <= 1 }, 'Prev'),
                e('div', { className: 'muted-2' }, `Page ${page} / ${metricsPageCount}`),
                e('button', { onClick: () => setPage(Math.min(metricsPageCount, page + 1)), disabled: page >= metricsPageCount }, 'Next')
              )
            ) : e('div', { className: 'muted' }, 'No metrics yet')
        ),

        metrics && metrics.length ? e(MetricsChart, { data: metrics }) : null
      ),

      e('div', null,
        e('div', { className: 'card' },
          !token ? e('div', null, e('div', { className: 'muted' }, 'Not logged in')) : e('div', null,
            e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              e('div', null, e('strong', null, 'Logged in')),
              e('button', { onClick: async () => { await fetchSummaryAndState(); }, className: 'btn' }, 'Refresh')
            ),
            e('div', { style: { height: 10 } })
          )
        ),

        e('div', { className: 'card', style: { marginTop: 12 } },
          e('h4', { style: { marginTop: 0 } }, 'Recent Alerts'),
          loading ? e('div', { className: 'skeleton', style: { height: 60 } }) :
            alerts && alerts.length ? e('div', null,
              pageAlerts.map(a => e('div', { key: a.id, style: { padding: '10px 0', borderBottom: '1px dashed rgba(0,0,0,0.03)' } },
                e('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 12 } },
                  e('div', { style: { flex: '1 1 auto' } },
                    e('div', { style: { fontWeight: 700, color: 'var(--danger)' } }, a.alert_type),
                    e('div', { className: 'small muted' }, a.ts)
                  ),
                  e('div', { style: { flex: '0 0 48px', textAlign: 'right' } },
                    e('div', { style: { fontWeight: 700 } }, String(a.value))
                  )
                )
              )),
              e('div', { className: 'pager', style: { justifyContent: 'center', marginTop: 10 } },
                e('button', { onClick: () => setAlertsPage(Math.max(1, alertsPage - 1)), disabled: alertsPage <= 1 }, 'Prev'),
                e('div', { className: 'muted-2', style: { alignSelf: 'center' } }, `Page ${alertsPage} / ${alertsPageCount}`),
                e('button', { onClick: () => setAlertsPage(Math.min(alertsPageCount, alertsPage + 1)), disabled: alertsPage >= alertsPageCount }, 'Next')
              )
            ) : e('div', { className: 'muted' }, 'No alerts')
        ),

        e('div', { className: 'card', style: { marginTop: 12 } },
          e('h4', { style: { marginTop: 0 } }, 'Thresholds'),
          e('div', { className: 'thresholds' },
            e('div', null, e('label', { className: 'small' }, 'CPU threshold (%)'), e('input', { type: 'number', min: 0, max: 100, value: cpuThreshold == null ? '' : cpuThreshold, onChange: (ev) => setCpuThreshold(ev.target.value) })),
            e('div', null, e('label', { className: 'small' }, 'Memory threshold (%)'), e('input', { type: 'number', min: 0, max: 100, value: memThreshold == null ? '' : memThreshold, onChange: (ev) => setMemThreshold(ev.target.value) })),
            e('div', { style: { display: 'flex', gap: 8 } }, e('button', { onClick: saveThresholds, className: 'btn', disabled: thresholdSaving }, thresholdSaving ? 'Saving...' : 'Save'), e('button', { onClick: fetchThresholds, className: 'btn secondary' }, 'Reload'))
          )
        )
      )
    )
  );
}
