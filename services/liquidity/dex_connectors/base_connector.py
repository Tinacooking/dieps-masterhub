import asyncio
from typing import List, Dict, Callable
from base_models import PoolState

class BaseConnector:
    def __init__(self, dex_name: str, grpc_url: str):
        self.dex_name = dex_name
        self.grpc_url = grpc_url
        self.is_connected = False
        self.health_score = 100
        self.pools: Dict[str, PoolState] = {}
        self.update_callbacks: List[Callable] = []

    async def connect(self):
        """Establish gRPC connection"""
        raise NotImplementedError

    async def discover_pools(self) -> List[PoolState]:
        """Scan and discover new pools on the DEX"""
        raise NotImplementedError

    async def subscribe_to_events(self):
        """Subscribe to pool update and swap events via gRPC"""
        raise NotImplementedError

    def register_callback(self, callback: Callable):
        self.update_callbacks.append(callback)

    async def _emit_update(self, pool_id: str):
        if pool_id in self.pools:
            for cb in self.update_callbacks:
                await cb(self.pools[pool_id])

    def get_health_status(self) -> Dict:
        return {
            "dex": self.dex_name,
            "connected": self.is_connected,
            "pools_tracked": len(self.pools),
            "health_score": self.health_score
        }
