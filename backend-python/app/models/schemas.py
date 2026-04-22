from pydantic import BaseModel
from typing import Optional, List


class DashboardStats(BaseModel):
    total_projects: int = 0
    total_sprints: int = 0
    approved: int = 0
    bugs: int = 0
    blocked: int = 0
    rejected: int = 0
    pending_approval: int = 0


class ProjectStats(BaseModel):
    project_id: int
    project_name: str
    approved: int = 0
    bugs: int = 0
    blocked: int = 0
    rejected: int = 0
    pending_approval: int = 0
    total: int = 0


class UploadResponse(BaseModel):
    filename: str
    url: str
    size: int
