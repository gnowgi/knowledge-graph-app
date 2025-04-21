# Knowledge Map App

**Version**: 0.1  
**License**: AGPLv3

## Overview

The Knowledge Map App is a progressive web application (PWA) that enables students to build and explore semantic knowledge maps. The core idea is to express knowledge through **relations between concepts**, which are visualized as propositions (e.g., "cell is a unit of living organisms").

Built with a **React frontend**, **D3.js for visualization**, and a **Flask + SQLite backend**, the app supports node creation, semantic relation types, and graph expansion in an intuitive and educationally meaningful interface.

---

## Features

- 🧠 **Add nodes** with optional AI-generated summaries
- 🔗 **Create semantic relations** between nodes using reusable relation types
- 📚 **Manage relation types** (e.g., symmetric, transitive, inverse name)
- 🌐 **Radial layout** using D3.js
- 🔍 **Searchable node list** with click-to-expand functionality
- 📜 **Proposition view** of relations (subject–predicate–object)
- 🗑 **Inline relation deletion**
- 🧰 Uses SQLite for lightweight data persistence

---

## Folder Structure

```
knowledge-graph-app/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── schema.sql
│   └── db/
│       └── graph.db (excluded from git)
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── GraphView.jsx
│   │   └── RelationTypeManager.jsx
├── .env (excluded from git)
├── .gitignore
├── LICENSE
└── README.md
```

---

## Getting Started

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
sqlite3 db/graph.db < schema.sql
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## License

This project is licensed under the **GNU Affero General Public License v3.0** (see LICENSE file).