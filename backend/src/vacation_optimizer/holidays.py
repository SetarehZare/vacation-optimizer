import logging
from dataclasses import dataclass
from datetime import date

import httpx

from vacation_optimizer.config import Settings

logger = logging.getLogger(__name__)


@dataclass
class HolidayInfo:
    date: date
    name: str


async def fetch_holiday_infos(country_code: str, year: int, settings: Settings) -> list[HolidayInfo]:
    url = f"{settings.nager_base_url}/api/v3/PublicHolidays/{year}/{country_code}"
    logger.info("Fetching holidays for %s/%d", country_code, year)
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10.0)
        response.raise_for_status()
    return [HolidayInfo(date=date.fromisoformat(h["date"]), name=h["name"]) for h in response.json()]


async def fetch_holidays(country_code: str, year: int, settings: Settings) -> list[date]:
    infos = await fetch_holiday_infos(country_code, year, settings)
    return [h.date for h in infos]
