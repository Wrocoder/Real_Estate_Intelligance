from domarion.teryt_registry import canonical_locality, location_metadata


def test_official_simc_names_normalize_case_and_polish_diacritics() -> None:
    assert canonical_locality("BRODY", teryt="0809") == "Brody"
    assert canonical_locality("adamowo", teryt="2010") == "Adamowo"
    assert canonical_locality("Wroclaw", teryt="0264") == "Wrocław"


def test_similar_names_are_not_fuzzy_merged() -> None:
    assert canonical_locality("Annapol", teryt="3006") == "Annapol"
    assert canonical_locality("Annopol", teryt="0607") == "Annopol"


def test_same_named_localities_keep_distinct_teryt_identity_and_context() -> None:
    lubuskie = location_metadata("rcn-0809-brody-city", "BRODY")
    wielkopolskie = location_metadata("rcn-3015-brody-city", "Brody")

    assert lubuskie.city == wielkopolskie.city == "Brody"
    assert lubuskie.location_id.startswith("simc:")
    assert wielkopolskie.location_id.startswith("simc:")
    assert lubuskie.location_id != wielkopolskie.location_id
    assert lubuskie.county != wielkopolskie.county
    assert lubuskie.voivodeship == "lubuskie"
    assert wielkopolskie.voivodeship == "wielkopolskie"


def test_major_city_districts_share_the_city_location_identity() -> None:
    city = location_metadata("rcn-2261-gdansk-city", "Gdańsk")
    district = location_metadata("gdansk-wrzeszcz", "Gdańsk")

    assert city.location_id == district.location_id
    assert city.location_id.startswith("simc:")


def test_different_localities_in_one_county_have_distinct_simc_ids() -> None:
    klodzko = location_metadata("rcn-0208-klodzko-city", "Kłodzko")
    nowa_ruda = location_metadata("rcn-0208-nowa-ruda-city", "Nowa Ruda")

    assert klodzko.location_id.startswith("simc:")
    assert nowa_ruda.location_id.startswith("simc:")
    assert klodzko.location_id != nowa_ruda.location_id
