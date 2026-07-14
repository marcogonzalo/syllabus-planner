from app.services.content_display import split_legacy_content_title, split_content_text


def test_split_content_text_multiline():
    title, body = split_content_text("Lesson Title\n- Detail one\n- Detail two")
    assert title == "Lesson Title"
    assert body == "- Detail one\n- Detail two"


def test_split_content_text_single_line():
    title, body = split_content_text("Simple title")
    assert title == "Simple title"
    assert body is None


def test_split_content_text_empty():
    title, body = split_content_text("")
    assert title == ""
    assert body is None


def test_split_legacy_content_title_on_newline():
    title, body = split_legacy_content_title("Intro lesson\n- Detail one")
    assert title == "Intro lesson"
    assert body == "- Detail one"


def test_split_legacy_content_title_on_inline_bullets():
    title, body = split_legacy_content_title(
        "Introducción a la programación (Javascript) (Referencia rápida) "
        "- Pensamiento lógico-matemático - Algoritmos - Variables"
    )
    assert title == "Introducción a la programación (Javascript) (Referencia rápida)"
    assert "- Pensamiento lógico-matemático" in body
    assert "- Algoritmos" in body
    assert "- Variables" in body


def test_split_legacy_content_title_without_body():
    title, body = split_legacy_content_title("Short lesson title")
    assert title == "Short lesson title"
    assert body is None
