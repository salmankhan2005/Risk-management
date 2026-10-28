import random
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Tuple, Dict
from ..domain.models import Customer, KYCProfile, Account, Merchant, Device, CustomerDevice

FIRST_NAMES = [
    "Aarav", "Aditi", "Rohan", "Priya", "Vikram", "Ananya", "Siddharth", "Neha",
    "Rahul", "Pooja", "Arjun", "Kavita", "Karan", "Meera", "Amit", "Sneha",
    "Rajesh", "Sunita", "Deepak", "Ritu", "Alok", "Divya", "Suresh", "Geeta"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Mehta", "Iyer", "Nair", "Reddy", "Rao",
    "Kapoor", "Malhotra", "Joshi", "Bhat", "Deshmukh", "Choudhury", "Gupta", "Singh"
]

MERCHANT_NAMES = [
    ("Zenith Electronics", "ELEC", "Low", False),
    ("Royal Jewellers", "JEWL", "High", True),
    ("Grand Casino Goa", "GMBL", "Critical", True),
    ("CryptoPay Hub", "CRYP", "High", True),
    ("Aura Luxury Boutique", "LUXR", "Medium", False),
    ("SuperMart Express", "RETL", "Low", False),
    ("Global Air Travels", "TRAV", "Medium", False),
    ("QuickBite Diners", "FOOD", "Low", False),
    ("Apex Digital Gadgets", "ELEC", "High", True),
    ("Premier Gold Bullion", "GOLD", "High", True),
]

DEVICE_TYPES = ["Mobile", "Desktop", "Tablet"]
OS_LIST = ["Android 14", "iOS 17.4", "Windows 11", "macOS Sonoma", "Ubuntu 22.04"]
BROWSERS = ["Chrome 122", "Safari 17", "Firefox 123", "Edge 122"]
COUNTRIES = ["IN", "IN", "IN", "IN", "US", "SG", "AE", "GB"]

