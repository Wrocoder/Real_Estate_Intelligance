"""Canonical Polish locality names from the official GUS TERYT register."""

from __future__ import annotations

import csv
import io
import re
import unicodedata
import zipfile
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data" / "teryt"
SIMC_ARCHIVE = DATA_DIR / "SIMC_Urzedowy_2026-09-14.zip"
TERC_ARCHIVE = DATA_DIR / "TERC_Urzedowy_2026-09-14.zip"

MAJOR_CITY_ALIASES = {
    "cracow": "Kraków",
    "gdansk": "Gdańsk",
    "krakow": "Kraków",
    "lodz": "Łódź",
    "poznan": "Poznań",
    "warsaw": "Warszawa",
    "warszawa": "Warszawa",
    "wroclaw": "Wrocław",
}
MAJOR_CITY_NAMES_BY_TERYT = {
    "0264": "Wrocław",
    "0663": "Lublin",
    "1061": "Łódź",
    "1261": "Kraków",
    "1465": "Warszawa",
    "2261": "Gdańsk",
    "3064": "Poznań",
}
MAJOR_CITY_TERYT_BY_SLUG = {
    "wroclaw": "0264",
    "lublin": "0663",
    "lodz": "1061",
    "krakow": "1261",
    "warszawa": "1465",
    "gdansk": "2261",
    "poznan": "3064",
}


@dataclass(frozen=True)
class LocationMetadata:
    location_id: str
    teryt: str | None
    city: str
    county: str | None
    voivodeship: str | None


@dataclass(frozen=True)
class TerytRegistry:
    localities: dict[tuple[str, str], frozenset[tuple[str, str]]]
    county_names: dict[str, str]
    voivodeship_names: dict[str, str]

    def canonical_locality(self, value: str | None, *, teryt: str | None) -> str | None:
        if value is None or not value.strip():
            return MAJOR_CITY_NAMES_BY_TERYT.get((teryt or "")[:4])
        raw = " ".join(value.split())
        alias = MAJOR_CITY_ALIASES.get(_lookup_key(raw))
        if alias is not None:
            return alias
        prefix = (teryt or "")[:4]
        candidates = self.localities.get((prefix, _lookup_key(raw)), frozenset())
        names = {name for name, _ in candidates}
        if len(names) == 1:
            return next(iter(names))
        return _humanize_case(raw)

    def simc_for_locality(self, value: str, *, teryt: str | None) -> str | None:
        candidates = self.localities.get(((teryt or "")[:4], _lookup_key(value)), frozenset())
        codes = {code for _, code in candidates if code}
        if len(codes) == 1:
            return next(iter(codes))
        return None

    def county_for_teryt(self, teryt: str | None) -> str | None:
        return self.county_names.get((teryt or "")[:4])

    def voivodeship_for_teryt(self, teryt: str | None) -> str | None:
        return self.voivodeship_names.get((teryt or "")[:2])


def canonical_locality(value: str | None, *, teryt: str | None) -> str | None:
    return get_teryt_registry().canonical_locality(value, teryt=teryt)


def location_metadata(area_id: str, city: str) -> LocationMetadata:
    teryt = _teryt_from_area_id(area_id)
    registry = get_teryt_registry()
    canonical_city = registry.canonical_locality(city, teryt=teryt) or city
    simc = registry.simc_for_locality(canonical_city, teryt=teryt)
    if simc:
        location_id = f"simc:{simc}"
    elif teryt:
        location_id = f"teryt-area:{teryt}:{_lookup_key(canonical_city)}"
    else:
        location_id = f"city:{_lookup_key(canonical_city)}"
    return LocationMetadata(
        location_id=location_id,
        teryt=teryt,
        city=canonical_city,
        county=registry.county_for_teryt(teryt),
        voivodeship=registry.voivodeship_for_teryt(teryt),
    )


@lru_cache(maxsize=1)
def get_teryt_registry() -> TerytRegistry:
    localities: dict[tuple[str, str], set[tuple[str, str]]] = {}
    for row in _read_csv_archive(SIMC_ARCHIVE):
        name = row.get("NAZWA", "").strip()
        code = row.get("SYM", "").strip()
        prefix = f"{row.get('WOJ', '')}{row.get('POW', '')}"
        if name and code and len(prefix) == 4:
            localities.setdefault((prefix, _lookup_key(name)), set()).add((name, code))

    county_names: dict[str, str] = {}
    voivodeship_names: dict[str, str] = {}
    for row in _read_csv_archive(TERC_ARCHIVE):
        woj = row.get("WOJ", "").strip()
        powiat = row.get("POW", "").strip()
        gmina = row.get("GMI", "").strip()
        name = row.get("NAZWA", "").strip()
        if woj and not powiat and not gmina:
            voivodeship_names[woj] = name.lower()
        elif woj and powiat and not gmina:
            county_names[f"{woj}{powiat}"] = name

    return TerytRegistry(
        localities={key: frozenset(values) for key, values in localities.items()},
        county_names=county_names,
        voivodeship_names=voivodeship_names,
    )


def _read_csv_archive(path: Path) -> csv.DictReader:
    with zipfile.ZipFile(path) as archive:
        csv_name = next(name for name in archive.namelist() if name.lower().endswith(".csv"))
        content = archive.read(csv_name).decode("utf-8-sig")
    return csv.DictReader(io.StringIO(content), delimiter=";")


def _lookup_key(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    ascii_letters = "".join(char for char in decomposed if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", ascii_letters.casefold()).strip()


def _humanize_case(value: str) -> str:
    if value.isupper() or value.islower():
        return value.title()
    return value


def _teryt_from_area_id(area_id: str) -> str | None:
    match = re.match(r"rcn-(\d{4,})-", area_id)
    if match:
        return match.group(1)[:4]
    return next(
        (
            teryt
            for slug, teryt in MAJOR_CITY_TERYT_BY_SLUG.items()
            if area_id == f"{slug}-city" or area_id.startswith(f"{slug}-")
        ),
        None,
    )
