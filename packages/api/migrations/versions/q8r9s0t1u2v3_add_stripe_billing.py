"""add stripe billing: update plan enum, user stripe fields, subscriptions, webhook events

Revision ID: q8r9s0t1u2v3
Revises: p7q8r9s0t1u2
Create Date: 2026-02-12

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "q8r9s0t1u2v3"
down_revision: Union[str, None] = "p7q8r9s0t1u2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Migrate plan enum values (VARCHAR, not native enum) ---
    # The plan column uses native_enum=False (VARCHAR), so no ALTER TYPE needed.
    # Just migrate existing 'pro' values to 'starter'.
    op.execute("UPDATE users SET plan = 'starter' WHERE plan = 'pro'")

    # --- Add Stripe fields to users table ---
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("stripe_subscription_id", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("subscription_status", sa.String(50), nullable=True))
    op.add_column(
        "users",
        sa.Column("cancel_at_period_end", sa.Boolean(), nullable=False, server_default="false"),
    )

    op.create_index("ix_users_stripe_customer_id", "users", ["stripe_customer_id"], unique=True)
    op.create_index("ix_users_stripe_subscription_id", "users", ["stripe_subscription_id"])

    # --- Create subscriptions table ---
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=False),
        sa.Column("stripe_customer_id", sa.String(255), nullable=False),
        sa.Column("stripe_price_id", sa.String(255), nullable=False),
        sa.Column("plan", sa.String(20), nullable=False),
        sa.Column("billing_interval", sa.String(20), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("cancel_at_period_end", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("canceled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])
    op.create_index("ix_subscriptions_stripe_subscription_id", "subscriptions", ["stripe_subscription_id"], unique=True)
    op.create_index("ix_subscriptions_stripe_customer_id", "subscriptions", ["stripe_customer_id"])

    # --- Create stripe_webhook_events table ---
    op.create_table(
        "stripe_webhook_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("stripe_event_id", sa.String(255), nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("processed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.String(1000), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_stripe_webhook_events_stripe_event_id", "stripe_webhook_events", ["stripe_event_id"], unique=True)
    op.create_index("ix_stripe_webhook_events_event_type", "stripe_webhook_events", ["event_type"])
    op.create_index("ix_stripe_webhook_events_processed", "stripe_webhook_events", ["processed"])


def downgrade() -> None:
    # Drop stripe_webhook_events
    op.drop_index("ix_stripe_webhook_events_processed", "stripe_webhook_events")
    op.drop_index("ix_stripe_webhook_events_event_type", "stripe_webhook_events")
    op.drop_index("ix_stripe_webhook_events_stripe_event_id", "stripe_webhook_events")
    op.drop_table("stripe_webhook_events")

    # Drop subscriptions
    op.drop_index("ix_subscriptions_stripe_customer_id", "subscriptions")
    op.drop_index("ix_subscriptions_stripe_subscription_id", "subscriptions")
    op.drop_index("ix_subscriptions_user_id", "subscriptions")
    op.drop_table("subscriptions")

    # Drop Stripe fields from users
    op.drop_index("ix_users_stripe_subscription_id", "users")
    op.drop_index("ix_users_stripe_customer_id", "users")
    op.drop_column("users", "cancel_at_period_end")
    op.drop_column("users", "subscription_status")
    op.drop_column("users", "stripe_subscription_id")
    op.drop_column("users", "stripe_customer_id")

    # Reverse plan migration
    op.execute("UPDATE users SET plan = 'pro' WHERE plan = 'starter'")
