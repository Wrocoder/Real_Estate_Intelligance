from collections.abc import Iterator

from domarion.core import get_settings
from domarion.db.session import SessionLocal
from domarion.partner_referral_store.base import PartnerReferralStore
from domarion.partner_referral_store.memory import InMemoryPartnerReferralStore
from domarion.partner_referral_store.postgres import PostgresPartnerReferralStore

memory_partner_referral_store = InMemoryPartnerReferralStore()


def get_partner_referral_store() -> Iterator[PartnerReferralStore]:
    settings = get_settings()

    if settings.partner_referral_store_backend == "memory":
        yield memory_partner_referral_store
        return

    if settings.partner_referral_store_backend == "postgres":
        session = SessionLocal()
        try:
            yield PostgresPartnerReferralStore(session)
        finally:
            session.close()
        return

    raise RuntimeError("Unsupported PARTNER_REFERRAL_STORE_BACKEND. Use 'memory' or 'postgres'.")
