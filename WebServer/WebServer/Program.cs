using Npgsql;
using System.Collections.Generic;
using System.Reflection.Metadata.Ecma335;
using WebServer.Controllers;


var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "https://millitina.github.io"
        )
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});

// Add controllers
builder.Services.AddControllers();
builder.Services.AddControllersWithViews();

// ���� 3000
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(3000);
});

var app = builder.Build();

app.MapGet("/", () => "������ ��������!");
app.UseCors("AllowFrontend");

app.UseStaticFiles();

// Map controllers
app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

Console.WriteLine("���������� �������!");

app.Run();