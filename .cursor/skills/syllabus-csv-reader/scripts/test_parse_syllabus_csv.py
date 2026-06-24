#!/usr/bin/env python3
"""Tests for syllabus_csv_parser — run from backend: python -m pytest tests/test_syllabus_csv_parser.py"""

import json
import subprocess
import sys
import unittest
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[4] / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.services.syllabus_csv_parser import (  # noqa: E402
    build_prior_skills,
    extract_content_items,
    lessons_with_context,
    parse_syllabus_csv,
    _lesson_index,
)

SCRIPT_DIR = Path(__file__).resolve().parent
SYLLABUS_PLANNER_ROOT = SCRIPT_DIR.parents[3]
WORKSPACE_ROOT = SCRIPT_DIR.parents[4]
CSV = (
    WORKSPACE_ROOT
    / "course-outline-generator"
    / "ai-engineering"
    / "New Syllabus AI Engineer - Planificación del programa.csv"
)
FIXTURE_CSV = SYLLABUS_PLANNER_ROOT / \
    "backend/tests/fixtures/sample_syllabus.csv"
PY = SCRIPT_DIR / "parse_syllabus_csv.py"


def run_cli(csv_path: Path, *args: str) -> dict | list:
    out = subprocess.check_output(
        ["python3", str(PY), "--csv", str(csv_path.resolve()), *args],
        text=True,
    )
    return json.loads(out)


class TestExtractContentItems(unittest.TestCase):
    def test_theory_plus_minus_hierarchy(self):
        text = """> Teoría (30 minutos):
  + HTML
    - Estructura principal de HTML
    - Principales etiquetas
  + SEO y GEO
    - ¿Qué es SEO?
      -- ¿Cómo funciona el SEO para los buscadores?"""
        items, notes = extract_content_items(text)
        self.assertEqual(len(notes), 0)
        self.assertEqual(items[0].type, "theory")
        self.assertEqual(items[0].title, "HTML")
        self.assertEqual(len(items[0].children), 2)
        self.assertEqual(items[1].title, "SEO y GEO")
        depths = [child["depth"] for child in items[1].children]
        self.assertIn(2, depths)

    def test_project_title_on_header_line(self):
        text = """> Proyecto 1: Un website para mostrar el talento de tu amigo artista

La entrega debe tener un markdown llamado PROMPTS.md

> Instrucciones al profesor:
  - Este curso solo puede tener HTML y CSS"""
        items, notes = extract_content_items(text)
        self.assertEqual(items[0].type, "project")
        self.assertIn("website", items[0].title.lower())
        self.assertIn("PROMPTS.md", items[0].body or "")
        self.assertEqual(len(notes), 1)
        self.assertIn("HTML y CSS", notes[0])

    def test_project_numbered_steps(self):
        text = """> Proyecto: Mi primer dashboard para mostrar datos

  1. Se pide a la IA que haga un dashboard
  2. Se revisa el código
  + Actividades extra:
    - Agregar efectos visuales"""
        items, _ = extract_content_items(text)
        self.assertEqual(
            items[0].title, "Mi primer dashboard para mostrar datos")
        self.assertGreaterEqual(len(items[0].steps), 2)
        extra = next(i for i in items if i.title.startswith("Actividades"))
        self.assertEqual(len(extra.children), 1)

    def test_pre_section_notes(self):
        text = """- Se dan 30 minutos de repaso de prework
  - Coding Agents

> Teoría:
  + HTML
    - Estructura principal"""
        items, _ = extract_content_items(text)
        self.assertEqual(items[0].type, "note")
        self.assertEqual(len(items[0].children), 1)
        self.assertEqual(items[1].title, "HTML")

    def test_milestone_project_header(self):
        text = """> Proyecto (Hito 1): Web pública de "mi empresa"
 1. Pide a la IA que haga el sitio web
 2. Revisa el contenido generado"""
        items, _ = extract_content_items(text)
        self.assertEqual(items[0].type, "project")
        self.assertIn("mi empresa", items[0].title)
        self.assertGreaterEqual(len(items[0].steps), 2)


class TestSampleFixture(unittest.TestCase):
    def test_parse_sample_fixture(self):
        parsed = parse_syllabus_csv(FIXTURE_CSV, title="Sample")
        self.assertEqual(len(parsed.sections), 1)
        self.assertEqual(parsed.sections[0].title, "INTRO SECTION")
        self.assertEqual(len(parsed.sections[0].modules), 2)
        lesson = lessons_with_context(FIXTURE_CSV)[0]
        types = {item["type"] for item in lesson["contents"]}
        self.assertIn("theory", types)
        self.assertIn("project", types)


@unittest.skipUnless(CSV.resolve().is_file(), "AI Engineer CSV not found")
class TestParseSyllabusCSVIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tree = parse_syllabus_csv(CSV.resolve())
        cls.lessons = lessons_with_context(CSV.resolve())

    def test_sections_have_modules(self):
        self.assertGreater(len(self.tree.sections), 10)
        web_ui = next(
            s for s in self.tree.sections if "WEB UI" in s.title.upper())
        self.assertGreaterEqual(len(web_ui.modules), 4)

    def test_week1_day1_contents(self):
        lesson = next(
            l for l in self.lessons if l["week"] == "1" and l["day"] == "1")
        titles = [c["title"] for c in lesson["contents"]]
        self.assertIn("HTML", titles)
        self.assertIn("CSS", titles)
        project_titles = [c["title"]
                          for c in lesson["contents"] if c["type"] == "project"]
        self.assertTrue(any("website" in t.lower() for t in project_titles))

    def test_hito_has_project_title_not_instructor_note(self):
        lesson = next(
            l for l in self.lessons if l["week"] == "HITO 01" and l["day"] == "En Syllabus"
        )
        projects = [c for c in lesson["contents"] if c["type"] == "project"]
        self.assertTrue(
            any("mi empresa" in p["title"].lower() for p in projects))
        self.assertGreater(len(projects[0]["steps"]), 3)

    def test_list_cli(self):
        index = run_cli(CSV, "--list")
        self.assertGreater(len(index), 50)
        self.assertIn("section", index[0])

    def test_tree_cli(self):
        tree = run_cli(CSV, "--tree", "--section", "WEB UI")
        self.assertEqual(len(tree["sections"]), 1)
        module = tree["sections"][0]["modules"][0]
        self.assertIn("contents", module)
        self.assertGreater(len(module["contents"]), 3)

    def test_prior_skills_smart(self):
        idx = _lesson_index(self.lessons, "8", "22")
        prior, meta = build_prior_skills(
            self.lessons, idx, mode="smart", window=15)
        self.assertEqual(meta["mode"], "smart")
        self.assertLess(meta["returned"], meta["total_prior"])


if __name__ == "__main__":
    unittest.main()
