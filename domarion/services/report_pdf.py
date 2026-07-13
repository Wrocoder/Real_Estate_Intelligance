import json
import re
import struct
import textwrap
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

from domarion.schemas import GeneratedReport

PAGE_WIDTH = 595
PAGE_HEIGHT = 842
MARGIN_X = 48
TOP_Y = 790
BOTTOM_Y = 48
BODY_FONT_SIZE = 9
TITLE_FONT_SIZE = 16
LINE_HEIGHT = 13
BODY_WRAP_WIDTH = 92
TITLE_WRAP_WIDTH = 58


def render_generated_report_pdf(report: GeneratedReport) -> bytes:
    metadata = [
        f"Report ID: {report.id}",
        f"Listing: {report.listing_id}",
        f"Audience: {report.audience}",
        f"Format: {report.report_format}",
        f"Created: {report.created_at.isoformat()}",
    ]
    if report.report_metadata:
        template = report.report_metadata.get("report_template_name") or report.report_metadata.get(
            "report_template_code"
        )
        if template:
            metadata.append(f"Template: {template}")

    content_lines = report_content_to_lines(report.content, report.content_type)
    return render_report_content_pdf(
        title=report.title,
        summary=report.summary,
        content_lines=content_lines,
        metadata_lines=metadata,
    )


def render_report_content_pdf(
    *,
    title: str,
    summary: str = "",
    content: str | None = None,
    content_type: str = "text/plain",
    content_lines: list[str] | None = None,
    metadata_lines: list[str] | None = None,
) -> bytes:
    lines = _build_report_lines(
        title=title,
        summary=summary,
        metadata_lines=metadata_lines or [],
        content_lines=(
            content_lines
            if content_lines is not None
            else report_content_to_lines(content or "", content_type)
        ),
    )
    document = _PdfDocument(title=title, lines=lines)
    return document.render()


def report_content_to_lines(content: str, content_type: str) -> list[str]:
    if content_type.startswith("text/html"):
        return html_to_text_lines(content)
    if content_type == "application/json" or content.lstrip().startswith(("{", "[")):
        return json_to_text_lines(content)
    return [line.strip() for line in content.splitlines() if line.strip()]


def html_to_text_lines(html: str) -> list[str]:
    parser = _TextExtractor()
    parser.feed(html)
    return parser.lines()


def json_to_text_lines(content: str) -> list[str]:
    try:
        value = json.loads(content)
    except json.JSONDecodeError:
        return [line.strip() for line in content.splitlines() if line.strip()]
    return _json_lines(value)


def _build_report_lines(
    *,
    title: str,
    summary: str,
    metadata_lines: list[str],
    content_lines: list[str],
) -> list[str]:
    lines = ["Domarion Analytics", "", *textwrap.wrap(title, width=TITLE_WRAP_WIDTH)]
    if summary:
        lines.extend(["", "Summary", *textwrap.wrap(summary, width=BODY_WRAP_WIDTH)])
    if metadata_lines:
        lines.extend(["", "Report details", *metadata_lines])
    if content_lines:
        lines.extend(["", "Report content"])
        for line in content_lines:
            if not line:
                lines.append("")
                continue
            wrap_width = (
                TITLE_WRAP_WIDTH
                if len(line) < 70 and not line.startswith("- ")
                else BODY_WRAP_WIDTH
            )
            wrapped = textwrap.wrap(
                line,
                width=wrap_width,
                break_long_words=True,
                break_on_hyphens=False,
            )
            lines.extend(wrapped or [""])
    return lines


