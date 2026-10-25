"""Encoding math aligned with web/lib/quantumMapper.ts (Mapper workspace)."""

from __future__ import annotations

import math


def qubits_for_routes(n: int) -> int:
    routes = math.factorial(n)
    return max(1, math.ceil(math.log2(routes)))


def encode_route_index(route_index: int, n_cities: int) -> str:
    qubits = qubits_for_routes(n_cities)
    return format(route_index, f"0{qubits}b")


def decode_route_bitstring(bitstring: str, n_cities: int) -> int | None:
    qubits = qubits_for_routes(n_cities)
    if len(bitstring) != qubits or not set(bitstring).issubset({"0", "1"}):
        return None
    idx = int(bitstring, 2)
    if idx >= math.factorial(n_cities):
        return None
    return idx


def test_three_city_route_five_is_101():
    assert qubits_for_routes(3) == 3
    assert encode_route_index(5, 3) == "101"


def test_six_cities_use_ten_qubits():
    assert qubits_for_routes(6) == 10


def test_binary_encode_five_in_three_bits():
    assert format(5, "03b") == "101"


def test_round_trip_route_indices():
    for n in (3, 4, 5):
        count = math.factorial(n)
        for idx in (0, 1, count // 2, count - 1):
            bits = encode_route_index(idx, n)
            assert decode_route_bitstring(bits, n) == idx


def test_decode_rejects_padding_label():
    assert decode_route_bitstring("111", 3) is None


def test_decode_rejects_wrong_width():
    assert decode_route_bitstring("10", 3) is None


def test_decode_rejects_non_binary():
    assert decode_route_bitstring("10a", 3) is None
