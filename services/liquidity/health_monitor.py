from typing import List, Dict
from dex_connectors.base_connector import BaseConnector

class HealthMonitorService:
    def __init__(self, connectors: List[BaseConnector]):
        self.connectors = connectors
        
    def get_system_health(self) -> Dict:
        connector_health = [c.get_health_status() for c in self.connectors]
        
        total_tracked = sum(c["pools_tracked"] for c in connector_health)
        active_connectors = sum(1 for c in connector_health if c["connected"])
        
        return {
            "status": "healthy" if active_connectors > 0 else "degraded",
            "active_connectors": active_connectors,
            "total_pools_monitored": total_tracked,
            "connectors": connector_health
        }
