from typing import Dict, List
from base_models import TokenMetadata

class TokenRegistry:
    def __init__(self):
        self.tokens: Dict[str, TokenMetadata] = {}

    def register_token(self, metadata: TokenMetadata):
        if metadata.address not in self.tokens:
            self.tokens[metadata.address] = metadata
        else:
            self.update_token(metadata.address, metadata)

    def update_token(self, address: str, metadata: TokenMetadata):
        if address in self.tokens:
            self.tokens[address] = metadata

    def get_token(self, address: str) -> TokenMetadata:
        return self.tokens.get(address)

    def get_all_tokens(self) -> List[TokenMetadata]:
        return list(self.tokens.values())

class PoolRegistry:
    def __init__(self):
        self.pool_map: Dict[str, str] = {} # pool_id -> dex_name

    def register_pool(self, pool_id: str, dex_name: str):
        self.pool_map[pool_id] = dex_name

    def remove_pool(self, pool_id: str):
        if pool_id in self.pool_map:
            del self.pool_map[pool_id]
