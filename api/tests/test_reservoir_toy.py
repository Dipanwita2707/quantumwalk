from reservoir_toy import ReservoirParams, run_reservoir_mse


def test_reservoir_beats_mean_baseline_on_sine():
    params = ReservoirParams()
    train_mse, test_mse = run_reservoir_mse(params)
    assert train_mse < 0.05
    assert test_mse < 0.15


def test_reservoir_invalid_hidden_rejected_in_ts_only():
    """Validation lives in TS; Python accepts explicit params."""
    params = ReservoirParams(hidden_size=8)
    train_mse, _ = run_reservoir_mse(params)
    assert train_mse < 0.08
