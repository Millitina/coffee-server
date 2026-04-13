namespace WebServer.Models
{
    public class CatalogItem
    {
        public int Id { get; set; }
        public string Photo { get; set; }
        public string Name { get; set; }
        public float Stars { get; set; }
        public int Cost { get; set; }
        public string Ingredients { get; set; }
        public string Sizes { get; set; }
        public string Description { get; set; }
    }

    public class AddCatalogResponse
    {
        public int Id { get; set; }
        public string Message { get; set; }
    }
}
