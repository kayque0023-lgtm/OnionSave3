import sqlite3
import os
from fastapi import APIRouter, Query, HTTPException
from app.models.schemas import DashboardStats, ProjectStats

router = APIRouter()

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "..", "backend-node", "qualiqa.db")


def get_db_connection():
    """Conecta ao mesmo banco SQLite do Node.js"""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=503, detail="Banco de dados não encontrado. Inicie o servidor Node.js primeiro.")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(user_id: int = Query(..., description="ID do usuário")):
    """Retorna estatísticas agregadas do dashboard"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # Total de projetos
        cursor.execute("SELECT COUNT(*) FROM projects WHERE user_id = ?", (user_id,))
        total_projects = cursor.fetchone()[0]

        # Total de sprints
        cursor.execute("""
            SELECT COUNT(*) FROM sprints s
            JOIN projects p ON s.project_id = p.id
            WHERE p.user_id = ?
        """, (user_id,))
        total_sprints = cursor.fetchone()[0]

        # Status counts
        statuses = {}
        for status in ['approved', 'bug', 'blocked', 'rejected', 'pending_approval']:
            cursor.execute("""
                SELECT COUNT(*) FROM sprints s
                JOIN projects p ON s.project_id = p.id
                WHERE p.user_id = ? AND s.status = ?
            """, (user_id, status))
            statuses[status] = cursor.fetchone()[0]

        return DashboardStats(
            total_projects=total_projects,
            total_sprints=total_sprints,
            approved=statuses.get('approved', 0),
            bugs=statuses.get('bug', 0),
            blocked=statuses.get('blocked', 0),
            rejected=statuses.get('rejected', 0),
            pending_approval=statuses.get('pending_approval', 0)
        )
    finally:
        conn.close()


@router.get("/project/{project_id}", response_model=ProjectStats)
def get_project_stats(project_id: int):
    """Retorna estatísticas de um projeto específico"""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM projects WHERE id = ?", (project_id,))
        project = cursor.fetchone()
        if not project:
            raise HTTPException(status_code=404, detail="Projeto não encontrado")

        statuses = {}
        for status in ['approved', 'bug', 'blocked', 'rejected', 'pending_approval']:
            cursor.execute(
                "SELECT COUNT(*) FROM sprints WHERE project_id = ? AND status = ?",
                (project_id, status)
            )
            statuses[status] = cursor.fetchone()[0]

        total = sum(statuses.values())

        return ProjectStats(
            project_id=project_id,
            project_name=project[0],
            approved=statuses.get('approved', 0),
            bugs=statuses.get('bug', 0),
            blocked=statuses.get('blocked', 0),
            rejected=statuses.get('rejected', 0),
            pending_approval=statuses.get('pending_approval', 0),
            total=total
        )
    finally:
        conn.close()
