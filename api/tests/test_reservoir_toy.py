from reservoir_toy import ReservoirParams, run_reservoir_mse


def test_reservoir_beats_mean_baseline_on_sine():
    params = ReservoirParams()
    train_mse, test_mse, test_baseline = run_reservoir_mse(params)
    assert train_mse < 0.05
    assert test_mse < 0.15
    assert test_mse < test_baseline


def test_reservoir_reproducible_with_seed():
    params = ReservoirParams(seed=7)
    first = run_reservoir_mse(params)
    second = run_reservoir_mse(params)
    assert first == second


def test_reservoir_smaller_hidden_still_runs():
    params = ReservoirParams(hidden_size=8)
    train_mse, test_mse, _ = run_reservoir_mse(params)
    assert train_mse < 0.08
    assert test_mse < 0.2
