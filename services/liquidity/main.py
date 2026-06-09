import asyncio
import uvicorn
from fastapi import FastAPI
from cache import RedisManager
from registry import PoolRegistry, TokenRegistry
from state_manager import GraphStateManager
from health_monitor import HealthMonitorService
from collector import LiquidityCollector
from dex_connectors.cetus import CetusConnector
# import other connectors...

app = FastAPI(title="DIEPS Liquidity Intelligence Layer")

redis_mgr = RedisManager()
pool_registry = PoolRegistry()
token_registry = TokenRegistry()
state_manager = GraphStateManager(redis_mgr, pool_registry)
collector = LiquidityCollector(state_manager)

# Initialize connectors
grpc_url = "sui-testnet-grpc.blockvision.org:443"
cetus_conn = CetusConnector(grpc_url)
# Add turbos, deepbook, flowx, etc.

collector.register_connector(cetus_conn)
health_monitor = HealthMonitorService(collector.connectors)

@app.on_event("startup")
async def startup_event():
    # Start the continuous streaming engine
    asyncio.create_task(collector.start())

@app.get("/pools")
async def get_pools():
    return await state_manager.get_all_pools()

@app.get("/pools/{pool_id}")
async def get_pool(pool_id: str):
    return await state_manager.get_pool(pool_id)

@app.get("/tokens")
async def get_tokens():
    return token_registry.get_all_tokens()

@app.get("/tokens/{token}")
async def get_token(token: str):
    return token_registry.get_token(token)

@app.get("/prices")
async def get_prices():
    # Example proxy to get prices from pools
    pools = await state_manager.get_all_pools()
    return {p.token_a: p.price for p in pools}

@app.get("/prices/{token}")
async def get_token_price(token: str):
    pools = await state_manager.get_all_pools()
    for p in pools:
        if p.token_a == token:
            return {"price": p.price}
    return {"price": 0.0}

@app.get("/graph")
async def get_graph():
    return await state_manager.get_snapshot()

@app.get("/dex-status")
async def get_dex_status():
    return health_monitor.get_system_health()


@app.get("/liquidity-health")
async def get_health():
    return health_monitor.get_system_health()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
