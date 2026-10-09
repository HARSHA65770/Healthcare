package com.healthcare.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class WebSocketTelemetryHub extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(WebSocketTelemetryHub.class);
    private final List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        log.info("Doctor WebSocket connected: {}", session.getId());

        // Send initial confirmation payload matching Python FastAPI
        try {
            Map<String, Object> welcome = new HashMap<>();
            welcome.put("event", "CONNECTED");
            welcome.put("message", "Connected to Rural Hospital Live Telemetry Feed (Spring Boot Engine)");
            welcome.put("district", "ALL");
            welcome.put("timestamp", Instant.now().toString());

            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(welcome)));
        } catch (IOException e) {
            log.error("Failed to send welcome message to session {}", session.getId(), e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        log.info("Doctor WebSocket disconnected: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Echo/ping heartbeat handling
        log.debug("Received WebSocket message: {}", message.getPayload());
    }

    public void broadcast(Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            TextMessage message = new TextMessage(json);
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(message);
                    } catch (IOException e) {
                        log.warn("Error sending telemetry message to session {}", session.getId(), e);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error broadcasting live telemetry", e);
        }
    }

    public int getActiveConnectionsCount() {
        return (int) sessions.stream().filter(WebSocketSession::isOpen).count();
    }
}
