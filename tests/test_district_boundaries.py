import struct
from pathlib import Path

import pytest

from domarion.ingestion import district_boundaries


@pytest.mark.parametrize("field", ["NAZWA_DZIELNICY", "DZIELNICY"])
def test_boundary_name_supports_verified_city_source_fields(field: str) -> None:
    assert district_boundaries._boundary_name({field: "Mokotów"}) == "Mokotów"


def test_read_dbf_reports_invalid_source_encoding(tmp_path: Path) -> None:
    payload = bytearray(67)
    struct.pack_into("<I", payload, 4, 1)
    struct.pack_into("<H", payload, 8, 65)
    struct.pack_into("<H", payload, 10, 2)
    payload[32:36] = b"NAME"
    payload[43] = ord("C")
    payload[48] = 1
    payload[64] = 0x0D
    payload[65:67] = b" \xff"
    path = tmp_path / "districts.dbf"
    path.write_bytes(payload)

    with pytest.raises(district_boundaries.DistrictBoundaryError, match="Cannot decode"):
        district_boundaries._read_dbf(path)
