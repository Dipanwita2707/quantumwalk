"""Syndrome toy aligned with web/lib/bitFlipCodeLab.ts."""

from __future__ import annotations


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


def test_no_error():
    assert measure_syndrome(0, 0, 0) == (0, 0)
    assert infer_error(0, 0) is None


def test_flip_on_q1():
    assert measure_syndrome(0, 1, 0) == (1, 1)
    assert infer_error(1, 1) == 1