def generate_master_dataset(
    seed: str,
    target_customers: int = 5000,
    target_accounts: int = 7000
) -> Tuple[List[Customer], List[KYCProfile], List[Account], List[Merchant], List[Device], List[CustomerDevice]]:
    """
    Deterministically generates master data entities based on random seed.
    """
    rng = random.Random(seed + "_master")

    base_time = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)

    # 1. Merchants (50 fixed merchants)
    merchants: List[Merchant] = []
    for i in range(1, 51):
        m_name, m_cat, m_risk, is_high = MERCHANT_NAMES[(i - 1) % len(MERCHANT_NAMES)]
        m_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_merchant_{i}")
        merchants.append(
            Merchant(
                id=m_id,
                business_id=f"MER-{i:05d}",
                name=f"{m_name} #{i}",
                category=m_cat,
                risk_category=m_risk,
                country=rng.choice(["IN", "SG", "AE", "US"]),
                is_high_risk=is_high
            )
        )

    # 2. Devices (approx 1.2 * customers)
    num_devices = int(target_customers * 1.2)
    devices: List[Device] = []
    for i in range(1, num_devices + 1):
        d_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_device_{i}")
        d_type = rng.choice(DEVICE_TYPES)
        ip = f"{rng.randint(10, 200)}.{rng.randint(1, 254)}.{rng.randint(1, 254)}.{rng.randint(1, 254)}"
        devices.append(
            Device(
                id=d_id,
                fingerprint=f"fp_{uuid.uuid5(uuid.NAMESPACE_DNS, f'fp_{i}')}",
                device_type=d_type,
                os=rng.choice(OS_LIST),
                browser=rng.choice(BROWSERS),
                ip_address=ip,
                geo_country=rng.choice(COUNTRIES),
                is_known_proxy=(rng.random() < 0.05),
                first_seen_at=base_time + timedelta(days=rng.randint(0, 180), minutes=rng.randint(0, 1440))
            )
        )

    # 3. Customers & KYC Profiles & CustomerDevices
    customers: List[Customer] = []
    kyc_profiles: List[KYCProfile] = []
    customer_devices: List[CustomerDevice] = []

    risk_tiers = ["LOW", "LOW", "LOW", "MEDIUM", "MEDIUM", "HIGH", "CRITICAL"]

    for i in range(1, target_customers + 1):
        c_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_customer_{i}")
        fn = rng.choice(FIRST_NAMES)
        ln = rng.choice(LAST_NAMES)
        b_id = f"CUS-{i:06d}"
        created = base_time + timedelta(days=rng.randint(0, 180), minutes=rng.randint(0, 1440))
        tier = rng.choice(risk_tiers)

        customer = Customer(
            id=c_id,
            business_id=b_id,
            first_name=fn,
            last_name=ln,
            email=f"{fn.lower()}.{ln.lower()}{i}@example.com",
            phone=f"+91{rng.randint(7000000000, 9999999999)}",
            country="IN",
            risk_tier=tier,
            created_at=created
        )
        customers.append(customer)

        # KYC Profile
        doc_type = rng.choice(["Aadhaar", "PAN", "Passport", "Voter ID"])
        doc_masked = f"XXXX-XXXX-{rng.randint(1000, 9999)}"
        kyc = KYCProfile(
            id=uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_kyc_{i}"),
            customer_id=c_id,
            document_type=doc_type,
            document_number_masked=doc_masked,
            id_score=rng.randint(75, 99),
            pep_check_passed=(rng.random() > 0.02),
            sanction_check_passed=True,
            verified_at=created + timedelta(hours=rng.randint(1, 24))
        )
        kyc_profiles.append(kyc)

        # Customer Device Link (at least 1 device per customer)
        dev_index = (i - 1) % len(devices)
        primary_dev = devices[dev_index]
        cd_link = CustomerDevice(
            id=uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_custdev_{i}_1"),
            customer_id=c_id,
            device_id=primary_dev.id,
            first_used_at=created,
            last_used_at=created + timedelta(days=30),
            is_primary=True
        )
        customer_devices.append(cd_link)

    # 4. Accounts (target_accounts distributed across customers)
    accounts: List[Account] = []
    account_types = ["SAVINGS", "SAVINGS", "CURRENT", "CORPORATE"]

    account_counter = 1
    # Each customer gets at least 1 account
    for c_idx, cust in enumerate(customers, 1):
        acc_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_account_{account_counter}")
        acc_bid = f"ACC-CUS-{c_idx:06d}-01"
        acc_type = rng.choice(account_types)
        allow_od = (acc_type in ["CURRENT", "CORPORATE"] and rng.random() < 0.6)
        od_limit = Decimal("50000.00") if allow_od else Decimal("0.00")
        init_balance = Decimal(str(rng.randint(5000, 150000)))

        acc = Account(
            id=acc_id,
            business_id=acc_bid,
            primary_customer_id=cust.id,
            account_type=acc_type,
            currency="INR",
            status="ACTIVE",
            current_balance=init_balance,
            overdraft_limit=od_limit,
            allow_overdraft=allow_od,
            opened_at=cust.created_at + timedelta(minutes=10)
        )
        accounts.append(acc)
        account_counter += 1

    # Remaining accounts distributed to random customers (secondary accounts)
    customer_acc_counts: Dict[int, int] = {i: 1 for i in range(1, target_customers + 1)}
    while len(accounts) < target_accounts:
        c_idx = rng.randint(1, target_customers)
        cust = customers[c_idx - 1]
        customer_acc_counts[c_idx] += 1
        seq = customer_acc_counts[c_idx]
        acc_bid = f"ACC-CUS-{c_idx:06d}-{seq:02d}"
        acc_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_account_{account_counter}")
        acc_type = "CURRENT"
        allow_od = True
        od_limit = Decimal("25000.00")
        init_balance = Decimal(str(rng.randint(10000, 500000)))

        acc = Account(
            id=acc_id,
            business_id=acc_bid,
            primary_customer_id=cust.id,
            account_type=acc_type,
            currency="INR",
            status="ACTIVE",
            current_balance=init_balance,
            overdraft_limit=od_limit,
            allow_overdraft=allow_od,
            opened_at=cust.created_at + timedelta(days=5)
        )
        accounts.append(acc)
        account_counter += 1

    return customers, kyc_profiles, accounts, merchants, devices, customer_devices
