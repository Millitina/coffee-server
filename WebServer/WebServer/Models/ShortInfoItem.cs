namespace WebServer.Models
{
    public class ShortInfoItem
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public float Rating { get; set; }
        public string[] Ingredients { get; set; }
        public string[] Sizes { get; set; }
    }
}
