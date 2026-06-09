import json
from typing import Dict, Any

class RedisManager:
    def __init__(self):
        # In a real environment, connect to aioredis
        self._cache = {}

    async def set_dict(self, key: str, data: Dict[str, Any], ttl: int = None):
        self._cache[key] = json.dumps(data)

    async def get_dict(self, key: str) -> Dict[str, Any]:
        val = self._cache.get(key)
        if val:
            return json.loads(val)
        return None

    async def delete(self, key: str):
        if key in self._cache:
            del self._cache[key]
            
    async def set_pool_state(self, pool_id: str, state_json: str):
        self._cache[f"pool:{pool_id}"] = state_json
        
    async def get_pool_state(self, pool_id: str):
        return self._cache.get(f"pool:{pool_id}")
