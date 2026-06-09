import asyncio
from dex_connectors.cetus import CetusConnector
from state_manager import GraphStateManager
from base_models import PoolState

class LiquidityCollector:
    def __init__(self, state_manager: GraphStateManager):
        self.state_manager = state_manager
        self.connectors = []
    
    def register_connector(self, connector):
        connector.register_callback(self.handle_pool_update)
        self.connectors.append(connector)
        
    async def handle_pool_update(self, pool_state: PoolState):
        """Streaming callback from DEX connectors"""
        # Validate data quality
        if self._validate_pool(pool_state):
            await self.state_manager.update_pool(pool_state)
            
    def _validate_pool(self, state: PoolState) -> bool:
        if state.liquidity_usd < 0: return False
        if state.fee < 0 or state.fee > 0.1: return False
        # Add Bayesian Guardian freshness checks here
        return True

    async def start(self):
        # 1. Connect all
        await asyncio.gather(*(c.connect() for c in self.connectors))
        
        # 2. Discover existing pools
        for c in self.connectors:
            pools = await c.discover_pools()
            for p in pools:
                await self.state_manager.update_pool(p)
                
        # 3. Start subscription streams
        for c in self.connectors:
            asyncio.create_task(c.subscribe_to_events())
