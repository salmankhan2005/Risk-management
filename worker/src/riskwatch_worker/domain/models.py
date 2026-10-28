from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4

@dataclass
class Customer:
    id: UUID
    business_id: str
    first_name: str
    last_name: str
    email: str
    phone: str
    country: str
    risk_tier: str  # LOW, MEDIUM, HIGH, CRITICAL
    created_at: datetime

@dataclass
class KYCProfile:
    id: UUID
    customer_id: UUID
    document_type: str
    document_number_masked: str
    id_score: int
    pep_check_passed: bool
    sanction_check_passed: bool
    verified_at: datetime

@dataclass
class Account:
    id: UUID
    business_id: str
    primary_customer_id: UUID
    account_type: str  # SAVINGS, CURRENT, CORPORATE, ESCROW
    currency: str      # INR, USD, EUR
    status: str        # ACTIVE, DORMANT, CLOSED
    current_balance: Decimal
    overdraft_limit: Decimal
    allow_overdraft: bool
    opened_at: datetime
    closed_at: Optional[datetime] = None

@dataclass
class Merchant:
    id: UUID
    business_id: str
    name: str
    category: str
    risk_category: str
    country: str
    is_high_risk: bool

@dataclass
class Device:
    id: UUID
    fingerprint: str
    device_type: str
    os: str
    browser: str
    ip_address: str
    geo_country: str
    is_known_proxy: bool
    first_seen_at: datetime

@dataclass
class CustomerDevice:
    id: UUID
    customer_id: UUID
    device_id: UUID
    first_used_at: datetime
    last_used_at: datetime
    is_primary: bool

@dataclass
class Transaction:
    id: UUID
    business_id: str
    account_id: UUID
    type: str  # DEBIT, CREDIT
    amount: Decimal
    signed_amount: Decimal
    currency: str
    balance_before: Decimal
    balance_after: Decimal
    status: str  # POSTED, REVERSED, FAILED
    channel: str
    merchant_id: Optional[UUID]
    device_id: Optional[UUID]
    idempotency_key: str
    description: str
    occurred_at: datetime

@dataclass
class TransferLink:
    id: UUID
    transfer_group_id: UUID
    source_transaction_id: UUID
    destination_transaction_id: UUID
    source_account_id: UUID
    destination_account_id: UUID
    amount: Decimal
    currency: str
    status: str  # RECONCILED, IMBALANCED, FAILED
    linked_at: datetime

@dataclass
class RiskEvaluation:
    id: UUID
    rule_version_id: UUID
    entity_type: str
    entity_id: UUID
    triggered: bool
    observed_value: Decimal
    threshold_snapshot: Decimal
    score_awarded: int
    explanation: str
    evaluated_at: datetime
    evidence_payload: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Alert:
    id: UUID
    business_id: str
    account_id: UUID
    customer_id: UUID
    status: str  # OPEN, INVESTIGATING, DISMISSED, ESCALATED
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    aggregate_score: int
    summary: str
    deduplication_key: str
    assigned_to: Optional[UUID]
    created_at: datetime
    resolved_at: Optional[datetime] = None

@dataclass
class Case:
    id: UUID
    business_id: str
    customer_id: UUID
    title: str
    status: str  # OPEN, INVESTIGATING, RESOLVED, CLOSED
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    disposition: Optional[str]
    assigned_to: Optional[UUID]
    version: int
    opened_at: datetime
    closed_at: Optional[datetime] = None

@dataclass
class AnomalyEntry:
    scenario_id: str
    scenario_name: str
    target_entity_type: str
    target_entity_id: str
    target_business_id: str
    expected_validator: str
    expected_result: str
    metadata: Dict[str, Any]

@dataclass
class ValidationCheckResult:
    check_id: str
    category: str
    name: str
    status: str  # PASS, FAIL, WARNING
    severity: str  # INFO, WARNING, ERROR, CRITICAL
    details: str
    failed_count: int = 0
    sample_failed_ids: List[str] = field(default_factory=list)
