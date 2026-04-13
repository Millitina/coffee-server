// UserController.cs
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace WebServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly string _connectionString;

        public UserController(IConfiguration configuration)
        {
            _connectionString = "Server=coffee-db-eddpfy;Port=5432;Database=coffee;" +
                               "User Id=postgres;Password=root;";
        }

        // GET: api/user/{catalogId}
        [HttpGet("{catalogId}")]
        public async Task<IActionResult> GetReviews(int catalogId)
        {
            try
            {
                using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                string sql = @"
                    SELECT id, name, text, stars, created_at 
                    FROM public.reviews 
                    WHERE catalog_id = @catalogId 
                    ORDER BY created_at DESC";

                using var cmd = new NpgsqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@catalogId", catalogId);

                using var reader = await cmd.ExecuteReaderAsync();
                var reviews = new List<object>();

                while (await reader.ReadAsync())
                {
                    reviews.Add(new
                    {
                        Id = reader.GetInt32(0),
                        UserName = reader.GetString(1),
                        Text = reader.GetString(2),
                        Stars = reader.GetInt32(3),
                        Date = reader.GetDateTime(4)
                    });
                }

                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // POST: api/user
        [HttpPost]
        public async Task<IActionResult> AddReview([FromBody] ReviewRequest review)
        {
            try
            {
                if (review == null)
                {
                    return BadRequest(new { error = "Данные отзыва не могут быть пустыми" });
                }

                // Валидация
                if (string.IsNullOrWhiteSpace(review.Name))
                {
                    return BadRequest(new { error = "Имя обязательно" });
                }

                if (string.IsNullOrWhiteSpace(review.Text))
                {
                    return BadRequest(new { error = "Текст отзыва обязателен" });
                }

                if (review.Stars < 1 || review.Stars > 5)
                {
                    return BadRequest(new { error = "Оценка должна быть от 1 до 5" });
                }

                if (review.CatalogId <= 0)
                {
                    return BadRequest(new { error = "ID продукта не может быть пустым" });
                }

                using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                string sql = @"
                    INSERT INTO public.reviews (name, text, stars, catalog_id, created_at)
                    VALUES (@name, @text, @stars, @catalogId, @createdAt)
                    RETURNING id";

                using var cmd = new NpgsqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@name", review.Name.Trim());
                cmd.Parameters.AddWithValue("@text", review.Text.Trim());
                cmd.Parameters.AddWithValue("@stars", review.Stars);
                cmd.Parameters.AddWithValue("@catalogId", review.CatalogId);
                cmd.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);

                var newId = Convert.ToInt32(await cmd.ExecuteScalarAsync());

                return Ok(new
                {
                    id = newId,
                    message = "Отзыв успешно добавлен"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Ошибка сервера: {ex.Message}" });
            }
        }
    }

    public class ReviewRequest
    {
        public string Name { get; set; }
        public string Text { get; set; }
        public int Stars { get; set; }
        public int CatalogId { get; set; }
    }
}