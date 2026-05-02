from datetime import date, timedelta

from vacation_optimizer.optimizer import score_windows


def test_pto_excludes_weekends_and_holidays():
    # Jan 10 2025 is a Friday — mark it as a holiday.
    # For every returned window that spans that date, verify the PTO count
    # manually: weekdays inside the window that are NOT Jan 10.
    holiday = date(2025, 1, 10)
    windows = score_windows(2025, [holiday], min_window=3, max_window=14, top_n=50)

    spanning = [w for w in windows if w.start <= holiday <= w.end]
    assert spanning, "expected at least one returned window to span the holiday"

    for w in spanning:
        expected_pto = sum(
            1
            for offset in range(w.total_days)
            if (d := w.start + timedelta(days=offset)).weekday() < 5 and d != holiday
        )
        assert w.pto_days == expected_pto, (
            f"window {w.start}–{w.end}: got pto_days={w.pto_days}, expected {expected_pto}"
        )


def test_score_formula_holds_for_all_results():
    holidays = [date(2025, 12, 25), date(2025, 12, 26)]
    for w in score_windows(2025, holidays, top_n=10):
        assert w.score == round(w.total_days / w.pto_days, 3)


def test_min_score_filter_respected():
    for w in score_windows(2025, []):
        assert w.score >= 1.5


def test_max_pto_filter_respected():
    holidays = [date(2025, 1, 1)]
    for w in score_windows(2025, holidays):
        assert w.pto_days <= 7


def test_top_n_non_overlapping():
    holidays = [date(2025, 1, 1), date(2025, 5, 26), date(2025, 12, 25)]
    windows = score_windows(2025, holidays, top_n=3)

    assert len(windows) <= 3
    for i, w1 in enumerate(windows):
        for w2 in windows[i + 1:]:
            assert w1.end < w2.start or w2.end < w1.start


def test_no_holidays_still_finds_windows():
    # Weekend bridges score well (e.g. Sat-Mon: 3 days, 1 PTO -> score 3.0)
    windows = score_windows(2025, [])
    assert len(windows) > 0
    assert all(w.score >= 1.5 for w in windows)


def test_returns_empty_for_impossible_constraints():
    windows = score_windows(2025, [], min_score=99.0)
    assert windows == []
