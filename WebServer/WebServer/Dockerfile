FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 3000
ENV ASPNETCORE_URLS=http://+:3000
USER app

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG configuration=Release
WORKDIR /src

# Копируем файл проекта из ПРАВИЛЬНОЙ вложенной папки
COPY ["WebServer/WebServer/WebServer.csproj", "WebServer/WebServer/"]
RUN dotnet restore "WebServer/WebServer/WebServer.csproj"

# Копируем всё остальное
COPY . .

# Переходим в папку проекта и собираем
WORKDIR "/src/WebServer/WebServer"
RUN dotnet build "WebServer.csproj" -c $configuration -o /app/build

FROM build AS publish
ARG configuration=Release
WORKDIR "/src/WebServer/WebServer"
RUN dotnet publish "WebServer.csproj" -c $configuration -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# Копируем ВСЕ файлы из wwwroot
COPY --from=build /src/WebServer/WebServer/wwwroot /app/wwwroot

ENTRYPOINT ["dotnet", "WebServer.dll"]