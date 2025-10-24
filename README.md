[README (1).md](https://github.com/user-attachments/files/23114499/README.1.md)
# 🧠 Observability Dashboard

A lightweight full-stack **Observability Platform** built with **Flask** (backend) and **React + Chart.js** (frontend).  
It provides real-time monitoring of **CPU and Memory**, **threshold-based alerts**, and **data visualization** — all running locally.

---

## 🚀 Features

- 🔐 **Authentication**
  - Local Register/Login using Flask + SQLite
  - Session-based token management

- 📊 **Metrics Dashboard**
  - Monitors CPU and Memory in real-time
  - Background collector updates metrics periodically
  - Summary KPIs and charts for quick insights

- ⚙️ **Threshold Configuration**
  - User-defined CPU/Memory alert limits
  - Updates thresholds dynamically

- 🧭 **UI & UX**
  - Clean, responsive layout
  - Light/Dark mode toggle
  - Animated transitions, skeleton loaders
  - Custom popup windows (instead of browser alerts)
  - Pagination for recent alerts (4 per page)

---

## 🏗️ Project Architecture (MVC)

The project follows a **Model–View–Controller (MVC)** structure for clarity and modularity.

```
project_root/
├── src/
│   ├── app.py              # Flask app + collector startup
│   ├── api.py              # RESTful API endpoints
│   ├── db.py               # SQLite connection & helpers
│   ├── auth.py             # Authentication logic
│   └── collector.py        # Background system metrics collector
│
├── frontend/
│   ├── templates/
│   │   └── dashboard.html  # Main HTML entrypoint
│   └── static/
│       ├── css/
│       │   └── style.css   # Styling for login/dashboard
│       └── js/
│           ├── app.js      # Controller (root React mount)
│           ├── model.js    # Handles API and data logic
│           ├── view.js     # React components (AuthView, DashboardView)
│           └── utils.js    # Popup helpers and UI freeze utilities
│
└── data/                   # Auto-created SQLite DB storage
```
Screen shorts of the working model

<img width="1366" height="768" alt="Screenshot (173)" src="https://github.com/user-attachments/assets/a06fa939-feb3-44a5-a728-d507bac10193" />
------login page ----------

<img width="1366" height="768" alt="Screenshot (174)" src="https://github.com/user-attachments/assets/aa960b01-f74c-42b5-9ddd-c93a0e9aea8b" />
--------Dashboard with all the information ---------

<img width="1366" height="768" alt="Screenshot (175)" src="https://github.com/user-attachments/assets/24aea9dc-31a1-4d76-904d-29e6bd0d80e6" />
-------- Visualization of the CPU and Memory utilization with realtime data display ---------------

---

## ⚙️ Installation & Setup

### 1️⃣ Prerequisites
Ensure the following are installed:
- **Python 3.9+**
- **pip**
- (Optional) Node.js for advanced frontend testing

### 2️⃣ Create a Virtual Environment
```bash
python -m venv venv
source venv/bin/activate    # (Windows) venv\Scripts\activate
```

### 3️⃣ Install Dependencies
```bash
pip install -r requirements.txt
```

> **Minimum requirements:**
> ```
> Flask
> Flask-Cors
> psutil
> ```

### 4️⃣ Run the Application
```bash
python src/app.py
```

**Flask runs at:**
```
http://127.0.0.1:5000
```

### 5️⃣ Open in Browser
Visit:
```
http://localhost:5000
```

You’ll see the login page → then the Observability Dashboard.

---

## 📈 API Endpoints

| Endpoint | Method | Description |
|-----------|--------|-------------|
| `/api/register` | POST | Register a new user |
| `/api/login` | POST | Login and return a session token |
| `/api/summary` | GET | Fetch average CPU, total alerts summary |
| `/api/metrics` | GET | Get list of CPU/Memory metric entries |
| `/api/alerts` | GET | Get triggered alerts |
| `/api/thresholds` | GET/POST | Get or update threshold values |

---

## 💻 Frontend Details

### 🧩 **HTML**
- `dashboard.html`  
  Loads all static scripts and styles.
  ```html
  <script type="module" src="{{ url_for('static', filename='js/app.js') }}"></script>
  ```

### 🎨 **CSS**
- `style.css`  
  Contains light/dark themes, card layouts, grid system, popup styles, and responsive rules.

### ⚙️ **JavaScript (Modular ES)**
| File | Role |
|------|------|
| `utils.js` | Popup modals + UI freeze helpers |
| `model.js` | REST API requests + token storage |
| `view.js` | React UI components (AuthView + DashboardView + Charts) |
| `app.js` | Main controller mounting React AppRoot |

### 🔄 **Popup System**
All alerts (e.g., login success, errors, save notifications) use a custom popup:
```js
showPopup("Thresholds updated successfully!", "Success", { type: "success" });
```

### 🧮 **Chart.js Integration**
Displays CPU & Memory over time using a smooth responsive line chart.

---

## ⚙️ Backend Details

### `src/app.py`
Handles:
- Flask app creation and configuration
- Registers `/api` blueprint
- Starts `Collector` thread once (safe for debug reload)
- Serves `dashboard.html` from `frontend/templates`

### `Collector` Thread
- Runs every N seconds (default: 10)
- Reads system CPU/Memory using `psutil`
- Saves to SQLite and triggers alerts if thresholds exceeded

### Database (`src/db.py`)
- SQLite database auto-created under `/data`
- Stores metrics, alerts, and user credentials

---

## 🧭 User Flow

1. **Register/Login**
   - Stored locally in SQLite
2. **Dashboard**
   - Shows system metrics
3. **Chart View**
   - Line graph for CPU/Memory
4. **Threshold Update**
   - Changes trigger alerts
5. **Paginated Alerts**
   - 4 per page with timestamps
6. **Popup Feedback**
   - Success/Error/Info modals
7. **Dark Mode Toggle**
   - Switch between themes instantly
8. **Logout**
   - Clears token and returns to login

---

## 🧠 Tech Stack

| Category | Technology |
|-----------|-------------|
| **Backend** | Flask, Flask-CORS, psutil |
| **Frontend** | React (UMD, ES Modules), Chart.js |
| **Database** | SQLite |
| **Styling** | Custom CSS with light/dark modes |
| **Architecture** | MVC (Model–View–Controller) |

---

## 🧰 Development Notes

- `app.js` mounts `AppRoot` into `<div id="appRoot"></div>`
- Uses native ES modules (`type="module"`) — no build system required
- Tested on Chrome, Firefox, Edge
- Responsive up to mobile (480px)
- Popup modal replaces browser alerts for UX consistency

---

## 🧩 Troubleshooting

**Issue:** *“Unexpected end of input” in Console*  
✅ Fix: The `view.js` file might be truncated. Replace it with the full version provided in the project bundle.

**Issue:** *“Dashboard not found”*  
✅ Fix: Ensure folder structure:
```
frontend/templates/dashboard.html
frontend/static/js/
frontend/static/css/
```

**Issue:** *Collector not starting twice*  
✅ Fix: The logic in `start_collector_once()` ensures single instance in Flask debug mode.

---

## 📦 How to Package & Run

```bash
# Zip it for submission
zip -r observability_dashboard.zip src frontend README.md
```

Then run:
```bash
unzip observability_dashboard.zip
python src/app.py
```

---

## 🧾 Example Output

**Flask Terminal Logs:**
```
[INFO] Collector started (interval=10, cpu_threshold=80.0, mem_threshold=80.0)
 * Running on http://127.0.0.1:5000
```

**Browser:**
- `/` → Login page  
- After login → Dashboard with metrics & alerts  
- Console shows smooth chart updates every 30s

---

## 🧑‍💻 Author
**Kiran Gowda H A**  
Intern — Software Development (SDE Assignment)  
📍 [LinkedIn](https://www.linkedin.com/in/kiran-gowda-h-a--/) • [GitHub](https://github.com/Kiran-Gowda-H-A)

---

## 📜 License
This project is for **educational / assignment** purposes.  
Feel free to modify, extend, or reuse for demonstration.
