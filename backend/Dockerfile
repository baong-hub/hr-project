FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy all files
COPY . .

# Restore dependencies
RUN dotnet restore "src/CRM.API/CRM.API.csproj"

# Publish the application
WORKDIR "/src/src/CRM.API"
RUN dotnet publish "CRM.API.csproj" -c Release -o /app/publish /p:UseAppHost=false


# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080

# Configure ASP.NET to run on port 8080
ENV ASPNETCORE_URLS=http://+:8080

# Move published artifacts to final image
COPY --from=build /app/publish .

# Ensure upload & recording directories exist with proper write permissions
RUN mkdir -p /app/wwwroot/uploads /app/wwwroot/recordings && chmod -R 777 /app/wwwroot

ENTRYPOINT ["dotnet", "CRM.API.dll"]
