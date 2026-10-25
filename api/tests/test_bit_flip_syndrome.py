"""Syndrome toy aligned with web/lib/bitFlipCodeLab.ts."""

from __future__ import annotations

import pytest


def measure_syndrome(d0: int, d1: int, d2: int) -> tuple[int, int]:
    return d0 ^ d1, d1 ^ d2


def infer_error(s01: int, s12: int) -> int | None:
    if s01 == 0 and s12 == 0:
        return None
    if s01 == 1 and s12 == 0:
        return 0
    if s01 == 1 and s12 == 1:
        return 1
    if s01 == 0 and s12 == 1:
        return 2
    return None


@pytest.mark.parametrize(
    "d0,d1,d2,expected",
    [
        (0, 0, 0, None),
        (1, 0, 0, 0),
        (0, 1, 0, 1),
        (0, 0, 1, 2),
    ],
)
def test_single_flip_syndromes(d0: int, d1: int, d2: int, expected: int | None):
    s01, s12 = measure_syndrome(d0, d1, d2)
    assert infer_error(s01, s12) == expected


def test_double_flip_misidentified_in_toy():
    """|101⟩ has two X errors; neighbor parities incorrectly suggest q1 — lab models single errors only."""
    s01, s12 = measure_syndrome(1, 0, 1)
    assert (s01, s12) == (1, 1)
    assert infer_error(s01, s12) == 1


def test_infer_rejects_non_binary_syndrome():
    assert infer_error(0, 2) is None
    assert infer_error(3, 0) is None
