import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"


def test_documentation_index_links_exist_and_cover_retained_documents() -> None:
    index = (DOCS / "README.md").read_text(encoding="utf-8")
    targets = re.findall(r"\]\(([^)]+)\)", index)
    linked = set()
    for target in targets:
        path = (DOCS / target).resolve()
        assert path.is_file(), f"Broken documentation index link: {target}"
        linked.add(path)
    for document in DOCS.rglob("*.md"):
        if document.name != "README.md":
            assert document.resolve() in linked, f"Document missing from index: {document}"


def test_repository_document_references_do_not_point_to_deleted_files() -> None:
    for document in [ROOT / "README.md", *DOCS.rglob("*.md")]:
        content = document.read_text(encoding="utf-8")
        for target in re.findall(r"\bdocs/[A-Za-z0-9_./-]+\.md\b", content):
            assert (ROOT / target).is_file(), f"Broken reference in {document.name}: {target}"
