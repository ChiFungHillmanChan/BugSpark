from __future__ import annotations

from fastapi import APIRouter

from app.routers.admin_beta import router as beta_router
from app.routers.admin_settings import router as settings_router
from app.routers.admin_stats import router as stats_router
from app.routers.admin_users import router as users_router

router = APIRouter(prefix="/admin", tags=["admin"])

router.include_router(users_router)
router.include_router(stats_router)
router.include_router(beta_router)
router.include_router(settings_router)
