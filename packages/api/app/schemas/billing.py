from __future__ import annotations

from datetime import datetime

from pydantic import Field

from app.schemas import CamelModel


class CreateCheckoutSessionRequest(CamelModel):
    plan: str = Field(..., pattern="^(starter|team)$")
    billing_interval: str = Field(..., pattern="^(month|year)$")


class CreateCheckoutSessionResponse(CamelModel):
    checkout_url: str
    client_secret: str
    session_id: str


class ChangePlanRequest(CamelModel):
    new_plan: str = Field(..., pattern="^(free|starter|team)$")
    billing_interval: str | None = Field(default=None, pattern="^(month|year)$")


class SubscriptionResponse(CamelModel):
    plan: str
    status: str | None
    current_period_end: datetime | None = None
    cancel_at_period_end: bool
    billing_interval: str | None = None
    amount: int | None = None


class InvoiceResponse(CamelModel):
    id: str
    date: datetime
    amount: int
    status: str
    invoice_pdf: str | None = None


class CancelSubscriptionResponse(CamelModel):
    message: str
    cancel_at: datetime | None = None


class ReactivateSubscriptionResponse(CamelModel):
    message: str
    plan: str
    status: str
