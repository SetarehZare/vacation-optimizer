import logging
from dataclasses import dataclass
from datetime import date, timedelta

logger = logging.getLogger(__name__)


@dataclass
class VacationWindow:
    start: date
    end: date
    total_days: int
    pto_days: int
    score: float


def score_windows(
    year: int,
    holidays: list[date],
    *,
    min_window: int = 3,
    max_window: int = 14,
    min_score: float = 1.5,
    max_pto: int = 7,
    top_n: int = 3,
) -> list[VacationWindow]:
    holiday_set = set(holidays)
    year_start = date(year, 1, 1)
    year_end = date(year, 12, 31)

    candidates: list[VacationWindow] = []

    cursor = year_start
    while cursor <= year_end:
        for length in range(min_window, max_window + 1):
            end = cursor + timedelta(days=length - 1)
            if end > year_end:
                break

            pto_days = sum(
                1
                for offset in range(length)
                if (d := cursor + timedelta(days=offset)).weekday() < 5
                and d not in holiday_set
            )

            if pto_days == 0 or pto_days > max_pto:
                continue

            score = length / pto_days
            if score >= min_score:
                candidates.append(
                    VacationWindow(
                        start=cursor,
                        end=end,
                        total_days=length,
                        pto_days=pto_days,
                        score=round(score, 3),
                    )
                )
        cursor += timedelta(days=1)

    # Greedy non-overlapping selection, best score first.
    candidates.sort(key=lambda w: (-w.score, w.start))

    selected: list[VacationWindow] = []
    for w in candidates:
        if len(selected) >= top_n:
            break
        if not any(w.start <= s.end and w.end >= s.start for s in selected):
            selected.append(w)

    logger.info(
        "Scored %d candidates for %d; selected %d windows", len(candidates), year, len(selected)
    )
    return selected
