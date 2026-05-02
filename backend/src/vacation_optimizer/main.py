import logging
from contextlib import asynccontextmanager
from datetime import date
from functools import lru_cache

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from vacation_optimizer.config import Settings
from vacation_optimizer.holidays import fetch_holidays, fetch_holiday_infos
from vacation_optimizer.location import ParsedLocation, parse_location
from vacation_optimizer.optimizer import VacationWindow, score_windows

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s - %(message)s")
logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("vacation-optimizer starting up")
    yield
    logger.info("vacation-optimizer shutting down")


app = FastAPI(title="Vacation Optimizer", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- request / response models ----------


class OptimizeRequest(BaseModel):
    location_text: str | None = Field(None, description="Free-text location, parsed by Ollama")
    country_code: str | None = Field(None, description="ISO 3166-1 alpha-2, e.g. 'US'")
    region: str | None = None
    year: int = Field(default_factory=lambda: date.today().year)


class WindowResponse(BaseModel):
    start: date
    end: date
    total_days: int
    pto_days: int
    score: float


class OptimizeResponse(BaseModel):
    country_code: str
    region: str | None
    year: int
    windows: list[WindowResponse]


# ---------- routes ----------


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/holidays/{country_code}/{year}")
async def api_holidays(country_code: str, year: int) -> list[dict]:
    settings = get_settings()
    try:
        infos = await fetch_holiday_infos(country_code.upper(), year, settings)
    except Exception as exc:
        logger.error("Holiday fetch failed for %s/%d: %s", country_code, year, exc)
        raise HTTPException(status_code=502, detail=f"Failed to fetch holidays: {exc}")
    return [{"date": h.date.isoformat(), "name": h.name} for h in infos]


@app.post("/optimize", response_model=OptimizeResponse)
async def optimize(req: OptimizeRequest) -> OptimizeResponse:
    settings = get_settings()

    if req.location_text:
        try:
            parsed: ParsedLocation = await parse_location(req.location_text, settings)
            country_code = parsed.country_code.upper()
            region = parsed.region
        except Exception as exc:
            logger.warning("Location parse failed: %s", exc)
            raise HTTPException(status_code=422, detail=f"Could not parse location: {exc}")
    elif req.country_code:
        country_code = req.country_code.upper()
        region = req.region
    else:
        raise HTTPException(
            status_code=422, detail="Provide either location_text or country_code"
        )

    try:
        holidays = await fetch_holidays(country_code, req.year, settings)
    except Exception as exc:
        logger.error("Holiday fetch failed for %s/%d: %s", country_code, req.year, exc)
        raise HTTPException(status_code=502, detail=f"Failed to fetch holidays: {exc}")

    windows: list[VacationWindow] = score_windows(req.year, holidays)

    return OptimizeResponse(
        country_code=country_code,
        region=region,
        year=req.year,
        windows=[
            WindowResponse(
                start=w.start,
                end=w.end,
                total_days=w.total_days,
                pto_days=w.pto_days,
                score=w.score,
            )
            for w in windows
        ],
    )
