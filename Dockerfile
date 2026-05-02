FROM eclipse-temurin:25-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and POM
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Grant execution permission to Maven wrapper
RUN chmod +x mvnw

# Download dependencies offline (cache layer)
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src ./src

# Build the application (skipping tests for faster deployment)
RUN ./mvnw package -DskipTests

# Stage 2: Create a minimal JRE image
FROM eclipse-temurin:25-jre-alpine

WORKDIR /app

# Copy the built jar file from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
