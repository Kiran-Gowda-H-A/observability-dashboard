// app.js - controller bootstrap (ES module)
import { showPopup, freezeUi, unfreezeUi } from './utils.js';
import * as Model from './model.js';
import { AuthView, DashboardView } from './view.js';

const e = React.createElement;

function AppRoot() {
  const [view, setView] = React.useState('auth');
  const [token, setToken] = React.useState('');

  React.useEffect(() => {
    const theme = localStorage.getItem('obs_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const t = localStorage.getItem('obs_token') || '';
    if (t) {
      setToken(t);
      axios.defaults.headers.common['x-session-token'] = t;
      setView('dashboard');
    } else {
      setView('auth');
    }
  }, []);

  function onLoggedIn(tok) {
    Model.saveTokenLocal(tok);
    setToken(tok);
    setView('dashboard');
  }

  function onLoggedOut() {
    Model.clearTokenLocal();
    setToken('');
    setView('auth');
  }

  return e('div', { className: 'app ' + view },
    view === 'auth' ? e(AuthView, { onSuccess: onLoggedIn }) : e(DashboardView, { token, onLogout: onLoggedOut })
  );
}

ReactDOM.createRoot(document.getElementById('appRoot')).render(e(AppRoot));
