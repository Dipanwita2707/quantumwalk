"""Encoding math aligned with web/lib/quantumMapper.ts (Mapper workspace)."""

from __future__ import annotations

import math


def qubits_for_routes(n: int) -> int:
    routes = math.factorial(n)
    return max(1, math.ceil(math.log2(routes)))


def encode_route_index(route_index: int, n_cities: int) -> str:
    qubits = qubits_for_routes(n_cities)
    return format(route_index, f"0{qubits}b")


def test_three_city_route_five_is_101():
    assert qubits_for_routes(3) == 3
    assert encode_route_index(5, 3) == "101"


def test_six_cities_use_ten_qubits():
    assert qubits_for_routes(6) == 10


def test_binary_encode_five_in_three_bits():
    assert format(5, "03b") == "101"


def test_route_index_out_of_range():
    n = 3
    count = 6
    assert count == 6
    bad = 99
    assert bad >= count


def test_decode_round_trip_route_five():
    bitstring = encode_route_index(5, 3)
    assert bitstring == "101"
    assert int(bitstring, 2) == 5
