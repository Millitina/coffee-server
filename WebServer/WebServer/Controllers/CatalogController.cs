using Microsoft.AspNetCore.Mvc;
using Npgsql;
using WebServer.Models;

namespace WebServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CatalogController : ControllerBase
    {
        private readonly string _connectionString;

        public CatalogController(IConfiguration configuration)
        {
            _connectionString = "Server=coffee;Port=5432;Database=coffee;" +
                               "User Id=postgres;Password=root;";
        }

        // Get запросы
        [HttpGet]
        public async Task<IActionResult> GetCatalog()
        {
            var products = new List<object>();

            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            string sql = "SELECT id, photo, name, stars, cost, ingredients, sizes, description FROM public.catalog ORDER BY id";

            using var cmd = new NpgsqlCommand(sql, conn);
            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                products.Add(new
                {
                    Id = reader.GetInt32(0),
                    Photo = reader.GetString(1),
                    Name = reader.GetString(2),
                    Stars = reader.IsDBNull(3) ? 0 : reader.GetFloat(3),
                    Cost = reader.GetInt32(4),
                    Ingredients = reader.IsDBNull(5) ? null : reader.GetString(5),
                    Sizes = reader.IsDBNull(6) ? null : reader.GetString(6),
                    Description = reader.IsDBNull(7) ? null : reader.GetString(7)
                });
            }

            return Ok(products);
        }

        [HttpGet("short/info")]
        public async Task<IActionResult> GetShortInfo([FromQuery] string name)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            string sql = "SELECT id, name, stars, compound, sizes FROM public.\"catalog\" WHERE LOWER(name) = LOWER(@name)";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@name", name);

            using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                var item = new ShortInfoItem
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1),
                    Rating = reader.GetFloat(2),
                    Ingredients = Utils.ParseStringToArray(reader.GetString(3)),
                    Sizes = Utils.ParseStringToArray(reader.GetString(4))
                };

                return Ok(item);
            }

            return NotFound($"Запись с name = '{name}' не найдена");
        }

        [HttpGet("filter")]
        public async Task<IActionResult> FilterProducts(
            [FromQuery] string? size,
            [FromQuery] int? minRating,
            [FromQuery] int? maxRating,
            [FromQuery] string? ingredient,
            [FromQuery] int? minPrice,
            [FromQuery] int? maxPrice)
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            string sql = @"SELECT id, photo, name, stars, cost, compound, sizes, description 
                   FROM public.catalog WHERE 1=1";
            var parameters = new List<NpgsqlParameter>();

            if (!string.IsNullOrEmpty(size))
            {
                sql += " AND sizes ILIKE @size";
                parameters.Add(new NpgsqlParameter("@size", $"%{size}%"));
            }

            if (minRating.HasValue)
            {
                sql += " AND CAST(stars AS INTEGER) >= @minRating";
                parameters.Add(new NpgsqlParameter("@minRating", minRating.Value));
            }

            if (maxRating.HasValue)
            {
                sql += " AND CAST(stars AS INTEGER) <= @maxRating";
                parameters.Add(new NpgsqlParameter("@maxRating", maxRating.Value));
            }

            if (!string.IsNullOrEmpty(ingredient))
            {
                sql += " AND ingredients ILIKE @ingredient";
                parameters.Add(new NpgsqlParameter("@ingredient", $"%{ingredient}%"));
            }

            if (minPrice.HasValue)
            {
                sql += " AND cost >= @minPrice";
                parameters.Add(new NpgsqlParameter("@minPrice", minPrice.Value));
            }

            if (maxPrice.HasValue)
            {
                sql += " AND cost <= @maxPrice";
                parameters.Add(new NpgsqlParameter("@maxPrice", maxPrice.Value));
            }

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddRange(parameters.ToArray());

            using var reader = await cmd.ExecuteReaderAsync();
            var products = new List<object>();

            while (await reader.ReadAsync())
            {
                products.Add(new
                {
                    Id = reader.GetInt32(0),
                    Photo = reader.GetString(1),
                    Name = reader.GetString(2),
                    Stars = reader.IsDBNull(3) ? 0 : reader.GetFloat(3),
                    Cost = reader.GetInt32(4),
                    Ingredients = reader.IsDBNull(5) ? null : Utils.ParseStringToArray(reader.GetString(5)),
                    Sizes = Utils.ParseStringToArray(reader.GetString(6)),
                    Description = reader.IsDBNull(7) ? "" : reader.GetString(7)
                });
            }

            return Ok(products);
        }

        [HttpGet("filter/criteria")]
        public async Task<IActionResult> GetFilterCriteria()
        {
            try
            {
                using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                var allSizes = new HashSet<string>();
                var allIngredients = new HashSet<string>();
                int minPrice = 0, maxPrice = 1000;
                float minRating = 1, maxRating = 5;

                string sizesSql = "SELECT DISTINCT sizes FROM public.catalog WHERE sizes IS NOT NULL AND sizes != ''";
                using (var sizesCmd = new NpgsqlCommand(sizesSql, conn))
                using (var sizesReader = await sizesCmd.ExecuteReaderAsync())
                {
                    while (await sizesReader.ReadAsync())
                    {
                        if (!sizesReader.IsDBNull(0))
                        {
                            var sizes = Utils.ParseStringToArray(sizesReader.GetString(0));
                            foreach (var s in sizes)
                            {
                                allSizes.Add(s.Trim());
                            }
                        }
                    }
                }

                string ingredientsSql = "SELECT DISTINCT ingredients FROM public.catalog WHERE ingredients IS NOT NULL AND ingredients != ''";
                using (var ingredientsCmd = new NpgsqlCommand(ingredientsSql, conn))
                using (var ingredientsReader = await ingredientsCmd.ExecuteReaderAsync())
                {
                    while (await ingredientsReader.ReadAsync())
                    {
                        if (!ingredientsReader.IsDBNull(0))
                        {
                            var ingredients = Utils.ParseStringToArray(ingredientsReader.GetString(0));
                            foreach (var ingredient in ingredients)
                            {
                                allIngredients.Add(ingredient.Trim());
                            }
                        }
                    }
                }

                string priceSql = "SELECT MIN(cost), MAX(cost) FROM public.catalog";
                using (var priceCmd = new NpgsqlCommand(priceSql, conn))
                using (var priceReader = await priceCmd.ExecuteReaderAsync())
                {
                    if (await priceReader.ReadAsync())
                    {
                        minPrice = priceReader.IsDBNull(0) ? 0 : priceReader.GetInt32(0);
                        maxPrice = priceReader.IsDBNull(1) ? 1000 : priceReader.GetInt32(1);
                    }
                }

                string ratingSql = @"
            SELECT 
                MIN(CAST(NULLIF(stars, '') AS FLOAT)), 
                MAX(CAST(NULLIF(stars, '') AS FLOAT)) 
            FROM public.catalog 
            WHERE stars IS NOT NULL AND stars != ''";

                using (var ratingCmd = new NpgsqlCommand(ratingSql, conn))
                using (var ratingReader = await ratingCmd.ExecuteReaderAsync())
                {
                    if (await ratingReader.ReadAsync())
                    {
                        minRating = ratingReader.IsDBNull(0) ? 1.0f : (float)ratingReader.GetDouble(0);
                        maxRating = ratingReader.IsDBNull(1) ? 5.0f : (float)ratingReader.GetDouble(1);
                    }
                }

                return Ok(new
                {
                    Sizes = allSizes.OrderBy(s => s).ToList(),
                    Ingredients = allIngredients.OrderBy(i => i).ToList(),
                    PriceRange = new { Min = minPrice, Max = maxPrice },
                    RatingRange = new { Min = minRating, Max = maxRating }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка в /api/catalog/filter/criteria: {ex.Message}");
                return Problem($"Ошибка при получении критериев: {ex.Message}", statusCode: 500);
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchProducts([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return Ok(new List<object>());
            }

            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            string sql = @"
    SELECT id, photo, name, stars, cost, ingredients, sizes, description
    FROM public.catalog 
    WHERE name ILIKE @query
    ORDER BY
        CASE
            WHEN name ILIKE @exact THEN 1
            WHEN name ILIKE @startsWith THEN 2
            ELSE 3
        END,
        name
    LIMIT 10";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@query", $"%{query}%");
            cmd.Parameters.AddWithValue("@exact", query);
            cmd.Parameters.AddWithValue("@startsWith", $"{query}%");

            using var reader = await cmd.ExecuteReaderAsync();
            var suggestions = new List<object>();

            while (await reader.ReadAsync())
            {
                suggestions.Add(new
                {
                    Id = reader.GetInt32(0),
                    Photo = reader.GetString(1),
                    Name = reader.GetString(2),
                    Stars = reader.IsDBNull(3) ? 0 : reader.GetFloat(3),
                    Cost = reader.GetInt32(4),
                    Ingredients = reader.IsDBNull(5) ? null : reader.GetString(5),
                    Sizes = reader.IsDBNull(6) ? null : reader.GetString(6),
                    Description = reader.IsDBNull(7) ? null : reader.GetString(7)
                });
            }

            return Ok(suggestions);
        }

        [HttpGet("suggest")]
        public async Task<IActionResult> SuggestProducts([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return Ok(new List<object>());
            }

            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            string sql = "SELECT id, photo, name, stars, cost, ingredients, sizes, description FROM public.catalog WHERE name ILIKE @query ORDER BY name LIMIT 5";

            using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@query", $"%{query}%");

            using var reader = await cmd.ExecuteReaderAsync();
            var suggestions = new List<object>();

            while (await reader.ReadAsync())
            {
                suggestions.Add(new
                {
                    Id = reader.GetInt32(0),
                    Photo = reader.GetString(1),
                    Name = reader.GetString(2),
                    Stars = reader.IsDBNull(3) ? 0 : reader.GetFloat(3),
                    Cost = reader.GetInt32(4),
                    Ingredients = reader.IsDBNull(5) ? null : reader.GetString(5),
                    Sizes = reader.IsDBNull(6) ? null : reader.GetString(6),
                    Description = reader.IsDBNull(7) ? null : reader.GetString(7)
                });
            }

            return Ok(suggestions);
        }

        // POST запросы
        [HttpPost]
        public async Task<IActionResult> AddCatalog([FromBody] CatalogItem catalogItem)
        {
            try
            {
                // Проверка на null запроса
                if (catalogItem == null)
                {
                    return BadRequest(new { error = "Тело запроса не может быть пустым" });
                }

                var validationErrors = new List<string>();

                // Проверка Photo
                if (string.IsNullOrWhiteSpace(catalogItem.Photo))
                {
                    validationErrors.Add("Поле 'Photo' обязательно для заполнения");
                }

                // Проверка Name
                if (string.IsNullOrWhiteSpace(catalogItem.Name))
                {
                    validationErrors.Add("Поле 'Name' обязательно для заполнения");
                }
                else if (catalogItem.Name.Length < 2 || catalogItem.Name.Length > 100)
                {
                    validationErrors.Add("Поле 'Name' должно содержать от 2 до 100 символов");
                }

                // Проверка Cost
                if (catalogItem.Cost <= 0)
                {
                    validationErrors.Add("Поле 'Cost' должно быть положительным числом");
                }
                else if (catalogItem.Cost > 100000)
                {
                    validationErrors.Add("Поле 'Cost' не может превышать 100 000");
                }

                // Проверка Stars
                if (catalogItem.Stars < 0 || catalogItem.Stars > 5)
                {
                    validationErrors.Add("Оценка должна быть в диапазоне от 0 до 5");
                }

                // Проверка Ingredients
                if (!string.IsNullOrWhiteSpace(catalogItem.Ingredients))
                {
                    if (catalogItem.Ingredients.Length > 500)
                    {
                        validationErrors.Add("Поле 'Ingredients' не может превышать 500 символов");
                    }
                }

                // Проверка Sizes
                if (string.IsNullOrWhiteSpace(catalogItem.Sizes))
                {
                    validationErrors.Add("Поле 'Sizes' обязательно для заполнения");
                }
                else
                {
                    // Проверка формата размеров (ожидается строка с размерами через запятую)
                    var sizes = catalogItem.Sizes.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                                 .Select(s => s.Trim())
                                                 .ToList();

                    if (!sizes.Any())
                    {
                        validationErrors.Add("Поле 'Sizes' должно содержать хотя бы один размер");
                    }
                    else
                    {
                        var validSizes = new[] { "S", "M", "L" };
                        foreach (var size in sizes)
                        {
                            if (!validSizes.Contains(size))
                            {
                                validationErrors.Add($"Размер '{size}' недопустим. Допустимые размеры: {string.Join(", ", validSizes)}");
                            }
                        }
                    }
                }

                // Проверка Description (необязательное поле)
                if (!string.IsNullOrWhiteSpace(catalogItem.Description))
                {
                    if (catalogItem.Description.Length > 1000)
                    {
                        validationErrors.Add("Поле 'Description' не может превышать 1000 символов");
                    }
                }

                // Если есть ошибки валидации, возвращаем их
                if (validationErrors.Any())
                {
                    return BadRequest(new { errors = validationErrors });
                }

                using (var checkConn = new NpgsqlConnection(_connectionString))
                {
                    await checkConn.OpenAsync();
                    string checkSql = "SELECT COUNT(*) FROM public.catalog WHERE LOWER(name) = LOWER(@name)";

                    using var checkCmd = new NpgsqlCommand(checkSql, checkConn);
                    checkCmd.Parameters.AddWithValue("@name", catalogItem.Name.Trim());

                    var existingCount = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());

                    if (existingCount > 0)
                    {
                        return Conflict(new { error = $"Каталог с названием '{catalogItem.Name}' уже существует" });
                    }
                }


                using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                // Начинаем транзакцию
                using var transaction = await conn.BeginTransactionAsync();

                try
                {
                    string insertSql = @"
                        INSERT INTO public.catalog 
                        (photo, name, stars, cost, ingredients, sizes, description) 
                        VALUES 
                        (@photo, @name, @stars, @cost, @ingredients, @sizes, @description)
                        RETURNING id";

                    using var cmd = new NpgsqlCommand(insertSql, conn, transaction);

                    cmd.Parameters.AddWithValue("@photo", catalogItem.Photo.Trim());
                    cmd.Parameters.AddWithValue("@name", catalogItem.Name.Trim());
                    cmd.Parameters.AddWithValue("@stars", catalogItem.Stars);
                    cmd.Parameters.AddWithValue("@cost", catalogItem.Cost);
                    cmd.Parameters.AddWithValue("@ingredients",
                        string.IsNullOrWhiteSpace(catalogItem.Ingredients) ? DBNull.Value : catalogItem.Ingredients.Trim());
                    cmd.Parameters.AddWithValue("@sizes", catalogItem.Sizes.Trim());
                    cmd.Parameters.AddWithValue("@description",
                        string.IsNullOrWhiteSpace(catalogItem.Description) ? DBNull.Value : catalogItem.Description.Trim());

                    var newId = Convert.ToInt32(await cmd.ExecuteScalarAsync());

                    await transaction.CommitAsync();

                    return Ok(new AddCatalogResponse
                    {
                        Id = newId,
                        Message = "Каталог успешно добавлен"
                    });
                }
                catch
                {
                    // В случае ошибки откатываем транзакцию
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (PostgresException pgEx)
            {
                // Обработка ошибок PostgreSQL
                return StatusCode(500, new { error = $"Ошибка базы данных: {pgEx.Message}" });
            }
            catch (Exception ex)
            {
                // Обработка общих ошибок
                return StatusCode(500, new { error = $"Внутренняя ошибка сервера: {ex.Message}" });
            }
        }
        [HttpPost("create")]
        public async Task<IActionResult> CreateCatalog([FromBody] CatalogItem catalogItem)
        {
            try
            {
                // Проверка на null запроса
                if (catalogItem == null)
                {
                    return BadRequest(new { error = "Тело запроса не может быть пустым" });
                }

                var validationErrors = new List<string>();

                // Проверка Photo
                if (string.IsNullOrWhiteSpace(catalogItem.Photo))
                {
                    validationErrors.Add("Поле 'Photo' обязательно для заполнения");
                }

                // Проверка Name
                if (string.IsNullOrWhiteSpace(catalogItem.Name))
                {
                    validationErrors.Add("Поле 'Name' обязательно для заполнения");
                }
                else if (catalogItem.Name.Length < 2 || catalogItem.Name.Length > 100)
                {
                    validationErrors.Add("Поле 'Name' должно содержать от 2 до 100 символов");
                }

                // Проверка Cost
                if (catalogItem.Cost <= 0)
                {
                    validationErrors.Add("Поле 'Cost' должно быть положительным числом");
                }
                else if (catalogItem.Cost > 100000)
                {
                    validationErrors.Add("Поле 'Cost' не может превышать 100 000");
                }

                // Проверка Stars
                if (catalogItem.Stars < 0 || catalogItem.Stars > 5)
                {
                    validationErrors.Add("Оценка должна быть в диапазоне от 0 до 5");
                }

                // Проверка Ingredients
                if (!string.IsNullOrWhiteSpace(catalogItem.Ingredients))
                {
                    if (catalogItem.Ingredients.Length > 500)
                    {
                        validationErrors.Add("Поле 'Ingredients' не может превышать 500 символов");
                    }
                }

                // Проверка Sizes
                if (string.IsNullOrWhiteSpace(catalogItem.Sizes))
                {
                    validationErrors.Add("Поле 'Sizes' обязательно для заполнения");
                }
                else
                {
                    // Проверка формата размеров (ожидается строка с размерами через запятую)
                    var sizes = catalogItem.Sizes.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                                 .Select(s => s.Trim())
                                                 .ToList();

                    if (!sizes.Any())
                    {
                        validationErrors.Add("Поле 'Sizes' должно содержать хотя бы один размер");
                    }
                    else
                    {
                        var validSizes = new[] { "S", "M", "L" };
                        foreach (var size in sizes)
                        {
                            if (!validSizes.Contains(size))
                            {
                                validationErrors.Add($"Размер '{size}' недопустим. Допустимые размеры: {string.Join(", ", validSizes)}");
                            }
                        }
                    }
                }

                // Проверка Description (необязательное поле)
                if (!string.IsNullOrWhiteSpace(catalogItem.Description))
                {
                    if (catalogItem.Description.Length > 1000)
                    {
                        validationErrors.Add("Поле 'Description' не может превышать 1000 символов");
                    }
                }

                // Если есть ошибки валидации, возвращаем их
                if (validationErrors.Any())
                {
                    return BadRequest(new { errors = validationErrors });
                }

                // Проверка на существование товара с таким же названием
                using (var checkConn = new NpgsqlConnection(_connectionString))
                {
                    await checkConn.OpenAsync();
                    string checkSql = "SELECT COUNT(*) FROM public.catalog WHERE LOWER(name) = LOWER(@name)";

                    using var checkCmd = new NpgsqlCommand(checkSql, checkConn);
                    checkCmd.Parameters.AddWithValue("@name", catalogItem.Name.Trim());

                    var existingCount = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());

                    if (existingCount > 0)
                    {
                        return Conflict(new { error = $"Товар с названием '{catalogItem.Name}' уже существует" });
                    }
                }

                // Вставка нового товара
                using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                // Начинаем транзакцию
                using var transaction = await conn.BeginTransactionAsync();

                try
                {
                    string insertSql = @"
                        INSERT INTO public.catalog 
                        (photo, name, stars, cost, compound, sizes, description) 
                        VALUES 
                        (@photo, @name, @stars, @cost, @ingredients, @sizes, @description)
                        RETURNING id";

                    using var cmd = new NpgsqlCommand(insertSql, conn, transaction);

                    cmd.Parameters.AddWithValue("@photo", catalogItem.Photo.Trim());
                    cmd.Parameters.AddWithValue("@name", catalogItem.Name.Trim());
                    cmd.Parameters.AddWithValue("@stars", catalogItem.Stars);
                    cmd.Parameters.AddWithValue("@cost", catalogItem.Cost);
                    cmd.Parameters.AddWithValue("@ingredients",
                        string.IsNullOrWhiteSpace(catalogItem.Ingredients) ? DBNull.Value : catalogItem.Ingredients.Trim());
                    cmd.Parameters.AddWithValue("@sizes", catalogItem.Sizes.Trim());
                    cmd.Parameters.AddWithValue("@description",
                        string.IsNullOrWhiteSpace(catalogItem.Description) ? DBNull.Value : catalogItem.Description.Trim());

                    var newId = Convert.ToInt32(await cmd.ExecuteScalarAsync());

                    await transaction.CommitAsync();

                    return Ok(new AddCatalogResponse
                    {
                        Id = newId,
                        Message = "Товар успешно добавлен в каталог"
                    });
                }
                catch
                {
                    // В случае ошибки откатываем транзакцию
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (PostgresException pgEx)
            {
                // Обработка ошибок PostgreSQL
                return StatusCode(500, new { error = $"Ошибка базы данных: {pgEx.Message}" });
            }
            catch (Exception ex)
            {
                // Обработка общих ошибок
                return StatusCode(500, new { error = $"Внутренняя ошибка сервера: {ex.Message}" });
            }
        }
    }
}

