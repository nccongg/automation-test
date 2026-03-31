# Browser Agent - Setup & Run Guide

This guide explains how to install and run the agent on Windows and macOS.

---

# First Time Setup (Install Dependencies + Run)

## Windows

```bat
# Create virtual environment
python -m venv .venv

# Activate environment
.venv\Scripts\activate

# Upgrade pip (recommended)
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Run agent
uvicorn app.main:app --port 8001
```

---

## macOS

```bash
# Create virtual environment (Python 3.11 recommended)
python3.11 -m venv venv

# Activate environment
source venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Run agent
uvicorn app.main:app --port 8001
```

---

# Next Runs (Only Run)

## Windows

```bat
.venv\Scripts\activate
uvicorn app.main:app --port 8001
```

---

## macOS

```bash
source venv/bin/activate
uvicorn app.main:app --port 8001
uvicorn app.main:app --port 8001 --reload --log-level debug
```

---

# Access Application

Open your browser and go to:

```
http://localhost:8001
```

---

# Notes

- Make sure you are using Python 3.11 or higher
- Always activate the virtual environment before running
- If dependencies change, run:

  ```
  pip install -r requirements.txt
  ```

---

# Quick Run (One-liner)

## Windows

```bat
.venv\Scripts\activate && uvicorn app.main:app --port 8001
```

## macOS

```bash
source venv/bin/activate && uvicorn app.main:app --port 8001
```
