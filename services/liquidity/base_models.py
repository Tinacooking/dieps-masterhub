from pydantic import BaseModel
from typing import Optional, Dict

class PoolState(BaseModel):
    pool_id: str
    dex_name: str
    token_a: str
    token_b: str
    reserve_a: str
    reserve_b: str
    fee: float
    liquidity_usd: float
    volume_24h: float
    tvl: float
    price: float
    last_swap_timestamp: int
    last_update_timestamp: int
    pool_age: int
    active_status: bool

class TokenMetadata(BaseModel):
    address: str
    symbol: str
    decimals: int
    name: str
    logo_url: Optional[str]
    verified: bool
    price: float
    market_cap: float
    last_updated: int
