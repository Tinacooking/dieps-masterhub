import asyncio
from typing import Dict, List
from base_models import PoolState
from cache import RedisManager
from registry import PoolRegistry

class GraphStateManager:
    def __init__(self, redis: RedisManager, registry: PoolRegistry):
        self.redis = redis
        self.registry = registry
        self.in_memory_pools: Dict[str, PoolState] = {}
        # Adj list: token_address -> List[PoolState]
        self.graph: Dict[str, List[PoolState]] = {}
        self.graph_lock = asyncio.Lock()

    async def update_pool(self, state: PoolState):
        async with self.graph_lock:
            self.in_memory_pools[state.pool_id] = state
            self.registry.register_pool(state.pool_id, state.dex_name)
            
            # Rebuild local graph node
            self._add_to_graph(state.token_a, state)
            self._add_to_graph(state.token_b, state)
            
            # Cache the state
            await self.redis.set_pool_state(state.pool_id, state.json())

    def _add_to_graph(self, token: str, state: PoolState):
        if token not in self.graph:
            self.graph[token] = []
        
        # Replace existing or append
        existing = [i for i, p in enumerate(self.graph[token]) if p.pool_id == state.pool_id]
        if existing:
            self.graph[token][existing[0]] = state
        else:
            self.graph[token].append(state)

    async def get_snapshot(self):
        async with self.graph_lock:
            return {
                "nodes": list(self.graph.keys()),
                "edges": list(self.in_memory_pools.values())
            }

    async def get_all_pools(self) -> List[PoolState]:
        return list(self.in_memory_pools.values())

    async def get_pool(self, pool_id: str) -> PoolState:
        return self.in_memory_pools.get(pool_id)
