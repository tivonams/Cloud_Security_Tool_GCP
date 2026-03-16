def build_context(chunks: list[dict]) -> str:
    if not chunks:
        return ""

    context_parts = []

    for chunk in chunks:
        text = chunk.get("page_content", "").strip()

        # 🔒 Basic quality filters
        if not text:
            continue
        if len(text) < 200:              # too short → usually nav junk
            continue
        if "&quot;" in text or "null," in text:
            continue
        if "Learn more" in text and "security" not in text.lower():
            continue

        context_parts.append(text)

    return "\n\n---\n\n".join(context_parts)
