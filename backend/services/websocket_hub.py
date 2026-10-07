import json
from typing import List, Dict, Any
from fastapi import WebSocket


class HospitalTelemetryHub:
    """
    Real-Time Hospital Feed Manager using FastAPI WebSockets.
    Delivers sub-second live broadcast of high-risk cases directly to doctors'
    workstations without manual browser polling.
    """
    def __init__(self):
        # Active connections: district_code -> list of WebSockets
        self.active_connections: List[WebSocket] = []
        self.district_subscriptions: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, district_code: str = "ALL"):
        await websocket.accept()
        self.active_connections.append(websocket)
        if district_code not in self.district_subscriptions:
            self.district_subscriptions[district_code] = []
        self.district_subscriptions[district_code].append(websocket)
        print(f"[WebSocket Hub] Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, district_code: str = "ALL"):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if district_code in self.district_subscriptions and websocket in self.district_subscriptions[district_code]:
            self.district_subscriptions[district_code].remove(websocket)
        print(f"[WebSocket Hub] Client disconnected. Remaining: {len(self.active_connections)}")

    async def broadcast_critical_alert(self, payload: Dict[str, Any], district_code: str = "ALL"):
        """
        Broadcasts emergency packets immediately to subscribed doctors and district hospitals.
        """
        message_json = json.dumps({
            "event": "CRITICAL_TRIAGE_ALERT",
            "timestamp": payload.get("timestamp"),
            "data": payload
        })

        # Send to all connected doctor dashboards
        recipients = list(self.active_connections)
        disconnected = []
        for connection in recipients:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                print(f"[WebSocket Hub] Send error: {e}")
                disconnected.append(connection)

        for dead_conn in disconnected:
            if dead_conn in self.active_connections:
                self.active_connections.remove(dead_conn)

    async def broadcast_update(self, event_name: str, payload: Dict[str, Any]):
        message_json = json.dumps({
            "event": event_name,
            "data": payload
        })
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message_json)
            except Exception:
                pass


# Global singleton hub
telemetry_hub = HospitalTelemetryHub()
