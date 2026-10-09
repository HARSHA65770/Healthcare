package com.healthcare.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        String springDbUrl = System.getenv("SPRING_DATASOURCE_URL");
        String dbUrl = System.getenv("DATABASE_URL");

        // 1. Explicit Spring Datasource URL (highest priority)
        if (springDbUrl != null && !springDbUrl.isBlank()) {
            log.info("Using explicitly configured SPRING_DATASOURCE_URL: {}", springDbUrl);
            properties.setUrl(springDbUrl);
            return properties.initializeDataSourceBuilder().build();
        }

        // 2. Render PostgreSQL URL (e.g., postgres://user:pass@host:5432/db)
        if (dbUrl != null && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))) {
            try {
                log.info("Detected cloud PostgreSQL DATABASE_URL. Converting to JDBC...");
                URI uri = new URI(dbUrl.replace("postgres://", "postgresql://"));
                String userInfo = uri.getUserInfo();
                String username = "";
                String password = "";
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath();
                String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + path;

                properties.setUrl(jdbcUrl);
                properties.setUsername(username);
                properties.setPassword(password);
                properties.setDriverClassName("org.postgresql.Driver");
                return properties.initializeDataSourceBuilder().build();
            } catch (Exception e) {
                log.warn("Failed to parse PostgreSQL DATABASE_URL, falling back to embedded H2 SQL database", e);
            }
        }

        // 3. Default: Embedded H2 SQL database in ./data/rural_health_sql
        // Safe against legacy sqlite:// strings or empty DATABASE_URL
        log.info("Using embedded SQL database (H2 file storage in ./data/rural_health_sql)");
        String defaultH2 = "jdbc:h2:file:./data/rural_health_sql;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";
        properties.setUrl(defaultH2);
        properties.setDriverClassName("org.h2.Driver");
        properties.setUsername("sa");
        properties.setPassword("");
        return properties.initializeDataSourceBuilder().build();
    }
}
