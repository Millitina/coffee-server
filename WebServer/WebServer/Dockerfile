FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 3000

ENV ASPNETCORE_URLS=http://+:3000

USER app
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG configuration=Release
WORKDIR /src
COPY ["WebServer.csproj", "./"]
RUN dotnet restore "WebServer.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "WebServer.csproj" -c $configuration -o /app/build

FROM build AS publish
ARG configuration=Release
RUN dotnet publish "WebServer.csproj" -c $configuration -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY ["WebServer/wwwroot", "/app/wwwroot"]
ENTRYPOINT ["dotnet", "WebServer.dll"]
