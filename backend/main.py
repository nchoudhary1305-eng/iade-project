from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import sqlite3
import pandas as pd
import numpy as np
import io
import datetime

app = FastAPI(title="IADE Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "iade_database.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS observations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            obs_id TEXT UNIQUE,
            timestamp TEXT,
            location TEXT,
            category TEXT,
            incidence_rate REAL,
            mortality_count INTEGER,
            soil_moisture REAL,
            data_source TEXT,
            quality_indicator TEXT,
            is_anomaly INTEGER DEFAULT 0,
            anomaly_score REAL DEFAULT 0.0,
            anomaly_reason TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_code TEXT UNIQUE,
            title TEXT,
            domain TEXT,
            risk_category TEXT,
            risk_score REAL,
            status TEXT,
            evidence_summary TEXT,
            lab_status TEXT,
            created_at TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS diagnostics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sample_id TEXT UNIQUE,
            incident_code TEXT,
            collection_date TEXT,
            receiving_lab TEXT,
            test_method TEXT,
            result_status TEXT,
            verification_date TEXT,
            authorized_reviewer TEXT,
            reference_note TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_code TEXT,
            action_title TEXT,
            rationale TEXT,
            responsible_role TEXT,
            priority TEXT,
            review_status TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()

class ObservationModel(BaseModel):
    obs_id: str
    timestamp: str
    location: str
    category: str
    incidence_rate: float
    mortality_count: int
    soil_moisture: float
    data_source: str
    quality_indicator: str

class RiskAssessmentInput(BaseModel):
    incident_code: str
    title: str
    domain: str
    bio_evidence_score: float = Field(..., ge=0, le=10)
    cyber_evidence_score: float = Field(..., ge=0, le=10)
    supply_evidence_score: float = Field(..., ge=0, le=10)
    data_quality_modifier: float = Field(1.0, ge=0.5, le=1.5)

class DiagnosticModel(BaseModel):
    sample_id: str
    incident_code: str
    collection_date: str
    receiving_lab: str
    test_method: str
    result_status: str
    verification_date: str
    authorized_reviewer: str
    reference_note: str

class RecommendationModel(BaseModel):
    incident_code: str
    action_title: str
    rationale: str
    responsible_role: str
    priority: str
    review_status: str

@app.post("/api/observations/ingest")
def ingest_observation(obs: ObservationModel):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    mean_incidence = 2.5 
    std_incidence = 1.1  
    z_score = (obs.incidence_rate - mean_incidence) / (std_incidence if std_incidence > 0 else 1)
    is_anomaly = 1 if z_score > 2.5 or obs.mortality_count > 15 else 0
    anomaly_score = round(max(0.0, min(100.0, (z_score * 25.0))), 2) if is_anomaly else round(max(0.0, z_score * 10.0), 2)
    reason = f"Incidence rate z-score ({z_score:.2f}) exceeds historical threshold." if is_anomaly else "Normal baseline behavior."

    try:
        cursor.execute("""
            INSERT INTO observations (obs_id, timestamp, location, category, incidence_rate, mortality_count, soil_moisture, data_source, quality_indicator, is_anomaly, anomaly_score, anomaly_reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (obs.obs_id, obs.timestamp, obs.location, obs.category, obs.incidence_rate, obs.mortality_count, obs.soil_moisture, obs.data_source, obs.quality_indicator, is_anomaly, anomaly_score, reason))
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Observation ID already exists.")
    finally:
        conn.close()
    return {"status": "success", "is_anomaly": bool(is_anomaly), "anomaly_score": anomaly_score, "reason": reason}

@app.get("/api/observations")
def get_observations():
    conn = sqlite3.connect(DB_FILE)
    df = pd.read_sql_query("SELECT * FROM observations ORDER BY id DESC", conn)
    conn.close()
    return df.to_dict(orient="records")

@app.post("/api/risk/evaluate")
def evaluate_risk(data: RiskAssessmentInput):
    raw_score = (
        (data.bio_evidence_score * 0.40) +
        (data.cyber_evidence_score * 0.35) +
        (data.supply_evidence_score * 0.25)
    ) * data.data_quality_modifier
    risk_score = round(min(100.0, max(0.0, raw_score * 10)), 2)
    if risk_score >= 80:
        category = "Critical concern"
    elif risk_score >= 60:
        category = "High concern"
    elif risk_score >= 40:
        category = "Moderate concern"
    elif risk_score >= 20:
        category = "Low concern"
    else:
        category = "Informational"

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO incidents (incident_code, title, domain, risk_category, risk_score, status, evidence_summary, lab_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (data.incident_code, data.title, data.domain, category, risk_score, "Open", f"Bio:{data.bio_evidence_score}, Cyber:{data.cyber_evidence_score}, Supply:{data.supply_evidence_score}", "Pending Verification", datetime.datetime.now().isoformat()))
    conn.commit()
    conn.close()
    return {"incident_code": data.incident_code, "risk_score": risk_score, "risk_category": category}

@app.get("/api/incidents")
def get_incidents():
    conn = sqlite3.connect(DB_FILE)
    df = pd.read_sql_query("SELECT * FROM incidents", conn)
    conn.close()
    return df.to_dict(orient="records")

@app.post("/api/diagnostics")
def add_diagnostic(diag: DiagnosticModel):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO diagnostics (sample_id, incident_code, collection_date, receiving_lab, test_method, result_status, verification_date, authorized_reviewer, reference_note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (diag.sample_id, diag.incident_code, diag.collection_date, diag.receiving_lab, diag.test_method, diag.result_status, diag.verification_date, diag.authorized_reviewer, diag.reference_note))
    conn.commit()
    conn.close()
    return {"status": "diagnostic record saved successfully"}

@app.get("/api/diagnostics")
def get_diagnostics():
    conn = sqlite3.connect(DB_FILE)
    df = pd.read_sql_query("SELECT * FROM diagnostics", conn)
    conn.close()
    return df.to_dict(orient="records")

@app.post("/api/recommendations")
def add_recommendation(rec: RecommendationModel):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO recommendations (incident_code, action_title, rationale, responsible_role, priority, review_status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (rec.incident_code, rec.action_title, rec.rationale, rec.responsible_role, rec.priority, rec.review_status))
    conn.commit()
    conn.close()
    return {"status": "recommendation generated successfully"}

@app.get("/api/recommendations")
def get_recommendations():
    conn = sqlite3.connect(DB_FILE)
    df = pd.read_sql_query("SELECT * FROM recommendations", conn)
    conn.close()
    return df.to_dict(orient="records")
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

