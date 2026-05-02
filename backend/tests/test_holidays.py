from datetime import date

import httpx
import pytest
import respx

from vacation_optimizer.config import Settings
from vacation_optimizer.holidays import fetch_holidays

_SETTINGS = Settings()

_MOCK_PAYLOAD = [
    {"date": "2025-01-01", "name": "New Year's Day", "countryCode": "US"},
    {"date": "2025-07-04", "name": "Independence Day", "countryCode": "US"},
    {"date": "2025-12-25", "name": "Christmas Day", "countryCode": "US"},
]


@respx.mock
async def test_fetch_holidays_parses_dates():
    url = f"{_SETTINGS.nager_base_url}/api/v3/PublicHolidays/2025/US"
    respx.get(url).mock(return_value=httpx.Response(200, json=_MOCK_PAYLOAD))

    holidays = await fetch_holidays("US", 2025, _SETTINGS)

    assert date(2025, 1, 1) in holidays
    assert date(2025, 7, 4) in holidays
    assert date(2025, 12, 25) in holidays
    assert len(holidays) == 3


@respx.mock
async def test_fetch_holidays_returns_list_of_dates():
    url = f"{_SETTINGS.nager_base_url}/api/v3/PublicHolidays/2025/US"
    respx.get(url).mock(return_value=httpx.Response(200, json=_MOCK_PAYLOAD))

    holidays = await fetch_holidays("US", 2025, _SETTINGS)

    assert all(isinstance(h, date) for h in holidays)


@respx.mock
async def test_fetch_holidays_raises_on_http_error():
    url = f"{_SETTINGS.nager_base_url}/api/v3/PublicHolidays/2025/XX"
    respx.get(url).mock(return_value=httpx.Response(404))

    with pytest.raises(httpx.HTTPStatusError):
        await fetch_holidays("XX", 2025, _SETTINGS)


@respx.mock
async def test_fetch_holidays_empty_response():
    url = f"{_SETTINGS.nager_base_url}/api/v3/PublicHolidays/2025/ZZ"
    respx.get(url).mock(return_value=httpx.Response(200, json=[]))

    holidays = await fetch_holidays("ZZ", 2025, _SETTINGS)
    assert holidays == []
