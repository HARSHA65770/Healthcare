package com.healthcare.config;

import com.healthcare.service.WebSocketTelemetryHub;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final WebSocketTelemetryHub telemetryHub;

    public WebSocketConfig(WebSocketTelemetryHub telemetryHub) {
        this.telemetryHub = telemetryHub;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(telemetryHub, "/ws/telemetry")
                .setAllowedOrigins("*");
    }
}
