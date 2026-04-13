using Microsoft.AspNetCore.Mvc;
using Npgsql;
using WebServer.Models;

namespace WebServer.Controllers
{
    public class CoffeePageController : Controller
    {
        private readonly string _connectionString;

        public CoffeePageController(IConfiguration configuration)
        {
            _connectionString = "Server=coffee;Port=5432;Database=coffee;" +
                               "User Id=postgres;Password=root;";
        }

        // GET: /product/{name}
        [HttpGet("product/{name}")]
        public async Task<IActionResult> Product(string name)
        {
            try
            {
                using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                // ИСПРАВЛЕНО: используем compound вместо ingredients
                string sql = "SELECT id, photo, name, stars, cost, compound, sizes, description FROM public.catalog WHERE LOWER(name) = LOWER(@name)";

                using var cmd = new NpgsqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@name", name);

                using var reader = await cmd.ExecuteReaderAsync();

                if (await reader.ReadAsync())
                {
                    var product = new CatalogItem
                    {
                        Id = reader.GetInt32(0),
                        Photo = reader.GetString(1),
                        Name = reader.GetString(2),
                        Stars = reader.IsDBNull(3) ? 0 : reader.GetFloat(3),
                        Cost = reader.GetInt32(4),
                        Ingredients = reader.IsDBNull(5) ? null : reader.GetString(5), // compound
                        Sizes = reader.IsDBNull(6) ? null : reader.GetString(6),
                        Description = reader.IsDBNull(7) ? null : reader.GetString(7)
                    };

                    // Отладка
                    Console.WriteLine($"Загружен продукт: ID={product.Id}, Name={product.Name}");

                    return View(product);
                }

                return NotFound($"Товар с названием '{name}' не найден");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка: {ex.Message}");
                return StatusCode(500, $"Ошибка: {ex.Message}");
            }
        }
    }
}