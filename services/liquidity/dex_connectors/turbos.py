import asyncio
from .base_connector import BaseConnector

class TurbosConnector(BaseConnector):
    def __init__(self, grpc_url: str):
        super().__init__("Turbos", grpc_url)
        
    async def connect(self):
        self.is_connected = True
        
    async def discover_pools(self):
        return []

    async def subscribe_to_events(self):
        while self.is_connected:
            await asyncio.sleep(1)