class _TextExtractor(HTMLParser):
    _block_tags = {
        "address",
        "article",
        "aside",
        "blockquote",
        "caption",
        "div",
        "fieldset",
        "figcaption",
        "figure",
        "footer",
        "form",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "header",
        "hr",
        "legend",
        "li",
        "main",
        "nav",
        "ol",
        "p",
        "pre",
        "section",
        "table",
        "tbody",
        "td",
        "tfoot",
        "th",
        "thead",
        "tr",
        "ul",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._lines: list[str] = []
        self._current: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript"}:
            self._skip_depth += 1
            return
        if tag in self._block_tags or tag == "br":
            self._flush()
        if tag == "li":
            self._current.append("- ")
        if tag in {"td", "th"} and self._current:
            self._current.append(" | ")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript"} and self._skip_depth:
            self._skip_depth -= 1
            return
        if tag in self._block_tags or tag == "br":
            self._flush()

    def handle_data(self, data: str) -> None:
        if self._skip_depth:
            return
        normalized = re.sub(r"\s+", " ", data).strip()
        if normalized:
            self._current.append(normalized)

    def lines(self) -> list[str]:
        self._flush()
        return self._lines

    def _flush(self) -> None:
        line = re.sub(r"\s+", " ", "".join(self._current)).strip(" |")
        self._current.clear()
        if line:
            self._lines.append(line)


def _json_lines(value: Any, indent: int = 0) -> list[str]:
    prefix = "  " * indent
    if isinstance(value, dict):
        lines: list[str] = []
        for key, nested in value.items():
            if isinstance(nested, dict | list):
                lines.append(f"{prefix}{key}:")
                lines.extend(_json_lines(nested, indent + 1))
            else:
                lines.append(f"{prefix}{key}: {_json_scalar(nested)}")
        return lines
    if isinstance(value, list):
        lines = []
        for item in value:
            if isinstance(item, dict | list):
                lines.append(f"{prefix}-")
                lines.extend(_json_lines(item, indent + 1))
            else:
                lines.append(f"{prefix}- {_json_scalar(item)}")
        return lines
    return [f"{prefix}{_json_scalar(value)}"]


def _json_scalar(value: Any) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


@dataclass(frozen=True)
class _TrueTypeFont:
    path: Path
    data: bytes
    base_name: str
    units_per_em: int
    ascent: int
    descent: int
    bbox: tuple[int, int, int, int]
    cmap: dict[int, int]


class _PdfDocument:
    def __init__(self, *, title: str, lines: list[str]) -> None:
        self.title = title
        self.lines = lines
        self.font = _load_unicode_font()

    def render(self) -> bytes:
        pages = self._paginate()
        used_codepoints = {
            ord(char)
            for line in self.lines
            for char in line
            if 0 <= ord(char) <= 0xFFFF and char not in "\r\n\t"
        }
        used_codepoints.update(ord(char) for char in self.title if 0 <= ord(char) <= 0xFFFF)

        if self.font:
            return self._render_with_truetype(pages, used_codepoints)
        return self._render_with_builtin_font(pages)

    def _paginate(self) -> list[list[tuple[str, int]]]:
        pages: list[list[tuple[str, int]]] = []
        current: list[tuple[str, int]] = []
        y = TOP_Y
        for index, line in enumerate(self.lines):
            font_size = (
                TITLE_FONT_SIZE
                if index == 0 or line in {"Summary", "Report details", "Report content"}
                else BODY_FONT_SIZE
            )
            if y < BOTTOM_Y:
                pages.append(current)
                current = []
                y = TOP_Y
            current.append((line, font_size))
            y -= LINE_HEIGHT if font_size == BODY_FONT_SIZE else LINE_HEIGHT + 4
        if current:
            pages.append(current)
        return pages or [[("Domarion Analytics", TITLE_FONT_SIZE)]]

    def _render_with_truetype(
        self,
        pages: list[list[tuple[str, int]]],
        used_codepoints: set[int],
    ) -> bytes:
        objects: list[bytes] = []
        catalog_id = _append_object(objects, b"<< /Type /Catalog /Pages 2 0 R >>")
        pages_id = _append_object(objects, b"")
        font_id = _append_object(objects, b"")
        descendant_id = _append_object(objects, b"")
        to_unicode_id = _append_object(objects, b"")
        descriptor_id = _append_object(objects, b"")
        cid_map_id = _append_object(objects, b"")
        font_file_id = _append_object(objects, b"")
        page_ids: list[int] = []
        content_ids: list[int] = []

        for page_lines in pages:
            content = self._page_content_stream(page_lines, unicode_font=True)
            content_ids.append(_append_stream_object(objects, content))
            page_ids.append(
                _append_object(
                    objects,
                    (
                        f"<< /Type /Page /Parent {pages_id} 0 R "
                        f"/MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
                        f"/Resources << /Font << /F1 {font_id} 0 R >> >> "
                        f"/Contents {content_ids[-1]} 0 R >>"
                    ).encode("ascii"),
                )
            )

        assert catalog_id == 1
        font_name = f"Domarion+{self.font.base_name}"
        objects[font_id - 1] = (
            f"<< /Type /Font /Subtype /Type0 /BaseFont /{font_name} "
            "/Encoding /Identity-H "
            f"/DescendantFonts [{descendant_id} 0 R] "
            f"/ToUnicode {to_unicode_id} 0 R >>"
        ).encode("ascii")
        objects[descendant_id - 1] = (
            f"<< /Type /Font /Subtype /CIDFontType2 /BaseFont /{font_name} "
            "/CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> "
            f"/FontDescriptor {descriptor_id} 0 R "
            f"/CIDToGIDMap {cid_map_id} 0 R /DW 560 >>"
        ).encode("ascii")
        objects[to_unicode_id - 1] = _stream_object_body(_to_unicode_cmap(used_codepoints))
        objects[descriptor_id - 1] = self._font_descriptor(font_name, font_file_id)
        objects[cid_map_id - 1] = _stream_object_body(_cid_to_gid_map(self.font, used_codepoints))
        objects[font_file_id - 1] = _stream_object_body(
            self.font.data,
            extra=f"/Length1 {len(self.font.data)}",
        )

        kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
        objects[pages_id - 1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode(
            "ascii"
        )
        return _write_pdf(objects)

    def _render_with_builtin_font(self, pages: list[list[tuple[str, int]]]) -> bytes:
        objects: list[bytes] = []
        _append_object(objects, b"<< /Type /Catalog /Pages 2 0 R >>")
        pages_id = _append_object(objects, b"")
        font_id = _append_object(objects, b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
        page_ids: list[int] = []

        for page_lines in pages:
            content = self._page_content_stream(page_lines, unicode_font=False)
            content_id = _append_stream_object(objects, content)
            page_ids.append(
                _append_object(
                    objects,
                    (
                        f"<< /Type /Page /Parent {pages_id} 0 R "
                        f"/MediaBox [0 0 {PAGE_WIDTH} {PAGE_HEIGHT}] "
                        f"/Resources << /Font << /F1 {font_id} 0 R >> >> "
                        f"/Contents {content_id} 0 R >>"
                    ).encode("ascii"),
                )
            )

        kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
        objects[pages_id - 1] = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>".encode(
            "ascii"
        )
        return _write_pdf(objects)

    def _page_content_stream(
        self,
        page_lines: list[tuple[str, int]],
        *,
        unicode_font: bool,
    ) -> bytes:
        commands = ["q", "BT"]
        y = TOP_Y
        for line, font_size in page_lines:
            commands.append(f"/F1 {font_size} Tf")
            commands.append(f"1 0 0 1 {MARGIN_X} {y} Tm")
            if unicode_font:
                commands.append(f"<{_hex_utf16be(line)}> Tj")
            else:
                commands.append(f"({_escape_pdf_literal(_ascii_fallback(line))}) Tj")
            y -= LINE_HEIGHT if font_size == BODY_FONT_SIZE else LINE_HEIGHT + 4
        commands.extend(["ET", "Q"])
        return ("\n".join(commands) + "\n").encode("ascii")

    def _font_descriptor(self, font_name: str, font_file_id: int) -> bytes:
        assert self.font is not None
        x_min, y_min, x_max, y_max = self.font.bbox
        return (
            f"<< /Type /FontDescriptor /FontName /{font_name} /Flags 32 "
            f"/FontBBox [{x_min} {y_min} {x_max} {y_max}] "
            f"/ItalicAngle 0 /Ascent {self.font.ascent} /Descent {self.font.descent} "
            f"/CapHeight {self.font.ascent} /StemV 80 /FontFile2 {font_file_id} 0 R >>"
        ).encode("ascii")


def _append_object(objects: list[bytes], body: bytes) -> int:
    objects.append(body)
    return len(objects)


def _append_stream_object(objects: list[bytes], stream: bytes, *, extra: str = "") -> int:
    objects.append(_stream_object_body(stream, extra=extra))
    return len(objects)


def _stream_object_body(stream: bytes, *, extra: str = "") -> bytes:
    separator = " " if extra else ""
    header = f"<< /Length {len(stream)}{separator}{extra} >>\nstream\n".encode("ascii")
    return header + stream + b"\nendstream"


def _write_pdf(objects: list[bytes]) -> bytes:
    body = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(body))
        body.extend(f"{index} 0 obj\n".encode("ascii"))
        body.extend(obj)
        body.extend(b"\nendobj\n")

    xref_offset = len(body)
    body.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    body.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        body.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    body.extend(
        (
            "trailer\n"
            f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            "startxref\n"
            f"{xref_offset}\n"
            "%%EOF\n"
        ).encode("ascii")
    )
    return bytes(body)


def _hex_utf16be(value: str) -> str:
    safe = "".join(char if ord(char) <= 0xFFFF else "?" for char in value)
    return safe.encode("utf-16-be").hex().upper()


def _escape_pdf_literal(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _ascii_fallback(value: str) -> str:
    return value.encode("latin-1", "replace").decode("latin-1")


def _load_unicode_font() -> _TrueTypeFont | None:
    for path in _candidate_font_paths():
        if not path.exists():
            continue
        try:
            return _read_truetype_font(path)
        except (OSError, struct.error, ValueError):
            continue
    return None


def _candidate_font_paths() -> list[Path]:
    return [
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/calibri.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"),
    ]


def _read_truetype_font(path: Path) -> _TrueTypeFont:
    data = path.read_bytes()
    tables = _truetype_tables(data)
    head_offset = tables["head"][0]
    hhea_offset = tables["hhea"][0]
    units_per_em = _u16(data, head_offset + 18)
    bbox = tuple(
        _scale_metric(_i16(data, head_offset + offset), units_per_em)
        for offset in (36, 38, 40, 42)
    )
    ascent = _scale_metric(_i16(data, hhea_offset + 4), units_per_em)
    descent = _scale_metric(_i16(data, hhea_offset + 6), units_per_em)
    cmap = _read_cmap(data, tables["cmap"][0])
    if not cmap:
        raise ValueError(f"No usable cmap in {path}")
    return _TrueTypeFont(
        path=path,
        data=data,
        base_name=_pdf_name(path.stem),
        units_per_em=units_per_em,
        ascent=ascent,
        descent=descent,
        bbox=bbox,  # type: ignore[arg-type]
        cmap=cmap,
    )


def _truetype_tables(data: bytes) -> dict[str, tuple[int, int]]:
    table_count = _u16(data, 4)
    tables: dict[str, tuple[int, int]] = {}
    for index in range(table_count):
        entry_offset = 12 + index * 16
        tag = data[entry_offset : entry_offset + 4].decode("ascii")
        tables[tag] = (_u32(data, entry_offset + 8), _u32(data, entry_offset + 12))
    for required in ("head", "hhea", "cmap"):
        if required not in tables:
            raise ValueError(f"Missing TrueType table: {required}")
    return tables


def _read_cmap(data: bytes, cmap_offset: int) -> dict[int, int]:
    record_count = _u16(data, cmap_offset + 2)
    candidates: list[tuple[int, int, int]] = []
    for index in range(record_count):
        record_offset = cmap_offset + 4 + index * 8
        platform_id = _u16(data, record_offset)
        encoding_id = _u16(data, record_offset + 2)
        subtable_offset = cmap_offset + _u32(data, record_offset + 4)
        fmt = _u16(data, subtable_offset)
        priority = _cmap_priority(platform_id, encoding_id, fmt)
        if priority is not None:
            candidates.append((priority, fmt, subtable_offset))

    for _, fmt, offset in sorted(candidates):
        if fmt == 12:
            cmap = _read_cmap_format_12(data, offset)
        elif fmt == 4:
            cmap = _read_cmap_format_4(data, offset)
        else:
            cmap = {}
        if cmap:
            return cmap
    return {}


def _cmap_priority(platform_id: int, encoding_id: int, fmt: int) -> int | None:
    if fmt == 12 and platform_id == 3 and encoding_id == 10:
        return 0
    if fmt == 12 and platform_id == 0:
        return 1
    if fmt == 4 and platform_id == 3 and encoding_id in {1, 10}:
        return 2
    if fmt == 4 and platform_id == 0:
        return 3
    return None


def _read_cmap_format_12(data: bytes, offset: int) -> dict[int, int]:
    group_count = _u32(data, offset + 12)
    cmap: dict[int, int] = {}
    for index in range(group_count):
        group_offset = offset + 16 + index * 12
        start = _u32(data, group_offset)
        end = _u32(data, group_offset + 4)
        start_gid = _u32(data, group_offset + 8)
        for codepoint in range(start, min(end, 0xFFFF) + 1):
            cmap[codepoint] = start_gid + codepoint - start
    return cmap


def _read_cmap_format_4(data: bytes, offset: int) -> dict[int, int]:
    seg_count = _u16(data, offset + 6) // 2
    end_codes_offset = offset + 14
    start_codes_offset = end_codes_offset + seg_count * 2 + 2
    id_deltas_offset = start_codes_offset + seg_count * 2
    id_range_offsets_offset = id_deltas_offset + seg_count * 2
    cmap: dict[int, int] = {}

    for index in range(seg_count):
        end_code = _u16(data, end_codes_offset + index * 2)
        start_code = _u16(data, start_codes_offset + index * 2)
        delta = _i16(data, id_deltas_offset + index * 2)
        range_offset_position = id_range_offsets_offset + index * 2
        range_offset = _u16(data, range_offset_position)
        if start_code == 0xFFFF and end_code == 0xFFFF:
            continue
        for codepoint in range(start_code, min(end_code, 0xFFFF) + 1):
            if range_offset == 0:
                glyph_id = (codepoint + delta) & 0xFFFF
            else:
                glyph_offset = range_offset_position + range_offset + (codepoint - start_code) * 2
                glyph_id = _u16(data, glyph_offset)
                if glyph_id:
                    glyph_id = (glyph_id + delta) & 0xFFFF
            if glyph_id:
                cmap[codepoint] = glyph_id
    return cmap


def _cid_to_gid_map(font: _TrueTypeFont, used_codepoints: set[int]) -> bytes:
    max_cid = max(used_codepoints or {0})
    mapping = bytearray((max_cid + 1) * 2)
    for codepoint in used_codepoints:
        glyph_id = font.cmap.get(codepoint, 0)
        struct.pack_into(">H", mapping, codepoint * 2, min(glyph_id, 0xFFFF))
    return bytes(mapping)


def _to_unicode_cmap(used_codepoints: set[int]) -> bytes:
    codepoints = sorted(point for point in used_codepoints if 0 <= point <= 0xFFFF)
    chunks: list[str] = [
        "/CIDInit /ProcSet findresource begin",
        "12 dict begin",
        "begincmap",
        "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
        "/CMapName /Adobe-Identity-UCS def",
        "/CMapType 2 def",
        "1 begincodespacerange",
        "<0000> <FFFF>",
        "endcodespacerange",
    ]
    for index in range(0, len(codepoints), 100):
        chunk = codepoints[index : index + 100]
        chunks.append(f"{len(chunk)} beginbfchar")
        for codepoint in chunk:
            chunks.append(f"<{codepoint:04X}> <{codepoint:04X}>")
        chunks.append("endbfchar")
    chunks.extend(["endcmap", "CMapName currentdict /CMap defineresource pop", "end", "end"])
    return ("\n".join(chunks) + "\n").encode("ascii")


def _scale_metric(value: int, units_per_em: int) -> int:
    return round(value * 1000 / units_per_em)


def _pdf_name(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]+", "-", value).strip("-") or "DomarionFont"


def _u16(data: bytes, offset: int) -> int:
    return struct.unpack_from(">H", data, offset)[0]


def _i16(data: bytes, offset: int) -> int:
    return struct.unpack_from(">h", data, offset)[0]


def _u32(data: bytes, offset: int) -> int:
    return struct.unpack_from(">I", data, offset)[0]
