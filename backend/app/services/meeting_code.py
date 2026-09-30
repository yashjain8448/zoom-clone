import re
import secrets
import string

CODE_LENGTH = 11
_LINK_RE = re.compile(r"/j/(\d{11})")
_PASSCODE_ALPHABET = string.ascii_letters + string.digits


def random_code() -> str:
    """11-digit numeric ID; first digit is never 0 so it always displays as 11 digits."""
    return str(secrets.randbelow(9 * 10**10) + 10**10)


def random_passcode(length: int = 6) -> str:
    return "".join(secrets.choice(_PASSCODE_ALPHABET) for _ in range(length))


def format_code(code: str) -> str:
    """'12345678901' -> '123 4567 8901' (Zoom's display format)."""
    return f"{code[:3]} {code[3:7]} {code[7:]}"


def normalize_code(raw: str) -> str | None:
    """
    Accepts an invite link or a typed ID ('123 4567 8901', '123-4567-8901').
    Returns the bare 11-digit code, or None if the input isn't a valid ID.
    """
    raw = raw.strip()
    if match := _LINK_RE.search(raw):
        return match.group(1)
    digits = re.sub(r"[\s-]", "", raw)
    return digits if re.fullmatch(r"\d{11}", digits) else None