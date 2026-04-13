namespace WebServer.Models
{
    public class AddReviewRequest
    {
        public string? Name { get; set; }
        public string Text { get; set; } = string.Empty;
        public int Stars { get; set; }
        public int CatalogId { get; set; }
    }
}
