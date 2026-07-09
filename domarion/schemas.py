from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

MarketType = Literal["primary", "secondary"]
ReportAudience = Literal["buyer", "realtor", "investor"]
ReportFormat = Literal["json", "html"]


class PriceHistoryPoint(BaseModel):
    observed_at: date
    price: int
    price_per_m2: int


class Listing(BaseModel):
    id: str
    title: str
    source_name: str
    source_url: str
    city: str
    district: str
    area_id: str
    municipality: str
    address: str
    market_type: MarketType
    price: int
    currency: str = "PLN"
    area_m2: float
    price_per_m2: int
    rooms: int
    floor: int | None = None
    building_floors: int | None = None
    building_year: int | None = None
    first_seen_at: date
    last_seen_at: date
    days_on_market: int
    price_reductions: int
    price_increases: int
    relisted: bool
    lat: float
    lon: float
    distance_to_center_km: float
    nearest_stop_m: int
    nearest_school_m: int
    nearest_major_road_m: int
    nearest_industrial_zone_m: int
    parks_within_1km: int
    schools_within_1km: int
    planned_investments_within_2km: int
    data_quality_score: int = Field(ge=0, le=100)


class AreaStatistics(BaseModel):
    area_id: str
    name: str
    city: str
    median_price_per_m2: int
    average_price_per_m2: int
    active_listings: int
    new_listings_30d: int
    removed_listings_30d: int
    average_days_on_market: int
    price_change_90d_pct: float
    supply_change_90d_pct: float


class ScoreBreakdown(BaseModel):
    price_position: int
    area_trend: int
    transport: int
    future_infrastructure: int
    liquidity: int
    lifestyle_infrastructure: int
    rental_potential: int
    data_quality: int
    risk_penalty: int


class PropertyScores(BaseModel):
    investment_score: int = Field(ge=0, le=100)
    risk_score: int = Field(ge=0, le=100)
    negotiation_score: int = Field(ge=0, le=100)
    liquidity_score: int = Field(ge=0, le=100)
    rental_potential_score: int = Field(ge=0, le=100)
    fair_price_low: int
    fair_price_mid: int
    fair_price_high: int
    price_delta_to_fair_mid_pct: float
    breakdown: ScoreBreakdown
    reasons: list[str]
    warnings: list[str]


class ListingAnalysis(BaseModel):
    listing: Listing
    area_statistics: AreaStatistics
    price_history: list[PriceHistoryPoint]
    comparables: list[Listing]
    scores: PropertyScores
    insights: list[str]
    negotiation_arguments: list[str]
    data_quality_notes: list[str]


class CompareRequest(BaseModel):
    listing_ids: list[str] = Field(min_length=2, max_length=5)


class CompareResponse(BaseModel):
    items: list[ListingAnalysis]


class ReportRequest(BaseModel):
    listing_id: str
    audience: ReportAudience = "buyer"


class GenerateReportRequest(ReportRequest):
    report_format: ReportFormat = "html"


class ReportSection(BaseModel):
    title: str
    items: list[str]


class ObjectReport(BaseModel):
    listing_id: str
    audience: ReportAudience
    summary: str
    sections: list[ReportSection]
    disclaimer: str


class GeneratedReportCreate(BaseModel):
    listing_id: str
    audience: ReportAudience
    report_format: ReportFormat
    content_type: str
    title: str
    summary: str
    content: str
    report_metadata: dict = Field(default_factory=dict)


class GeneratedReportListItem(BaseModel):
    id: str
    listing_id: str
    audience: ReportAudience
    report_format: ReportFormat
    content_type: str
    title: str
    summary: str
    created_at: datetime


class GeneratedReport(GeneratedReportListItem):
    content: str
    report_metadata: dict
